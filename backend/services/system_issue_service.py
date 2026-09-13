from database.crud import report as report_crud
from database.crud import SystemIssueCRUD

from database.enums import SystemIssueStatus, UserRole

from schemas.system_issue import (
    SystemIssueCreate,
    SystemIssueResponse,
    SystemIssueListItem,
    MySystemIssueItem,
    SystemIssueAttachmentResponse,
    SystemIssueDetailResponse,
    SystemIssueStatusUpdate,
    MessageResponse,
)
from fastapi import UploadFile, HTTPException

from utils.file_utils import save_uploaded_file,validate_uploaded_file

from database.crud import (
    SystemIssueAttachmentCRUD,
)

from utils.report_number import generate_issue_number
import csv
import os
import tempfile

from openpyxl import Workbook
from fastapi.responses import FileResponse

class SystemIssueService:

    def __init__(
        self,
        db,
    ):
        self.db = db

    def submit_issue(
        self,
        reporter_id: int,
        data: SystemIssueCreate,
        attachments: list[UploadFile] | None = None,
    ) -> SystemIssueResponse:

        related_report_id = None
        report = None

        if data.related_report_number:

            report = report_crud.get_report_by_number(
                db=self.db,
                report_number=data.related_report_number,
            )

            if report is None:
                raise HTTPException(
                    status_code=400,
                    detail="Related report does not exist.",
                )

            related_report_id = report.id

        if attachments:

            if len(attachments) > 5:

                raise HTTPException(
                    status_code=400,
                    detail="Maximum 5 attachments allowed.",
                )
        for file in attachments:

            validate_uploaded_file(
                file=file,
                allowed_extensions={
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp",
                    ".mp4",
                    ".mov",
                    ".avi",
                    ".mkv",
                },
                allowed_content_types={
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "video/mp4",
                    "video/quicktime",
                    "video/x-msvideo",
                    "video/x-matroska",
                },
                max_size=10 * 1024 * 1024,
            )
            
        issue = SystemIssueCRUD.create(
            db=self.db,
            issue_number=generate_issue_number(0),
            reporter_id=reporter_id,
            related_report_id=related_report_id,
            title=data.title.strip(),
            description=data.description.strip(),
            category=data.category,
            status=SystemIssueStatus.OPEN,
        )

        if attachments:

            for file in attachments:

                saved = save_uploaded_file(

                    file,

                    folder="system_issues",
                )

                SystemIssueAttachmentCRUD.create(

                    db=self.db,

                    issue_id=issue.id,

                    file_data=saved,
                )

        self.db.add(issue)

        self.db.commit()

        self.db.refresh(issue)

        return SystemIssueResponse(
            message="Issue submitted successfully.",
            issue_number=issue.issue_number,
        )
    

    def get_issues(

        self,

        status=None,

        category=None,

        reporter=None,

        search=None,

    ):

        issues = SystemIssueCRUD.get_issues(

            db=self.db,

            status=status,

            category=category,

            reporter=reporter,

            search=search,

        )

        response = []

        for issue in issues:

            response.append(

                SystemIssueListItem(

                    issue_number=issue.issue_number,

                    title=issue.title,

                    category=issue.category,

                    status=issue.status.value,

                    reporter_name=issue.reporter.name,

                    created_at=issue.created_at,
                )
            )

        return response

    def get_my_issues(
        self,
        reporter_id: int,
        status=None,
        category=None,
        search=None,
    ) -> list[MySystemIssueItem]:
        issues = SystemIssueCRUD.get_issues(
            db=self.db,
            reporter_id=reporter_id,
            status=status,
            category=category,
            search=search,
        )

        response = []
        for issue in issues:
            attachments = [
                SystemIssueAttachmentResponse(
                    original_filename=att.original_filename,
                    file_path=att.file_path,
                    mime_type=att.mime_type,
                    file_size=att.file_size,
                )
                for att in issue.attachments
            ]

            response.append(
                MySystemIssueItem(
                    issue_number=issue.issue_number,
                    title=issue.title,
                    description=issue.description,
                    category=issue.category,
                    status=issue.status.value,
                    remarks=issue.remarks,
                    related_report_number=(
                        issue.related_report.report_number
                        if issue.related_report
                        else None
                    ),
                    attachments=attachments,
                    created_at=issue.created_at,
                    updated_at=issue.updated_at,
                    closed_at=issue.closed_at,
                )
            )

        return response
    
    def get_issue_detail(
        self,
        issue_number: str,
        current_user=None,
    ):

        issue = SystemIssueCRUD.get_issue_by_number(
            db=self.db,
            issue_number=issue_number,
        )

        if issue is None:

            raise HTTPException(
                status_code=404,
                detail="Issue not found.",
            )

        if current_user:
            allowed_roles = {
                UserRole.SUPER_ADMIN,
                UserRole.CITY_ADMIN,
            }
            if (
                current_user.role not in allowed_roles
                and issue.reporter_id != current_user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="You are not authorized to view this issue.",
                )

        attachments = []

        for attachment in issue.attachments:

            attachments.append(

                SystemIssueAttachmentResponse(

                    original_filename=attachment.original_filename,

                    file_path=attachment.file_path,

                    mime_type=attachment.mime_type,

                    file_size=attachment.file_size,
                )
            )

        return SystemIssueDetailResponse(

            issue_number=issue.issue_number,

            title=issue.title,

            description=issue.description,

            category=issue.category,

            status=issue.status.value,

            reporter_name=issue.reporter.name if issue.reporter else "Unknown",

            reporter_email=issue.reporter.email if issue.reporter else "",

            reporter_phone=issue.reporter.phone if issue.reporter else None,

            related_report_number=(
                issue.related_report.report_number
                if issue.related_report
                else None
            ),

            remarks=issue.remarks,

            attachments=attachments,

            created_at=issue.created_at,

            updated_at=issue.updated_at,

            closed_at=issue.closed_at,
        )
    
    def update_issue_status(
        self,
        issue_number: str,
        data: SystemIssueStatusUpdate,
    ):

        issue = SystemIssueCRUD.get_issue_by_number(
            db=self.db,
            issue_number=issue_number,
        )

        if issue is None:

            raise HTTPException(
                status_code=404,
                detail="Issue not found.",
            )

        SystemIssueCRUD.update_status(
            db=self.db,
            issue=issue,
            status=data.status,
            remarks=data.remarks,
        )

        return MessageResponse(
            message="Issue status updated successfully.",
        )
    
    def export_issues(
        self,
        format: str,
    ):

        issues = SystemIssueCRUD.get_all_for_export(
            db=self.db,
        )

        columns = [

            "Issue Number",

            "Title",

            "Description",

            "Category",

            "Status",

            "Reporter Name",

            "Reporter Email",

            "Related Report",

            "Created Time",

            "Closed Time",
        ]

        rows = []

        for issue in issues:
            created_at = (
                issue.created_at.replace(tzinfo=None)
                if issue.created_at
                else None
            )

            closed_at = (
                issue.closed_at.replace(tzinfo=None)
                if issue.closed_at
                else None
            )

            rows.append([

                issue.issue_number,

                issue.title,

                issue.description,

                issue.category.value,

                issue.status.value,

                issue.reporter.name,

                issue.reporter.email,

                issue.related_report.report_number
                if issue.related_report
                else "",

                created_at,

                closed_at,
            ])

        if format == "csv":

            file_path = os.path.join(

                tempfile.gettempdir(),

                "system_issues_export.csv",
            )

            with open(

                file_path,

                "w",

                newline="",

                encoding="utf-8",

            ) as file:

                writer = csv.writer(file)

                writer.writerow(columns)

                writer.writerows(rows)

            return FileResponse(

                file_path,

                filename="system_issues.csv",

                media_type="text/csv",
            )

        workbook = Workbook()

        sheet = workbook.active

        sheet.title = "System Issues"

        sheet.append(columns)

        for row in rows:

            sheet.append(row)

        file_path = os.path.join(

            tempfile.gettempdir(),

            "system_issues_export.xlsx",
        )

        workbook.save(file_path)

        return FileResponse(

            file_path,

            filename="system_issues.xlsx",

            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )