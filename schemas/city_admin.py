from pydantic import BaseModel, ConfigDict, EmailStr, Field


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


class CityAdminActivationRequest(BaseModel):

    token: str

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class CityAdminActivationResponse(BaseModel):

    message: str