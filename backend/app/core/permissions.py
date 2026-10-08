import uuid
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise UnauthorizedException("Authentication token is missing")

    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token")

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Token payload missing subject")

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Malformed user identifier in token")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise UnauthorizedException("User no longer exists")

    if not user.is_active:
        raise ForbiddenException("User account is inactive")

    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise ForbiddenException("Administrator privileges required")
    return current_user

def require_patient(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "patient":
        raise ForbiddenException("Patient role required")
    return current_user

def verify_patient_access(patient_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> None:
    if current_user.role == "admin":
        return
    if current_user.id != patient_id:
        raise ForbiddenException("Access denied to another patient's data")
