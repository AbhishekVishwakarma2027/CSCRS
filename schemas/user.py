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