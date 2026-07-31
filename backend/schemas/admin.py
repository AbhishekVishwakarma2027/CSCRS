from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DepartmentAdminCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str | None = None

    department_id: int


class DepartmentAdminResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    name: str

    email: EmailStr

    phone: str | None

    department_id: int


class DepartmentAdminActivationRequest(BaseModel):

    token: str

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class DepartmentAdminActivationResponse(BaseModel):

    message: str