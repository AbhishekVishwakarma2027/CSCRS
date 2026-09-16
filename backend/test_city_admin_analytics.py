import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.base import Base
from database.enums import UserRole, ReportStatus, Priority, VerificationDecision
from database.models.department import Department
from database.models.user import User
from database.models.worker_profile import WorkerProfile
from database.models.report import Report
from database.models.resolution import Resolution
from database.crud import analytics as analytics_crud
from schemas.analytics import DepartmentStatisticsItem

@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for testing analytics SQL queries."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_department_statistics_item_schema():
    """Verify DepartmentStatisticsItem schema includes enriched fields."""
    item = DepartmentStatisticsItem(
        department_id=1,
        department_name="Drainage",
        total_reports=10,
        total_workers=5,
        active_workers=4,
        inactive_workers=1,
        average_resolution_time_hours=3.5,
    )
    assert item.department_id == 1
    assert item.department_name == "Drainage"
    assert item.total_reports == 10
    assert item.total_workers == 5
    assert item.active_workers == 4
    assert item.inactive_workers == 1
    assert item.average_resolution_time_hours == 3.5

def test_department_statistics_item_schema_defaults():
    """Verify DepartmentStatisticsItem default zero values for backward compatibility."""
    item = DepartmentStatisticsItem(
        department_id=2,
        department_name="Roads",
        total_reports=0,
    )
    assert item.total_workers == 0
    assert item.active_workers == 0
    assert item.inactive_workers == 0
    assert item.average_resolution_time_hours == 0.0

def test_get_department_statistics_db_execution(db_session):
    """Regression test executing actual get_department_statistics SQL queries."""
    # 1. Create Departments
    dept_a = Department(name="Drainage", description="Drainage Department", is_active=True)
    dept_b = Department(name="Roads", description="Roads Department", is_active=True)
    dept_c = Department(name="Parks", description="Parks Department", is_active=True)
    db_session.add_all([dept_a, dept_b, dept_c])
    db_session.commit()

    # 2. Create Users & Worker Profiles for Dept A (3 workers: 1 active, 1 inactive, 1 blocked)
    u1 = User(name="Worker A1", email="w1@a.com", password_hash="hash", role=UserRole.WORKER, is_active=True, is_blocked=False)
    u2 = User(name="Worker A2", email="w2@a.com", password_hash="hash", role=UserRole.WORKER, is_active=False, is_blocked=False)
    u3 = User(name="Worker A3", email="w3@a.com", password_hash="hash", role=UserRole.WORKER, is_active=True, is_blocked=True)
    db_session.add_all([u1, u2, u3])
    db_session.commit()

    wp1 = WorkerProfile(user_id=u1.id, department_id=dept_a.id, employee_code="EMP01", designation="Technician")
    wp2 = WorkerProfile(user_id=u2.id, department_id=dept_a.id, employee_code="EMP02", designation="Technician")
    wp3 = WorkerProfile(user_id=u3.id, department_id=dept_a.id, employee_code="EMP03", designation="Technician")
    db_session.add_all([wp1, wp2, wp3])

    # 3. Create Worker for Dept B (1 active worker)
    u4 = User(name="Worker B1", email="w4@b.com", password_hash="hash", role=UserRole.WORKER, is_active=True, is_blocked=False)
    db_session.add(u4)
    db_session.commit()
    wp4 = WorkerProfile(user_id=u4.id, department_id=dept_b.id, employee_code="EMP04", designation="Engineer")
    db_session.add(wp4)
    db_session.commit()

    # 4. Create Citizen & Reports with Resolutions for Dept A
    citizen = User(name="Citizen 1", email="cit@c.com", password_hash="hash", role=UserRole.CITIZEN, is_active=True)
    db_session.add(citizen)
    db_session.commit()

    now = datetime.now(timezone.utc)
    rep1 = Report(
        report_number="REP-001",
        citizen_id=citizen.id,
        department_id=dept_a.id,
        issue_type="Water Logging",
        latitude=26.8,
        longitude=80.9,
        risk_score=50.0,
        ai_confidence=0.9,
        verification_decision=VerificationDecision.PASS,
        verification_passed=True,
        priority=Priority.HIGH,
        status=ReportStatus.RESOLVED,
        created_at=now - timedelta(hours=4),
    )
    db_session.add(rep1)
    db_session.commit()

    res1 = Resolution(
        report_id=rep1.id,
        worker_id=u1.id,
        verification_passed=True,
        resolved_at=now,
    )
    db_session.add(res1)
    db_session.commit()

    # 5. Execute get_department_statistics
    stats = analytics_crud.get_department_statistics(db_session)
    assert len(stats) == 3

    stats_map = {item["department_id"]: item for item in stats}

    # Department A verification
    stats_a = stats_map[dept_a.id]
    assert stats_a["department_name"] == "Drainage"
    assert stats_a["total_reports"] == 1
    assert stats_a["total_workers"] == 3
    assert stats_a["active_workers"] == 1
    assert stats_a["inactive_workers"] == 2  # 1 inactive + 1 blocked
    assert stats_a["average_resolution_time_hours"] == 4.0

    # Department B verification
    stats_b = stats_map[dept_b.id]
    assert stats_b["department_name"] == "Roads"
    assert stats_b["total_reports"] == 0
    assert stats_b["total_workers"] == 1
    assert stats_b["active_workers"] == 1
    assert stats_b["inactive_workers"] == 0
    assert stats_b["average_resolution_time_hours"] == 0.0

    # Department C verification (zero workers / zero reports)
    stats_c = stats_map[dept_c.id]
    assert stats_c["department_name"] == "Parks"
    assert stats_c["total_reports"] == 0
    assert stats_c["total_workers"] == 0
    assert stats_c["active_workers"] == 0
    assert stats_c["inactive_workers"] == 0
    assert stats_c["average_resolution_time_hours"] == 0.0
