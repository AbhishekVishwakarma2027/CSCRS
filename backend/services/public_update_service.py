import math
import re
from datetime import datetime, timezone
from math import ceil
from pathlib import Path
from sqlalchemy.orm import Session

from database.models.public_update import PublicUpdate
from schemas.public_update import (
    PublicUpdateCreateRequest,
    PublicUpdateUpdateRequest,
    PublicUpdateResponse,
    PaginatedPublicUpdatesResponse,
)
from storage.media_service import get_media_service


class PublicUpdateService:

    def __init__(self, db: Session):
        self.db = db

    def _generate_slug(self, title: str, update_id: int | None = None) -> str:
        base_slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        if not base_slug:
            base_slug = "update"

        slug = base_slug
        counter = 1

        while True:
            query = self.db.query(PublicUpdate).filter(PublicUpdate.slug == slug)
            if update_id is not None:
                query = query.filter(PublicUpdate.id != update_id)
            existing = query.first()
            if not existing:
                return slug
            slug = f"{base_slug}-{counter}"
            counter += 1

    def _calculate_read_time(self, content: str) -> int:
        words = len(content.split())
        return max(1, math.ceil(words / 200))

    def get_published_updates(
        self, page: int = 1, page_size: int = 10, category: str | None = None
    ) -> PaginatedPublicUpdatesResponse:
        query = self.db.query(PublicUpdate).filter(PublicUpdate.is_published.is_(True))

        if category and category.strip():
            query = query.filter(PublicUpdate.category == category.strip())

        total_items = query.count()
        offset = (page - 1) * page_size
        items = (
            query.order_by(PublicUpdate.published_at.desc(), PublicUpdate.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        total_pages = ceil(total_items / page_size) if total_items > 0 else 1

        return PaginatedPublicUpdatesResponse(
            items=[PublicUpdateResponse.model_validate(i) for i in items],
            total_items=total_items,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_published_update_by_slug(self, slug: str) -> PublicUpdateResponse | None:
        update = (
            self.db.query(PublicUpdate)
            .filter(PublicUpdate.slug == slug, PublicUpdate.is_published.is_(True))
            .first()
        )
        if not update:
            return None
        return PublicUpdateResponse.model_validate(update)

    def get_all_updates_admin(
        self, page: int = 1, page_size: int = 20
    ) -> PaginatedPublicUpdatesResponse:
        query = self.db.query(PublicUpdate)
        total_items = query.count()
        offset = (page - 1) * page_size
        items = (
            query.order_by(PublicUpdate.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        total_pages = ceil(total_items / page_size) if total_items > 0 else 1

        return PaginatedPublicUpdatesResponse(
            items=[PublicUpdateResponse.model_validate(i) for i in items],
            total_items=total_items,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def create_update(
        self, created_by_id: int, req: PublicUpdateCreateRequest
    ) -> PublicUpdateResponse:
        slug = self._generate_slug(req.title)
        read_time = (
            req.read_time_minutes
            if req.read_time_minutes and req.read_time_minutes > 0
            else self._calculate_read_time(req.content)
        )

        published_at = datetime.now(timezone.utc) if req.is_published else None

        thumbnail_object_key = None
        thumbnail_storage_provider = "local"
        if req.thumbnail_url:
            filename = Path(req.thumbnail_url).name
            media_service = get_media_service()
            candidate_key = f"{media_service.prefix}/public-updates/thumbnails/{filename}"
            if media_service.provider.exists(candidate_key):
                thumbnail_object_key = candidate_key
                thumbnail_storage_provider = media_service.provider_name

        update = PublicUpdate(
            title=req.title,
            slug=slug,
            description=req.description,
            content=req.content,
            category=req.category or "Press",
            thumbnail_url=req.thumbnail_url,
            thumbnail_object_key=thumbnail_object_key,
            thumbnail_storage_provider=thumbnail_storage_provider,
            published_at=published_at,
            read_time_minutes=read_time,
            is_published=bool(req.is_published),
            created_by_id=created_by_id,
        )
        self.db.add(update)
        self.db.commit()
        self.db.refresh(update)
        return PublicUpdateResponse.model_validate(update)

    def update_update(
        self, update_id: int, req: PublicUpdateUpdateRequest
    ) -> PublicUpdateResponse | None:
        update = self.db.query(PublicUpdate).filter(PublicUpdate.id == update_id).first()
        if not update:
            return None

        if req.title and req.title.strip() != update.title:
            update.title = req.title.strip()
            update.slug = self._generate_slug(update.title, update_id=update.id)

        if req.description is not None:
            update.description = req.description

        if req.content is not None:
            update.content = req.content
            if not req.read_time_minutes:
                update.read_time_minutes = self._calculate_read_time(req.content)

        if req.category is not None:
            update.category = req.category

        if req.thumbnail_url is not None:
            old_thumbnail_key = update.thumbnail_object_key
            update.thumbnail_url = req.thumbnail_url
            if req.thumbnail_url:
                filename = Path(req.thumbnail_url).name
                media_service = get_media_service()
                candidate_key = f"{media_service.prefix}/public-updates/thumbnails/{filename}"
                if media_service.provider.exists(candidate_key):
                    update.thumbnail_object_key = candidate_key
                    update.thumbnail_storage_provider = media_service.provider_name
                else:
                    update.thumbnail_object_key = None
                    update.thumbnail_storage_provider = "local"
            else:
                update.thumbnail_object_key = None
                update.thumbnail_storage_provider = "local"

        if req.read_time_minutes is not None and req.read_time_minutes > 0:
            update.read_time_minutes = req.read_time_minutes

        self.db.add(update)
        self.db.commit()
        self.db.refresh(update)
        return PublicUpdateResponse.model_validate(update)

    def toggle_publish(self, update_id: int, is_published: bool) -> PublicUpdateResponse | None:
        update = self.db.query(PublicUpdate).filter(PublicUpdate.id == update_id).first()
        if not update:
            return None

        update.is_published = is_published
        if is_published and not update.published_at:
            update.published_at = datetime.now(timezone.utc)
        elif not is_published:
            update.published_at = None

        self.db.add(update)
        self.db.commit()
        self.db.refresh(update)
        return PublicUpdateResponse.model_validate(update)

    def delete_update(self, update_id: int) -> bool:
        update = self.db.query(PublicUpdate).filter(PublicUpdate.id == update_id).first()
        if not update:
            return False
        old_thumbnail_key = update.thumbnail_object_key
        self.db.delete(update)
        self.db.commit()

        if old_thumbnail_key:
            media_service = get_media_service()
            try:
                media_service.delete(old_thumbnail_key)
            except Exception:
                pass

        return True
