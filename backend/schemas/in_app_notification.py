from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):

    id: int

    report_id: int | None

    title: str

    message: str

    type: str

    is_read: bool

    created_at: datetime

    starts_at: datetime | None = None

    ends_at: datetime | None = None

    announcement_type: str | None = None

    broadcast_id: str | None = None

    class Config:

        from_attributes = True


class UnreadNotificationResponse(BaseModel):

    unread_count: int