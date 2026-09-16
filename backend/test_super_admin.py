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

from api.app import app
from database.base import Base
from database.dependencies import get_db
from database.enums import UserRole
from database.models.user import User
from database.models.department import Department
from authentication.dependencies import get_current_user


from sqlalchemy.pool import StaticPool


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


@pytest.fixture
def test_users(db_session):
    """Create sample users for each role."""
    dept = Department(name="Test Department", description="Testing", is_active=True)
    db_session.add(dept)
    db_session.commit()

    super_admin = User(
        name="Super Admin",
        email="superadmin@cscrs.gov.in",
        password_hash="hashed_pw",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_blocked=False,
    )
    city_admin = User(
        name="City Admin",
        email="cityadmin@cscrs.gov.in",
        password_hash="hashed_pw",
        role=UserRole.CITY_ADMIN,
        is_active=True,
        is_blocked=False,
    )
    dept_admin = User(
        name="Dept Admin",
        email="deptadmin@cscrs.gov.in",
        password_hash="hashed_pw",
        role=UserRole.DEPARTMENT_ADMIN,
        department_id=dept.id,
        is_active=True,
        is_blocked=False,
    )
    citizen = User(
        name="Citizen",
        email="citizen@cscrs.gov.in",
        password_hash="hashed_pw",
        role=UserRole.CITIZEN,
        is_active=True,
        is_blocked=False,
    )
    db_session.add_all([super_admin, city_admin, dept_admin, citizen])
    db_session.commit()

    return {
        "super_admin": super_admin,
        "city_admin": city_admin,
        "dept_admin": dept_admin,
        "citizen": citizen,
        "department": dept,
    }


