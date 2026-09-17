import sys
from unittest.mock import MagicMock
import fastapi.dependencies.utils

fastapi.dependencies.utils.ensure_multipart_is_installed = lambda: None

for mod_name in ['user_agents', 'open_clip', 'ultralytics', 'exifread', 'torch', 'torch.nn', 'torch.nn.functional']:
    if mod_name not in sys.modules:
        sys.modules[mod_name] = MagicMock()

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.app import app
from database.base import Base
from database.dependencies import get_db
from database.enums import UserRole
from database.models.user import User
from database.models.public_update import PublicUpdate
from authentication.dependencies import get_current_user


@pytest.fixture
def db_session():
    """Create an in-memory SQLite database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_public_updates_full_lifecycle(db_session):
    super_admin = User(
        name="Super Admin",
        email="sa@test.com",
        password_hash="xxx",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    city_admin = User(
        name="City Admin",
        email="ca@test.com",
        password_hash="xxx",
        role=UserRole.CITY_ADMIN,
        is_active=True,
    )
    db_session.add_all([super_admin, city_admin])
    db_session.commit()

    def override_get_db():
        yield db_session

    def override_get_current_user():
        return super_admin

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    client = TestClient(app)

    # 1. Super Admin creates a draft update
    create_payload = {
        "title": "SLA Update for Sanitation Department",
        "description": "Revised timeframe guidelines configured to expedite public cleaning tickets.",
        "content": "Full text of the sanitation department SLA update details...",
        "category": "System SLA",
        "is_published": False,
    }
    res = client.post("/api/v1/super-admin/updates", json=create_payload)
    assert res.status_code == 200
    item = res.json()
    assert item["title"] == "SLA Update for Sanitation Department"
    assert item["slug"] == "sla-update-for-sanitation-department"
    assert item["is_published"] is False
    assert item["read_time_minutes"] >= 1
    update_id = item["id"]

    # 2. Public endpoint MUST NOT return unpublished draft update
    pub_res = client.get("/api/v1/public/updates")
    assert pub_res.status_code == 200
    assert len(pub_res.json()["items"]) == 0

    pub_detail_res = client.get("/api/v1/public/updates/sla-update-for-sanitation-department")
    assert pub_detail_res.status_code == 404

    # 3. Super Admin publishes update
    pub_toggle_res = client.post(
        f"/api/v1/super-admin/updates/{update_id}/publish",
        params={"is_published": True},
    )
    assert pub_toggle_res.status_code == 200
    assert pub_toggle_res.json()["is_published"] is True
    assert pub_toggle_res.json()["published_at"] is not None

    # 4. Public endpoint NOW returns published update
    pub_res2 = client.get("/api/v1/public/updates")
    assert pub_res2.status_code == 200
    assert len(pub_res2.json()["items"]) == 1
    assert pub_res2.json()["items"][0]["title"] == "SLA Update for Sanitation Department"

    pub_detail_res2 = client.get("/api/v1/public/updates/sla-update-for-sanitation-department")
    assert pub_detail_res2.status_code == 200
    assert pub_detail_res2.json()["category"] == "System SLA"

    # 5. Non-Super Admin authorization test (City Admin gets 403 Forbidden)
    def override_get_current_user_city_admin():
        return city_admin

    app.dependency_overrides[get_current_user] = override_get_current_user_city_admin
    forbidden_res = client.post("/api/v1/super-admin/updates", json=create_payload)
    assert forbidden_res.status_code == 403

    app.dependency_overrides.clear()
