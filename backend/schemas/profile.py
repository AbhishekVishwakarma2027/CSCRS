from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)
from datetime import datetime
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

    department_id: int | None = None

    employee_code: str | None = None

    designation: str | None = None

    phone_extension: str | None = None

    joined_at: datetime | None = None

    is_available: bool | None = None

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