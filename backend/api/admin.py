from fastapi import APIRouter
from fastapi import Depends, status
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database.dependencies import get_db
from database.models.user import User
from services.admin_service import AdminService
from schemas.admin import (
    DepartmentAdminCreate,
    DepartmentAdminResponse,
    DepartmentAdminActivationRequest,
    DepartmentAdminActivationResponse,
    DepartmentAdminWorkerResponse,
)

from authentication.dependencies import require_roles,require_department_admin
from database.enums import UserRole


router = APIRouter(
    prefix="/admins",
    tags=["Department Admin"],
)

@router.post(
    "",
    response_model=DepartmentAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_department_admin(
    admin: DepartmentAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.CITY_ADMIN,
        UserRole.SUPER_ADMIN,
    )),
):

    service = AdminService(db)

    try:

        return service.create_department_admin(admin)

    except ValueError as e:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
@router.post(
    "/activate",
    response_model=DepartmentAdminActivationResponse,
)
def activate_department_admin(
    request: DepartmentAdminActivationRequest,
    db: Session = Depends(get_db),
):

    service = AdminService(db)

    try:

        return service.activate_department_admin(
            token=request.token,
            password=request.password,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

@router.get(
    "/workers",
    response_model=list[DepartmentAdminWorkerResponse],
    summary="List Department Workers",
)
def get_department_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_admin()),
):

    service = AdminService(db)

    workers = service.get_workers(
        current_user=current_user,
    )

    return [
        DepartmentAdminWorkerResponse(
            id=worker.id,
            user_id=user.id,

            name=user.name,
            email=user.email,
            phone=user.phone,

            department_id=worker.department_id,

            employee_code=worker.employee_code,
            designation=worker.designation,
            phone_extension=worker.phone_extension,

            is_available=worker.is_available,

            is_active=user.is_active,
            is_email_verified=user.is_email_verified,
            is_blocked=user.is_blocked,

            joined_at=worker.joined_at,
        )
        for worker, user in workers
    ]
