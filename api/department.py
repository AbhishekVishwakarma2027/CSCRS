from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from authentication.dependencies import require_roles

from database.dependencies import get_db
from database.enums import UserRole
from database.models.user import User

from schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
)

from services.department_service import DepartmentService
from schemas.department import (
    DepartmentStatusResponse,
)

router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)

@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    request: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
        )
    ),
):

    service = DepartmentService(db)

    try:

        return service.create_department(
            request,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
@router.get(
    "",
    response_model=list[DepartmentResponse],
)
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.CITY_ADMIN,
        )
    ),
):

    return DepartmentService(
        db,
    ).get_departments()
@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.CITY_ADMIN,
        )
    ),
):

    service = DepartmentService(db)

    try:

        return service.get_department(
            department_id,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
@router.patch(
    "/{department_id}/activate",
    response_model=DepartmentStatusResponse,
)
def activate_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.CITY_ADMIN,
        )
    ),
):

    service = DepartmentService(db)

    try:

        return service.activate_department(
            department_id,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
@router.patch(
    "/{department_id}/deactivate",
    response_model=DepartmentStatusResponse,
)
def deactivate_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.CITY_ADMIN,
        )
    ),
):

    service = DepartmentService(db)

    try:

        return service.deactivate_department(
            department_id,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )