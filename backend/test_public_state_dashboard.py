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


def test_public_state_dashboard_no_auth_and_district_mapping(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Seed test data
    dept = Department(name="Public Works", is_active=True)
    db_session.add(dept)
    db_session.commit()

    citizen = User(name="Citizen X", email="cx@test.com", password_hash="xxx", role=UserRole.CITIZEN, is_active=True)
    worker = User(name="Worker Y", email="wy@test.com", password_hash="xxx", role=UserRole.WORKER, is_active=True, is_blocked=False)
    db_session.add_all([citizen, worker])
    db_session.commit()

    # Lucknow coordinate: lat 26.8467, lon 80.9462
    rep_lucknow = Report(
        report_number="REP-LKO-01",
        citizen_id=citizen.id,
        department_id=dept.id,
        issue_type="Pothole",
        latitude=26.8467,
        longitude=80.9462,
        risk_score=0.1,
        ai_confidence=0.9,
        verification_decision="PASS",
        verification_passed=True,
        status=ReportStatus.RESOLVED,
    )
    # Prayagraj coordinate: lat 25.4358, lon 81.8463
    rep_prayagraj = Report(
        report_number="REP-PRY-01",
        citizen_id=citizen.id,
        department_id=dept.id,
        issue_type="Garbage",
        latitude=25.4358,
        longitude=81.8463,
        risk_score=0.1,
        ai_confidence=0.9,
        verification_decision="PASS",
        verification_passed=True,
        status=ReportStatus.PENDING,
    )
    db_session.add_all([rep_lucknow, rep_prayagraj])
    db_session.commit()

    client = TestClient(app)
    response = client.get("/api/v1/public/state-dashboard?state=Uttar%20Pradesh")

    assert response.status_code == 200
    data = response.json()

    assert data["state"] == "Uttar Pradesh"
    assert data["total_reports"] == 2
    assert data["resolved_reports"] == 1
    assert data["active_departments"] == 1
    assert data["active_workers"] == 1

    # Verify district array contains 75 districts
    districts = data["districts"]
    assert len(districts) == 75

    lucknow_d = next((d for d in districts if d["district"] == "Lucknow"), None)
    prayagraj_d = next((d for d in districts if d["district"] == "Prayagraj"), None)

    assert lucknow_d is not None
    assert lucknow_d["total_reports"] == 1
    assert lucknow_d["resolved_reports"] == 1

    assert prayagraj_d is not None
    assert prayagraj_d["total_reports"] == 1
    assert prayagraj_d["resolved_reports"] == 0

    # Ensure no PII leaks
    assert "citizen" not in data
    assert "email" not in data

    app.dependency_overrides.clear()
