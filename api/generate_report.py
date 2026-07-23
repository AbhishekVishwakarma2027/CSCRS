from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.dependencies import get_db
from authentication.dependencies import (
    require_city_admin,
    require_department_admin
)

from database.models.user import User
from services.generate_report_service import ReportGenerationService
from fastapi import Request
from utils.rate_limiter import limiter

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)
@router.get(
    "/department/download",
    summary="Download Department Performance Report",
)
@limiter.limit("20 per hour")
def download_department_report(
    request:Request,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):
    """
    Downloads Department Performance Report.
    """

    pdf = ReportGenerationService(
        db,
    ).generate_department_report(
        department_id=current_user.department_id,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=department_report.pdf"
        },
    )
@router.get(
    "/city/download",
    summary="Download City Performance Report",
    responses={
    429: {
        "description": "Rate limit exceeded."
    }
},
)
@limiter.limit("20per hour")
def download_city_report(
    request:Request,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):
    """
    Downloads City Performance Report.
    """

    pdf = ReportGenerationService(
        db,
    ).generate_city_report(
        city_admin_id=current_user.id,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=city_report.pdf"
        },
    )