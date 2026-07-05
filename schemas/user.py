from pydantic import BaseModel, ConfigDict, EmailStr, Field

from database.enums import UserRole


class UserCreate(BaseModel):

    name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    phone: str | None = None

    password: str = Field(min_length=8)


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


class MessageResponse(BaseModel):
    message: str

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