from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TimelineEvent(BaseModel):

    title: str

    description: str

    created_at: datetime


class TimelineResponse(BaseModel):

    report_id: int

    report_number: str

    status: str

    timeline: list[TimelineEvent]


class AdminTimelineEvent(BaseModel):

    id: int

    user_id: int
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None

    action: str

    details: Optional[str] = None

    created_at: datetime


class AdminTimelineResponse(BaseModel):

    report_id: int

    report_number: str

    timeline: list[AdminTimelineEvent]