from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)

from database.enums import UserRole


class ProfileResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    name: str

    email: EmailStr

    phone: str | None

    role: UserRole

    profile_image: str | None

    is_email_verified: bool

    is_active: bool


class UpdateProfileRequest(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        min_length=10,
        max_length=15,
    )