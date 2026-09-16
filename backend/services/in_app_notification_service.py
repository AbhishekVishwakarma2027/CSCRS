from sqlalchemy.orm import Session
import database.crud.in_app_notification as notification_crud

class InAppNotificationService:

    def __init__(
        self,
        db: Session,
    ):

        self.db = db


    def create_notification(
        self,
        *,
        user_id: int,
        report_id: int | None,
        title: str,
        message: str,
        notification_type: str,
        starts_at=None,
        ends_at=None,
        announcement_type=None,
        broadcast_id=None,
    ):

        return notification_crud.create_notification(
            self.db,
            user_id=user_id,
            report_id=report_id,
            title=title,
            message=message,
            notification_type=notification_type,
            starts_at=starts_at,
            ends_at=ends_at,
            announcement_type=announcement_type,
            broadcast_id=broadcast_id,
        )


    def get_notifications(
        self,
        *,
        user_id: int,
    ):

        return notification_crud.get_user_notifications(
            self.db,
            user_id=user_id,
        )


    def get_unread_count(
        self,
        *,
        user_id: int,
    ):

        return notification_crud.get_unread_count(
            self.db,
            user_id=user_id,
        )


    def mark_as_read(
        self,
        *,
        notification_id: int,
        user_id: int,
    ):

        return notification_crud.mark_as_read(
            self.db,
            notification_id=notification_id,
            user_id=user_id,
        )


    def mark_all_as_read(
        self,
        *,
        user_id: int,
    ):

        return notification_crud.mark_all_as_read(
            self.db,
            user_id=user_id,
        )