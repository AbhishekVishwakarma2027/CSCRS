from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from database.dependencies import get_db
from authentication.dependencies import get_current_user
from database.models.user import User
from database.enums import UserRole
from schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
)
from fastapi import Query
from services.feedback_service import FeedbackService
from fastapi import Request
from utils.rate_limiter import limiter

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"],
)


@router.post(
    "",
    response_model=FeedbackResponse,
    responses={
    429: {
        "description": "Rate limit exceeded."
    }
},
)
@limiter.limit("10 per hour")
def submit_feedback(
    request:Request,
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return FeedbackService.submit_feedback(
        db=db,
        current_user=current_user,
        request=feedback,
    )
@router.get(
    "/export",
)
def export_feedback(
    format: str = Query(
        "xlsx",
        pattern="^(xlsx|csv)$",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_roles = {
        UserRole.SUPER_ADMIN,
        UserRole.CITY_ADMIN,
        UserRole.DEPARTMENT_ADMIN,
    }

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to export feedback.",
        )
    return FeedbackService.export_feedback(
        db=db,
        export_format=format,
    )

