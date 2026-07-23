from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)
import re
from datetime import datetime
from database.enums import UserRole


class UserCreate(BaseModel):

    name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    phone: str 

    password: str = Field(min_length=8)

    @field_validator("phone")
    @classmethod
    def validate_phone(
        cls,
        value: str,
    ):
        value = value.strip()

        if not re.fullmatch(r"\d{10}", value):
            raise ValueError(
                "Phone number must be exactly 10 digits."
            )

        return value


class UserLogin(BaseModel):

    email: EmailStr

    password: str


class UserResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int

    name: str

    email: EmailStr

    phone: str | None

    role: UserRole


class Token(BaseModel):

    access_token: str

    token_type: str = "bearer"


class TokenPayload(BaseModel):

    sub: int

    role: UserRole

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str = Field(
        min_length=6,
        max_length=6,
    )


class MessageResponse(BaseModel):
    message: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )
class ChangePasswordRequest(BaseModel):

    old_password: str

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=128,
    )
class TokenResponse(BaseModel):

    access_token: str

    refresh_token: str

    token_type: str = "bearer"

    expires_in: int

class RefreshTokenRequest(BaseModel):

    refresh_token: str

class SessionResponse(BaseModel):

    id: int

    session_id: str

    device_type: str | None

    browser: str | None

    operating_system: str | None

    ip_address: str | None

    created_at: datetime

    last_used_at: datetime | None

    expires_at: datetime