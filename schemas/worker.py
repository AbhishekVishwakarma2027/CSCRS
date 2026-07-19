from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from database.enums import BlockType


class WorkerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    department_id: int

    employee_code: str = Field(
        min_length=2,
        max_length=30,
    )

    designation: str = Field(
        min_length=2,
        max_length=100,
    )

    phone: str | None = None

    phone_extension: str | None = None


class WorkerResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    user_id: int

    department_id: int

    employee_code: str

    designation: str

    phone_extension: str | None

    is_available: bool

from pydantic import EmailStr


class WorkerActivationRequest(BaseModel):

    token: str

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class WorkerActivationResponse(BaseModel):

    message: str

class WorkerProfileResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    user_id: int

    department_id: int

    employee_code: str

    designation: str

    phone_extension: str | None

    is_available: bool

    joined_at: datetime

class WorkerProfileUpdate(BaseModel):

    phone: str | None = None

    phone_extension: str | None = Field(
        default=None,
        max_length=20,
    )

class WorkerProfileResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    user_id: int

    name: str

    email: EmailStr

    phone: str | None

    department_id: int

    employee_code: str

    designation: str

    phone_extension: str | None

    is_available: bool

    joined_at: datetime

class WorkerStatusResponse(BaseModel):

    message: str

class BlockWorkerRequest(BaseModel):

    block_type: BlockType

    reason: str = Field(
        min_length=5,
        max_length=500,
    )