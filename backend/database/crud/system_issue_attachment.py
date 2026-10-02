from sqlalchemy.orm import Session

from database.models.system_issue_attachment import (
    SystemIssueAttachment,
)


class SystemIssueAttachmentCRUD:

    @staticmethod
    def get_by_id(
        db: Session,
        attachment_id: int,
    ) -> SystemIssueAttachment | None:
        return (
            db.query(SystemIssueAttachment)
            .filter(SystemIssueAttachment.id == attachment_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        issue_id: int,
        file_data: dict,
    ):
        file_path = file_data.get("file_path") or file_data.get("image_path") or ""

        attachment = SystemIssueAttachment(
            issue_id=issue_id,
            original_filename=file_data["original_filename"],
            stored_filename=file_data["stored_filename"],
            file_path=file_path,
            object_key=file_data.get("object_key"),
            storage_provider=file_data.get(
                "storage_provider",
                "local",
            ),
            sha256=file_data.get("sha256"),
            mime_type=file_data["mime_type"],
            file_size=file_data["file_size"],
        )

        db.add(attachment)
        db.flush()

        # If file_path was not set, configure canonical API streaming path
        if not attachment.file_path:
            attachment.file_path = f"/api/v1/issues/attachments/{attachment.id}"

        db.commit()
        db.refresh(attachment)
        return attachment