import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp_code,
    hash_otp_code,
    verify_otp_code
)
from app.core.permissions import get_current_user
from app.core.exceptions import UnauthorizedException, BadRequestException
from app.models.user import User, PatientProfile, OTPCode, ConsentRecord
from app.models.audit import AuditLog
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    MFAChallengeResponse,
    MFAVerifyRequest,
    TokenResponse,
    RefreshRequest,
    ChangePasswordRequest,
    UserResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.consent_agreed:
        raise BadRequestException("You must acknowledge consent and safety disclaimer to register.")

    normalized_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise BadRequestException("An account with this email address already exists.")

    new_user = User(
        id=uuid.uuid4(),
        email=normalized_email,
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role="patient",  # Strictly force patient role
        is_active=True,
        is_verified=True,
        mfa_enabled=False
    )
    db.add(new_user)
    db.flush()

    patient_profile = PatientProfile(
        id=uuid.uuid4(),
        user_id=new_user.id,
        profile_preferences={"practice_goals": []}
    )
    db.add(patient_profile)

    consent = ConsentRecord(
        id=uuid.uuid4(),
        user_id=new_user.id,
        consent_type="patient_registration_consent",
        consent_version="1.0",
        accepted_status=True
    )
    db.add(consent)

    audit = AuditLog(
        actor_user_id=new_user.id,
        action="user_registered",
        entity_type="users",
        entity_id=str(new_user.id),
        metadata_json={"email": normalized_email, "role": "patient"}
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(new_user.id, role=new_user.role)
    refresh_token = create_refresh_token(new_user.id, role=new_user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=new_user.role,
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email
    )

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated. Contact administrator.")

    # Check Admin MFA
    if user.role == "admin" and user.mfa_enabled:
        otp_plain = generate_otp_code(6)
        otp_hash = hash_otp_code(otp_plain)
        expires_at = datetime.utcnow() + timedelta(minutes=5)

        # Invalidate previous unexpired OTPs
        db.query(OTPCode).filter(
            OTPCode.user_id == user.id,
            OTPCode.purpose == "mfa_login",
            OTPCode.is_used == False
        ).update({"is_used": True})

        challenge = OTPCode(
            id=uuid.uuid4(),
            user_id=user.id,
            otp_hash=otp_hash,
            purpose="mfa_login",
            expires_at=expires_at,
            attempts=0,
            max_attempts=5,
            is_used=False
        )
        db.add(challenge)
        db.commit()

        # Development OTP delivery log (Console email sink)
        print(f"\n==================================================")
        print(f" [VIRELIA MFA CODE] User: {user.email}")
        print(f" [VIRELIA MFA CODE] Code: {otp_plain}")
        print(f" [VIRELIA MFA CODE] Challenge ID: {challenge.id}")
        print(f"==================================================\n")

        return {
            "mfa_required": True,
            "challenge_id": str(challenge.id),
            "message": "A 6-digit verification code has been issued. Check development console or email."
        }

    # Standard direct login (Patients or MFA-exempt)
    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/verify-mfa", response_model=TokenResponse)
def verify_mfa(req: MFAVerifyRequest, db: Session = Depends(get_db)):
    try:
        challenge_uuid = uuid.UUID(req.challenge_id)
    except ValueError:
        raise BadRequestException("Invalid challenge ID")

    otp_record = db.query(OTPCode).filter(OTPCode.id == challenge_uuid).first()
    if not otp_record or otp_record.is_used:
        raise BadRequestException("Invalid or already used verification challenge")

    if otp_record.expires_at < datetime.utcnow():
        raise BadRequestException("Verification code has expired. Please log in again.")

    if otp_record.attempts >= otp_record.max_attempts:
        otp_record.is_used = True
        db.commit()
        raise BadRequestException("Maximum verification attempts exceeded. Please log in again.")

    otp_record.attempts += 1

    if not verify_otp_code(req.otp.strip(), otp_record.otp_hash):
        db.commit()
        raise BadRequestException(f"Invalid verification code. {otp_record.max_attempts - otp_record.attempts} attempts remaining.")

    otp_record.is_used = True
    user = db.query(User).filter(User.id == otp_record.user_id).first()
    if not user:
        raise UnauthorizedException("User not found")

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid or expired refresh token")

    user_id_str = payload.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id_str)).first()
    if not user or not user.is_active:
        raise UnauthorizedException("User no longer valid")

    access_token = create_access_token(user.id, role=user.role)
    new_refresh = create_refresh_token(user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, current_user.password_hash):
        raise BadRequestException("Current password does not match.")

    current_user.password_hash = get_password_hash(req.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