@pytest.fixture
def client(db_session):
    """TestClient fixture overriding get_db."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


def test_super_admin_analytics_access(client, test_users):
    """Verify SUPER_ADMIN can access read-only dashboard analytics endpoints."""
    # 1. Super Admin access allowed
    app.dependency_overrides[get_current_user] = lambda: test_users["super_admin"]

    res_summary = client.get("/api/v1/dashboard/summary")
    assert res_summary.status_code == 200

    res_depts = client.get("/api/v1/dashboard/departments")
    assert res_depts.status_code == 200

    res_feedback = client.get("/api/v1/dashboard/feedback")
    assert res_feedback.status_code == 200

    res_status = client.get("/api/v1/dashboard/status")
    assert res_status.status_code == 200

    res_priorities = client.get("/api/v1/dashboard/priorities")
    assert res_priorities.status_code == 200

    # 2. Citizen access blocked (403)
    app.dependency_overrides[get_current_user] = lambda: test_users["citizen"]
    res_citizen = client.get("/api/v1/dashboard/departments")
    assert res_citizen.status_code == 403


def test_assignment_rbac_blocks_super_admin(client, test_users):
    """Verify SUPER_ADMIN is blocked (403) from report assignment while DEPARTMENT_ADMIN is permitted."""
    payload = {"report_id": 1, "remarks": "Test assignment"}

    # 1. Super Admin -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: test_users["super_admin"]
    res_sa = client.post("/api/v1/assignments", json=payload)
    assert res_sa.status_code == 403

    # 2. Department Admin -> Permitted at authorization layer (returns non-403 status code e.g. 404 or 422 if report doesn't exist)
    app.dependency_overrides[get_current_user] = lambda: test_users["dept_admin"]
    res_da = client.post("/api/v1/assignments", json=payload)
    assert res_da.status_code != 403


def test_dedicated_super_admin_routes(client, test_users):
    """Verify dedicated Super Admin governance routes are restricted to SUPER_ADMIN."""
    routes_get = [
        "/api/v1/super-admin/audit-logs",
        "/api/v1/super-admin/audit-logs/export",
        "/api/v1/super-admin/login-audits",
        "/api/v1/super-admin/health",
        "/api/v1/super-admin/ai-telemetry",
    ]

    # 1. Non-Super Admin (Citizen) -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: test_users["citizen"]
    for route in routes_get:
        res = client.get(route)
        assert res.status_code == 403, f"Expected 403 for {route} when called by Citizen"

    res_post = client.post(
        "/api/v1/super-admin/announcements",
        json={"title": "Test", "message": "Notice", "target_role": "ALL"},
    )
    assert res_post.status_code == 403

    # 2. Super Admin -> Allowed (200 OK)
    app.dependency_overrides[get_current_user] = lambda: test_users["super_admin"]

    res_health = client.get("/api/v1/super-admin/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_telemetry = client.get("/api/v1/super-admin/ai-telemetry")
    assert res_telemetry.status_code == 200

    res_audit = client.get("/api/v1/super-admin/audit-logs")
    assert res_audit.status_code == 200

    res_login_audit = client.get("/api/v1/super-admin/login-audits")
    assert res_login_audit.status_code == 200


def test_existing_super_admin_capabilities(client, test_users):
    """Verify existing SUPER_ADMIN export capability authorization."""
    # 1. Citizen -> 403
    app.dependency_overrides[get_current_user] = lambda: test_users["citizen"]
    res_cit = client.get("/api/v1/ai-dataset/export")
    assert res_cit.status_code == 403

    # 2. Super Admin -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: test_users["super_admin"]
    res_sa = client.get("/api/v1/ai-dataset/export")
    assert res_sa.status_code == 200


def test_openapi_swagger_tags():
    """Verify OpenAPI schema tags for AI Dataset export and Super Admin routes."""
    schema = app.openapi()
    ai_export_op = schema["paths"]["/api/v1/ai-dataset/export"]["get"]
    assert "Super Admin" in ai_export_op["tags"]

    health_op = schema["paths"]["/api/v1/super-admin/health"]["get"]
    assert "Super Admin" in health_op["tags"]


def test_broadcast_decoupled_lifecycle(client, db_session, test_users):
    """Verify decoupled Broadcast API flow, NULL timestamp handling, role filtering, and personal notification isolation."""
    from datetime import datetime, timezone, timedelta
    from database.models.in_app_notification import InAppNotification
    from database.models.broadcast import Broadcast
    from services.in_app_notification_service import InAppNotificationService

    now = datetime.now(timezone.utc)
    future = (now + timedelta(hours=2)).isoformat()
    past = (now - timedelta(hours=2)).isoformat()

    # 15. Non-SuperAdmin (Citizen) cannot create/manage broadcasts -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: test_users["citizen"]
    res_cit_create = client.post("/api/v1/super-admin/announcements", json={"title": "Unauthorized", "message": "Test"})
    assert res_cit_create.status_code == 403

    # 1. Super Admin creates exactly one Broadcast -> 201 Created
    app.dependency_overrides[get_current_user] = lambda: test_users["super_admin"]
    res_create = client.post(
        "/api/v1/super-admin/announcements",
        json={
            "title": "Platform Maintenance",
            "message": "System maintenance scheduled",
            "target_role": "ALL",
            "announcement_type": "MAINTENANCE",
        },
    )
    assert res_create.status_code == 201
    data_create = res_create.json()
    assert data_create["success"] is True
    b_id = data_create["broadcast_id"]

    # 2. Creation creates ZERO InAppNotification rows
    # 3. recipient_count is correct (4 users in test_users fixture)
    # 4. created_by equals authenticated Super Admin ID
    assert data_create["recipient_count"] == 4
    b_row = db_session.query(Broadcast).filter(Broadcast.broadcast_id == b_id).first()
    assert b_row is not None
    assert b_row.title == "Platform Maintenance"
    assert b_row.created_by == test_users["super_admin"].id
    assert db_session.query(InAppNotification).count() == 0

    # 5. Super Admin list endpoint reads from broadcasts
    res_list = client.get("/api/v1/super-admin/announcements")
    assert res_list.status_code == 200
    b_items = res_list.json()
    assert len(b_items) == 1
    assert b_items[0]["broadcast_id"] == b_id
    assert b_items[0]["lifecycle_state"] == "ACTIVE"

    # Create additional broadcasts for testing NULL timestamps, schedule, expiry, and role filtering:
    # Case A: starts_at=NULL, ends_at=future
    res_case_a = client.post("/api/v1/super-admin/announcements", json={
        "title": "Case A Notice", "message": "Null start, future end", "ends_at": future
    })
    id_a = res_case_a.json()["broadcast_id"]

    # Case B: starts_at=past, ends_at=NULL
    res_case_b = client.post("/api/v1/super-admin/announcements", json={
        "title": "Case B Notice", "message": "Past start, null end", "starts_at": past
    })
    id_b = res_case_b.json()["broadcast_id"]

    # Case C: starts_at=NULL, ends_at=NULL (b_id created above)
    id_c = b_id

    # Case D: Scheduled (starts_at=future)
    res_case_d = client.post("/api/v1/super-admin/announcements", json={
        "title": "Case D Notice", "message": "Scheduled future start", "starts_at": future
    })
    id_d = res_case_d.json()["broadcast_id"]

    # Role specific: Target CITIZEN only
    res_role_cit = client.post("/api/v1/super-admin/announcements", json={
        "title": "Citizen Only Notice", "message": "For citizens only", "target_role": "CITIZEN"
    })
    id_role_cit = res_role_cit.json()["broadcast_id"]

    # 6, 9, 10, 11, 12. Active endpoint for Citizen role
    app.dependency_overrides[get_current_user] = lambda: test_users["citizen"]
    res_active_cit = client.get("/api/v1/announcements/active")
    assert res_active_cit.status_code == 200
    active_cit_ids = [item["broadcast_id"] for item in res_active_cit.json()]

    # Case A, B, C, and Citizen-role broadcasts MUST be present
    assert id_a in active_cit_ids
    assert id_b in active_cit_ids
    assert id_c in active_cit_ids
    assert id_role_cit in active_cit_ids

    # 7. Scheduled broadcast (Case D) MUST NOT be returned in active endpoint
    assert id_d not in active_cit_ids

    # 12. Role filtering check: Super Admin or Worker fetching active broadcasts should NOT see Citizen-only broadcast
    app.dependency_overrides[get_current_user] = lambda: test_users["super_admin"]
    res_active_sa = client.get("/api/v1/announcements/active")
    assert res_active_sa.status_code == 200
    active_sa_ids = [item["broadcast_id"] for item in res_active_sa.json()]
    assert id_role_cit not in active_sa_ids

    # 13, 14. Super Admin ends announcement -> sets ends_at, does NOT modify InAppNotification
    notif_count_before_end = db_session.query(InAppNotification).count()
    res_end = client.patch(f"/api/v1/super-admin/announcements/{id_a}/end")
    assert res_end.status_code == 200
    assert db_session.query(InAppNotification).count() == notif_count_before_end

    # 8. Expired broadcast (ended Case A) MUST NOT be returned in active endpoint
    app.dependency_overrides[get_current_user] = lambda: test_users["citizen"]
    res_active_after_end = client.get("/api/v1/announcements/active")
    active_ids_after_end = [item["broadcast_id"] for item in res_active_after_end.json()]
    assert id_a not in active_ids_after_end

    # 16. Existing personal notification creation and listing still works
    notif_svc = InAppNotificationService(db_session)
    p_notif = notif_svc.create_notification(
        user_id=test_users["citizen"].id,
        report_id=None,
        title="Personal Update",
        message="Your report status changed",
        notification_type="REPORT_RESOLVED",
    )
    assert p_notif.id is not None
    assert db_session.query(InAppNotification).count() == notif_count_before_end + 1


