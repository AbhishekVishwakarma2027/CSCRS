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
