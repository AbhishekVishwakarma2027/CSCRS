from datetime import datetime

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