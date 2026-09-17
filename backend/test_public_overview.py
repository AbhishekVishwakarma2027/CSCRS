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
from database.enums import UserRole, ReportStatus
from database.models.user import User
from database.models.department import Department
from database.models.report import Report


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


def test_public_overview_no_auth_required(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Seed test data
    dept1 = Department(name="Sanitation", is_active=True)
    dept2 = Department(name="Roads", is_active=True)
    dept3 = Department(name="Inactive Dept", is_active=False)
    db_session.add_all([dept1, dept2, dept3])
    db_session.commit()

    worker1 = User(name="Worker 1", email="w1@test.com", password_hash="xxx", role=UserRole.WORKER, is_active=True, is_blocked=False)
    worker2 = User(name="Worker 2", email="w2@test.com", password_hash="xxx", role=UserRole.WORKER, is_active=True, is_blocked=True)
    citizen1 = User(name="Citizen 1", email="c1@test.com", password_hash="xxx", role=UserRole.CITIZEN, is_active=True)
    db_session.add_all([worker1, worker2, citizen1])
    db_session.commit()

    rep1 = Report(
        report_number="REP-001",
        citizen_id=citizen1.id,
        department_id=dept1.id,
        issue_type="Pothole",
        latitude=26.8467,
        longitude=80.9462,
        risk_score=0.1,
        ai_confidence=0.9,
        verification_decision="PASS",
        verification_passed=True,
        status=ReportStatus.RESOLVED,
    )
    rep2 = Report(
        report_number="REP-002",
        citizen_id=citizen1.id,
        department_id=dept1.id,
        issue_type="Trash",
        latitude=26.8500,
        longitude=80.9500,
        risk_score=0.1,
        ai_confidence=0.9,
        verification_decision="PASS",
        verification_passed=True,
        status=ReportStatus.PENDING,
    )
    db_session.add_all([rep1, rep2])
    db_session.commit()

    client = TestClient(app)
    response = client.get("/api/v1/public/overview")

    assert response.status_code == 200
    data = response.json()

    assert data["reports_resolved"] == 1
    assert data["departments"] == 2
    assert data["active_workers"] == 1
    assert data["covered_cities"] == 1

    # Ensure NO sensitive fields are leaked
    assert "id" not in data
    assert "email" not in data
    assert "user" not in data

    app.dependency_overrides.clear()
