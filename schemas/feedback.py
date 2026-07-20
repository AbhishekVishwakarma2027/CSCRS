from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class FeedbackCreate(BaseModel):

    rating: int = Field(
        ...,
        ge=1,
        le=5,
        description="Rating between 1 and 5",
    )

    liked_text: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="What did you like about the system?",
    )

    suggestion_text: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Suggestions for improvement.",
    )


class FeedbackResponse(BaseModel):

    message: str

    feedback_id: int

    model_config = ConfigDict(
        from_attributes=True,
    )
class RatingDistribution(BaseModel):

    one_star: int

    two_star: int

    three_star: int

    four_star: int

    five_star: int


class FeedbackDashboardResponse(BaseModel):

    total_feedback: int

    average_rating: float

    rating_distribution: RatingDistribution