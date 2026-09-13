from pydantic import BaseModel, ConfigDict, EmailStr, Field
from database.enums import BlockType
from datetime import datetime

class CityAdminCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str | None = None


class CityAdminResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    name: str

    email: EmailStr

    phone: str | None

class CityAdminCitizenResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    name: str
    email: EmailStr
    phone: str | None

    is_active: bool
    is_email_verified: bool
    is_blocked: bool
    created_at: datetime

class CityAdminDepartmentAdminResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    name: str
    email: EmailStr
    phone: str | None

    department_id: int | None

    is_active: bool
    is_email_verified: bool
    is_blocked: bool
    created_at: datetime

class CityAdminActivationRequest(BaseModel):

    token: str

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class CityAdminActivationResponse(BaseModel):

    message: str

class BlockCitizenRequest(BaseModel):

    block_type: BlockType

    reason: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Reason for blocking the citizen account.",
    )
class BlockDepartmentAdminRequest(BaseModel):

    block_type: BlockType

    reason: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Reason for blocking the department admin account.",
    )
class BlockCityAdminRequest(BaseModel):

    block_type: BlockType

    reason: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Reason for blocking the city admin account.",
    )