from typing import Optional


from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from database.enums import (
    SystemIssueCategory,
    SystemIssueStatus,
)


class SystemIssueCreate(BaseModel):

    title: str = Field(
        ...,
        min_length=5,
        max_length=200,
    )

    description: str = Field(
        ...,
        min_length=10,
        max_length=3000,
    )

    category: SystemIssueCategory

    related_report_number: Optional[str] = Field(
        default=None,
        max_length=30,
    )

class SystemIssueResponse(BaseModel):

    message: str

    issue_number: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class SystemIssueListItem(BaseModel):

    issue_number: str

    title: str

    category: SystemIssueCategory

    status: str

    reporter_name: str

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

class SystemIssueAttachmentResponse(BaseModel):
    id: Optional[int] = None
    original_filename: str
    file_path: str
    mime_type: str
    file_size: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class MySystemIssueItem(BaseModel):

    issue_number: str

    title: str

    description: str

    category: SystemIssueCategory

    status: str

    remarks: Optional[str] = None

    related_report_number: Optional[str] = None

    attachments: list[SystemIssueAttachmentResponse] = []

    created_at: datetime

    updated_at: datetime

    closed_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class SystemIssueDetailResponse(BaseModel):

    issue_number: str

    title: str

    description: str

    category: SystemIssueCategory

    status: str

    reporter_name: str

    reporter_email: str

    reporter_phone: str | None

    related_report_number: str | None

    remarks: str | None = None

    attachments: list[SystemIssueAttachmentResponse]

    created_at: datetime

    updated_at: datetime

    closed_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )

class SystemIssueStatusUpdate(BaseModel):

    status: SystemIssueStatus

    remarks: str | None = Field(
        default=None,
        max_length=1000,
    )


class MessageResponse(BaseModel):

    message: str

    model_config = ConfigDict(
        from_attributes=True,
    )