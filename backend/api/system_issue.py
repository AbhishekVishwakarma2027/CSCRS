from typing import List

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
    HTTPException
)
from fastapi import Query
from sqlalchemy.orm import Session

from database.dependencies import get_db
from typing import Annotated
from authentication.dependencies import get_current_user

from schemas.system_issue import (
    SystemIssueCreate,
    SystemIssueResponse,
    SystemIssueListItem,
    MySystemIssueItem,
    SystemIssueDetailResponse,
    SystemIssueStatusUpdate,
    MessageResponse,
)
from database.enums import SystemIssueCategory
from services.system_issue_service import (
    SystemIssueService,
)
from database.enums import UserRole

router = APIRouter(
    prefix="/issues",
    tags=["Report an Issue"],
)
from fastapi import Request
from utils.rate_limiter import limiter

@router.post(
    "",
    response_model=SystemIssueResponse,
    responses={
    429: {
        "description": "Rate limit exceeded."
    }
},
)
@limiter.limit("20 per hour")
def submit_issue(

    request:Request,

    title: str = Form(...),

    description: str = Form(...),

    category: SystemIssueCategory = Form(...),

    related_report_number: str | None = Form(None),

    attachments: UploadFile | None = File(None),

    current_user=Depends(get_current_user),

    db: Session = Depends(get_db),

):

    payload = SystemIssueCreate(
        title=title,
        description=description,
        category=category,
        related_report_number=related_report_number,
    )

    service = SystemIssueService(db)

    return service.submit_issue(
        reporter_id=current_user.id,
        data=payload,
        attachments=[attachments] if attachments else []
    )
@router.get(
    "",
    response_model=list[SystemIssueListItem],
)
def get_issues(

    status: str | None = Query(None),

    category: SystemIssueCategory | None = Query(None),

    reporter: str | None = Query(None),

    search: str | None = Query(None),

    current_user=Depends(get_current_user),

    db: Session = Depends(get_db),

):
    allowed_roles = {
        UserRole.SUPER_ADMIN,
        UserRole.CITY_ADMIN,
    }
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view system issues.",
        )
    service = SystemIssueService(db)

    return service.get_issues(

        status=status,

        category=category,

        reporter=reporter,

        search=search,
    )

@router.get(
    "/export",
)
def export_system_issues(

    format: str = Query(
        default="csv",
        pattern="^(csv|excel)$",
    ),

    current_user=Depends(get_current_user),

    db: Session = Depends(get_db),

):
    allowed_roles = {
        UserRole.SUPER_ADMIN,
    }
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized.",
        )
    service = SystemIssueService(db)

    return service.export_issues(
        format=format,
    )
@router.get(
    "/my",
    response_model=list[MySystemIssueItem],
    summary="Get My System Issues",
    description="Retrieve list of system issues created by the currently authenticated user.",
)
def get_my_issues(
    status: str | None = Query(None),
    category: SystemIssueCategory | None = Query(None),
    search: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SystemIssueService(db)
    return service.get_my_issues(
        reporter_id=current_user.id,
        status=status,
        category=category,
        search=search,
    )


@router.get(
    "/{issue_number}",
    response_model=SystemIssueDetailResponse,
)
def get_issue_detail(

    issue_number: str,

    current_user=Depends(get_current_user),

    db: Session = Depends(get_db),

):

    service = SystemIssueService(db)

    return service.get_issue_detail(
        issue_number=issue_number,
        current_user=current_user,
    )
@router.patch(
    "/{issue_number}/status",
    response_model=MessageResponse,
)
def update_issue_status(

    issue_number: str,

    payload: SystemIssueStatusUpdate,

    current_user=Depends(get_current_user),

    db: Session = Depends(get_db),

):

    allowed_roles = {
        UserRole.SUPER_ADMIN,
    }
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized.",
        )

    service = SystemIssueService(db)

    return service.update_issue_status(

        issue_number=issue_number,

        data=payload,
    )


@router.get(
    "/attachments/{attachment_id}",
    summary="Get System Issue Attachment",
    description="Stream system issue attachment image or video with role/ownership authorization.",
)
def get_issue_attachment(
    attachment_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SystemIssueService(db)
    return service.get_attachment_stream(
        attachment_id=attachment_id,
        current_user=current_user,
    )

