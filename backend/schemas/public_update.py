from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class PublicUpdateCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    content: str
    category: Optional[str] = "Press"
    thumbnail_url: Optional[str] = None
    read_time_minutes: Optional[int] = None
    is_published: Optional[bool] = False


class PublicUpdateUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    read_time_minutes: Optional[int] = None


class PublicUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    description: Optional[str] = None
    content: str
    category: str
    thumbnail_url: Optional[str] = None
    published_at: Optional[datetime] = None
    read_time_minutes: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class PaginatedPublicUpdatesResponse(BaseModel):
    items: list[PublicUpdateResponse]
    total_items: int
    page: int
    page_size: int
    total_pages: int
