from datetime import datetime

from pydantic import BaseModel, ConfigDict

from database.enums import AssignmentStatus


class AssignmentResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    report_id: int

    worker_id: int

    assigned_by: int

    assigned_at: datetime

    accepted_at: datetime | None

    completed_at: datetime | None

    status: AssignmentStatus

    remarks: str | None

class AssignmentCreate(BaseModel):

    report_id: int

    remarks: str | None = None

class WorkerAssignmentResponse(BaseModel):

    assignment_id: int

    report_id: int

    issue_type: str

    description: str | None

    priority: str

    status: AssignmentStatus

    address: str | None

    latitude: float | None

    longitude: float | None

    google_maps_url: str
    
    image_url: str | None

    assigned_at: datetime