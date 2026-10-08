import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    consent_agreed: bool = Field(..., description="Must acknowledge consent and disclaimer")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MFAChallengeResponse(BaseModel):
    mfa_required: bool = True
    challenge_id: str
    message: str = "A one-time verification code has been generated. Check console or email."

class MFAVerifyRequest(BaseModel):
    challenge_id: str
    otp: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: uuid.UUID
    full_name: str
    email: str

class RefreshRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    mfa_enabled: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminCreatePatientRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    initial_password: Optional[str] = None
    date_of_birth: Optional[str] = None
    is_active: bool = True
