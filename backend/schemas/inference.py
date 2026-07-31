from typing import List

from pydantic import BaseModel


class DetectionResponse(BaseModel):

    class_name: str

    confidence: float

    bbox: List[float]

    mask_area: float


class AISummaryResponse(BaseModel):

    objects_detected: int

    primary_issue: str | None

    highest_confidence: float | None


class AIResponse(BaseModel):

    annotated_image: str

    detections: List[DetectionResponse]

    summary: AISummaryResponse