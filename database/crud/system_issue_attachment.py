from sqlalchemy.orm import Session

from database.models.system_issue_attachment import (
    SystemIssueAttachment,
)


class SystemIssueAttachmentCRUD:

    @staticmethod
    def create(
        db: Session,
        issue_id: int,
        file_data: dict,
    ):

        attachment = SystemIssueAttachment(

            issue_id=issue_id,

            original_filename=file_data[
                "original_filename"
            ],

            stored_filename=file_data[
                "stored_filename"
            ],

            file_path=file_data[
                "image_path"
            ],

            mime_type=file_data[
                "mime_type"
            ],

            file_size=file_data[
                "file_size"
            ],
        )

        db.add(
            attachment,
        )

        db.commit()

        db.refresh(
            attachment,
        )

        return attachment