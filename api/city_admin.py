from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from authentication.dependencies import require_super_admin
from database.dependencies import get_db
from database.models.user import User

from schemas.city_admin import (
    CityAdminCreate,
    CityAdminResponse,
    CityAdminActivationRequest,
    CityAdminActivationResponse,
)

from services.city_admin_service import CityAdminService

router = APIRouter(
    prefix="/city-admins",
    tags=["City Admin"],
)


@router.get("/health")
def health():

    return {
        "success": True,
        "message": "City Admin Module Ready",
    }


@router.post(
    "",
    response_model=CityAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_city_admin(
    request: CityAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_super_admin()
    ),
):

    service = CityAdminService(db)

    try:

        return service.create_city_admin(request)

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.post(
    "/activate",
    response_model=CityAdminActivationResponse,
)
def activate_city_admin(
    request: CityAdminActivationRequest,
    db: Session = Depends(get_db),
):

    service = CityAdminService(db)

    try:

        return service.activate_city_admin(
            token=request.token,
            password=request.password,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )