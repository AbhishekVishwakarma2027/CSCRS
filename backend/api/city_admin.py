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
    CityAdminCitizenResponse,
    CityAdminDepartmentAdminResponse,
)
from authentication.dependencies import require_city_admin
from services.city_admin_service import CityAdminService
from schemas.city_admin import BlockCitizenRequest
from schemas.city_admin import BlockDepartmentAdminRequest,BlockCityAdminRequest

router = APIRouter(
    prefix="/city-admins",
    tags=["City Admin"],
)

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
@router.get(
    "/citizens",
    response_model=list[CityAdminCitizenResponse],
    summary="List All Citizens",
)
def get_citizens(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_city_admin()),
):
    service = CityAdminService(db)

    return service.get_citizens()

@router.get(
    "/department-admins",
    response_model=list[CityAdminDepartmentAdminResponse],
    summary="List All Department Admins",
)
def get_department_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_city_admin()),
):
    service = CityAdminService(db)

    return service.get_department_admins()

@router.patch(
    "/citizens/{citizen_id}/block",
    summary="Block Citizen",
)

def block_citizen(
    citizen_id: int,
    request: BlockCitizenRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_city_admin()),
):

    service = CityAdminService(db)

    return service.block_citizen(
        citizen_id=citizen_id,
        current_user=current_user,
        block_type=request.block_type,
        reason=request.reason,
    ) 
@router.patch(
    "/citizens/{citizen_id}/unblock",
    summary="Unblock Citizen",
)
def unblock_citizen(
    citizen_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_city_admin()),
):

    service = CityAdminService(db)

    return service.unblock_citizen(
        citizen_id=citizen_id,
    )
@router.patch(
    "/department-admins/{admin_id}/block",
    summary="Block Department Admin",
)
def block_department_admin(
    admin_id: int,
    request: BlockDepartmentAdminRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_city_admin()),
):

    return CityAdminService(db).block_department_admin(
        admin_id=admin_id,
        current_user=current_user,
        block_type=request.block_type,
        reason=request.reason,
    )

@router.patch(
    "/department-admins/{admin_id}/unblock",
    summary="Unblock Department Admin",
)
def unblock_department_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_city_admin()),
):

    return CityAdminService(db).unblock_department_admin(
        admin_id=admin_id,
        current_user=current_user,
    )
@router.patch(
    "/admins/{admin_id}/block",
    summary="Block City Admin",
)
def block_city_admin(
    admin_id: int,
    request: BlockCityAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):

    return CityAdminService(db).block_city_admin(
        admin_id=admin_id,
        current_user=current_user,
        block_type=request.block_type,
        reason=request.reason,
    )


@router.patch(
    "/admins/{admin_id}/unblock",
    summary="Unblock City Admin",
)
def unblock_city_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):

    return CityAdminService(db).unblock_city_admin(
        admin_id=admin_id,
        current_user=current_user,
    )