import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import fastapi.dependencies.utils

fastapi.dependencies.utils.ensure_multipart_is_installed = lambda: None

for mod_name in [
    "user_agents",
    "open_clip",
    "ultralytics",
    "exifread",
    "torch",
    "torch.nn",
    "torch.nn.functional",
]:
    if mod_name not in sys.modules:
        sys.modules[mod_name] = MagicMock()

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.base import Base
from database.enums import (
    ForwardReasonType,
    Priority,
    ReportStatus,
    UserRole,
    VerificationDecision,
)
from database.models.audit_log import AuditLog
from database.models.department import Department
from database.models.in_app_notification import InAppNotification
from database.models.login_audit import LoginAudit
from database.models.refresh_token import RefreshToken
from database.models.report import Report
from database.models.report_forward_history import ReportForwardHistory
from database.models.resolution import Resolution
from database.models.user import User
from services.data_retention_service import DataRetentionService
from utils.datetime_utils import utc_now


@pytest.fixture
def db_session():
    """Create an in-memory SQLite database session for retention testing."""
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
def sample_user(db_session):
    """Seed sample department and users."""
    dept = Department(name="Public Works", description="Testing", is_active=True)
    db_session.add(dept)
    db_session.commit()
    db_session.refresh(dept)

    user = User(
        name="Citizen Tester",
        email="citizen@test.gov.in",
        password_hash="dummy_hash",
        role=UserRole.CITIZEN,
        is_active=True,
        department_id=dept.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# =========================================================================
# 1, 2, 3. LOGIN AUDITS RETENTION TESTS
# =========================================================================


def test_login_audits_retention_boundary_and_age(db_session, sample_user):
    """Verify:
    1. Recent login audit is retained.
    2. Login audit exactly at the retention boundary behaves correctly.
    3. Old login audit (> 180 days) is deleted.
    """
    now = utc_now()
    retention_days = 180
    cutoff = now - timedelta(days=retention_days)

    # 1. Recent (10 days ago) - MUST BE RETAINED
    recent_audit = LoginAudit(
        user_id=sample_user.id,
        email=sample_user.email,
        login_success=True,
        login_at=now - timedelta(days=10),
    )
    # 2. Exactly at the retention boundary (180 days ago, equal to cutoff)
    boundary_audit = LoginAudit(
        user_id=sample_user.id,
        email=sample_user.email,
        login_success=True,
        login_at=cutoff,
    )
    # 3. Old (181 days ago) - MUST BE DELETED
    old_audit_1 = LoginAudit(
        user_id=sample_user.id,
        email=sample_user.email,
        login_success=True,
        login_at=now - timedelta(days=181),
    )
    # 4. Very old (300 days ago) - MUST BE DELETED
    old_audit_2 = LoginAudit(
        user_id=sample_user.id,
        email=sample_user.email,
        login_success=False,
        failure_reason="INVALID_PASSWORD",
        login_at=now - timedelta(days=300),
    )

    db_session.add_all([recent_audit, boundary_audit, old_audit_1, old_audit_2])
    db_session.commit()

    # Capture IDs before deletion
    recent_id = recent_audit.id
    boundary_id = boundary_audit.id
    old_id_1 = old_audit_1.id
    old_id_2 = old_audit_2.id

    service = DataRetentionService(db_session)
    res = service.cleanup_login_audits(cutoff=cutoff, dry_run=False)

    assert res["status"] == "success"
    assert res["deleted"] == 2

    # Check remaining records
    remaining_ids = {a.id for a in db_session.query(LoginAudit).all()}
    assert recent_id in remaining_ids
    assert boundary_id in remaining_ids
    assert old_id_1 not in remaining_ids
    assert old_id_2 not in remaining_ids


# =========================================================================
# 7, 8. REFRESH TOKENS RETENTION TESTS
# =========================================================================


def test_refresh_tokens_retention_active_vs_expired(db_session, sample_user):
    """Verify:
    7. Active refresh token is retained.
    8. Expired refresh tokens and lifetime-elapsed tokens are cleaned up.
    """
    now = utc_now()

    # 1. Active unrevoked token expiring in 15 days - MUST BE RETAINED
    active_token_1 = RefreshToken(
        user_id=sample_user.id,
        token_hash="hash_active_1",
        jwt_id="jwt_active_1",
        session_id="sess_active_1",
        created_at=now - timedelta(days=15),
        expires_at=now + timedelta(days=15),
        revoked_at=None,
    )
    # 2. Active unrevoked token expiring in 30 days - MUST BE RETAINED
    active_token_2 = RefreshToken(
        user_id=sample_user.id,
        token_hash="hash_active_2",
        jwt_id="jwt_active_2",
        session_id="sess_active_2",
        created_at=now,
        expires_at=now + timedelta(days=30),
        revoked_at=None,
    )
    # 3. Revoked token whose validity period is still active (kept for reuse detection) - RETAINED
    revoked_unexpired = RefreshToken(
        user_id=sample_user.id,
        token_hash="hash_revoked_unexpired",
        jwt_id="jwt_revoked_unexpired",
        session_id="sess_revoked_unexpired",
        created_at=now - timedelta(days=5),
        expires_at=now + timedelta(days=25),
        revoked_at=now - timedelta(days=1),
        revoked_reason="ROTATED",
    )
    # 4. Expired active token (expires_at in the past) - MUST BE DELETED
    expired_token = RefreshToken(
        user_id=sample_user.id,
        token_hash="hash_expired",
        jwt_id="jwt_expired",
        session_id="sess_expired",
        created_at=now - timedelta(days=35),
        expires_at=now - timedelta(days=5),
        revoked_at=None,
    )
    # 5. Revoked and expired token (past expires_at) - MUST BE DELETED
    revoked_expired = RefreshToken(
        user_id=sample_user.id,
        token_hash="hash_revoked_expired",
        jwt_id="jwt_revoked_expired",
        session_id="sess_revoked_expired",
        created_at=now - timedelta(days=60),
        expires_at=now - timedelta(days=30),
        revoked_at=now - timedelta(days=45),
        revoked_reason="LOGOUT",
    )

    db_session.add_all([
        active_token_1,
        active_token_2,
        revoked_unexpired,
        expired_token,
        revoked_expired,
    ])
    db_session.commit()

    active_id_1 = active_token_1.id
    active_id_2 = active_token_2.id
    revoked_unexpired_id = revoked_unexpired.id
    expired_id = expired_token.id
    revoked_expired_id = revoked_expired.id

    service = DataRetentionService(db_session)
    res = service.cleanup_refresh_tokens(cutoff=now, dry_run=False)

    assert res["status"] == "success"
    assert res["deleted"] == 2

    remaining_ids = {t.id for t in db_session.query(RefreshToken).all()}
    assert active_id_1 in remaining_ids
    assert active_id_2 in remaining_ids
    assert revoked_unexpired_id in remaining_ids
    assert expired_id not in remaining_ids
    assert revoked_expired_id not in remaining_ids


# =========================================================================
# 4, 5, 6. IN-APP NOTIFICATIONS RETENTION TESTS
# =========================================================================


def test_in_app_notifications_retention_read_and_unread(db_session, sample_user):
    """Verify:
    4. Recent notification is retained.
    5. Old read notification (> 90 days) is deleted.
    6. Unread notification behavior is preserved:
       - Unread on active report (> 90 days) is RETAINED.
       - Unread on terminal report (> 90 days) is DELETED.
       - Unread exceeding max retention (> 365 days) is DELETED.
    """
    now = utc_now()

    # Active report (PENDING)
    active_report = Report(
        citizen_id=sample_user.id,
        department_id=sample_user.department_id,
        report_number="REP-ACT-001",
        issue_type="Pothole",
        description="Active issue needing repair",
        status=ReportStatus.PENDING,
        priority=Priority.MEDIUM,
        latitude=26.8467,
        longitude=80.9462,
        risk_score=25.0,
        ai_confidence=0.9,
        verification_decision=VerificationDecision.PASS,
        verification_passed=True,
    )
    # Terminal report (RESOLVED)
    resolved_report = Report(
        citizen_id=sample_user.id,
        department_id=sample_user.department_id,
        report_number="REP-RES-002",
        issue_type="Streetlight",
        description="Fixed streetlight",
        status=ReportStatus.RESOLVED,
        priority=Priority.LOW,
        latitude=26.8468,
        longitude=80.9463,
        risk_score=15.0,
        ai_confidence=0.95,
        verification_decision=VerificationDecision.PASS,
        verification_passed=True,
    )
    db_session.add_all([active_report, resolved_report])
    db_session.commit()

    # 1. Recent Read (15 days ago) - MUST BE RETAINED
    notif_recent_read = InAppNotification(
        user_id=sample_user.id,
        report_id=active_report.id,
        title="Recent Read",
        message="Notice",
        type="WORK_STARTED",
        is_read=True,
        created_at=now - timedelta(days=15),
    )
    # 2. Old Read (95 days ago) - MUST BE DELETED
    notif_old_read = InAppNotification(
        user_id=sample_user.id,
        report_id=active_report.id,
        title="Old Read",
        message="Notice",
        type="WORK_STARTED",
        is_read=True,
        created_at=now - timedelta(days=95),
    )
    # 3. Recent Unread (15 days ago) - MUST BE RETAINED
    notif_recent_unread = InAppNotification(
        user_id=sample_user.id,
        report_id=active_report.id,
        title="Recent Unread",
        message="Notice",
        type="NEW_ASSIGNMENT",
        is_read=False,
        created_at=now - timedelta(days=15),
    )
    # 4. Old Unread on ACTIVE report (120 days ago) - MUST BE RETAINED (actionable)
    notif_active_unread = InAppNotification(
        user_id=sample_user.id,
        report_id=active_report.id,
        title="Old Unread Active",
        message="Urgent action required",
        type="NEW_ASSIGNMENT",
        is_read=False,
        created_at=now - timedelta(days=120),
    )
    # 5. Old Unread on TERMINAL report (120 days ago) - MUST BE DELETED (non-actionable)
    notif_terminal_unread = InAppNotification(
        user_id=sample_user.id,
        report_id=resolved_report.id,
        title="Old Unread Terminal",
        message="Issue was resolved",
        type="REPORT_RESOLVED",
        is_read=False,
        created_at=now - timedelta(days=120),
    )
    # 6. Old Unread without report (120 days ago) - MUST BE DELETED
    notif_no_report_unread = InAppNotification(
        user_id=sample_user.id,
        report_id=None,
        title="System Notice",
        message="Maintenance window",
        type="SYSTEM",
        is_read=False,
        created_at=now - timedelta(days=120),
    )
    # 7. Stale Unread on ACTIVE report exceeding 365 days max safety - MUST BE DELETED
    notif_stale_max_unread = InAppNotification(
        user_id=sample_user.id,
        report_id=active_report.id,
        title="Very Old Unread",
        message="Stale notice",
        type="NEW_ASSIGNMENT",
        is_read=False,
        created_at=now - timedelta(days=370),
    )

    db_session.add_all([
        notif_recent_read,
        notif_old_read,
        notif_recent_unread,
        notif_active_unread,
        notif_terminal_unread,
        notif_no_report_unread,
        notif_stale_max_unread,
    ])
    db_session.commit()

    recent_read_id = notif_recent_read.id
    old_read_id = notif_old_read.id
    recent_unread_id = notif_recent_unread.id
    active_unread_id = notif_active_unread.id
    terminal_unread_id = notif_terminal_unread.id
    no_report_unread_id = notif_no_report_unread.id
    stale_max_unread_id = notif_stale_max_unread.id

    service = DataRetentionService(db_session)
    res = service.cleanup_in_app_notifications(dry_run=False)

    assert res["status"] == "success"
    assert res["deleted"] == 4

    remaining_ids = {n.id for n in db_session.query(InAppNotification).all()}
    assert recent_read_id in remaining_ids
    assert recent_unread_id in remaining_ids
    assert active_unread_id in remaining_ids

    assert old_read_id not in remaining_ids
    assert terminal_unread_id not in remaining_ids
    assert no_report_unread_id not in remaining_ids
    assert stale_max_unread_id not in remaining_ids


# =========================================================================
# 9, 10, 11. CORE CIVIC RECORDS INTEGRITY TESTS
# =========================================================================


def test_core_civic_records_never_deleted(db_session, sample_user):
    """Verify:
    9. Core report is never deleted.
    10. Report history/forward records are never deleted.
    11. Resolution records and audit logs are never deleted.
    """
    now = utc_now()
    two_years_ago = now - timedelta(days=730)

    # 1. Very old report (2 years old)
    old_report = Report(
        citizen_id=sample_user.id,
        department_id=sample_user.department_id,
        report_number="REP-CIVIC-HISTORIC-001",
        issue_type="Major Drainage Failure",
        description="Crucial audit report that must be retained forever",
        status=ReportStatus.RESOLVED,
        priority=Priority.HIGH,
        latitude=26.85,
        longitude=80.95,
        risk_score=80.0,
        ai_confidence=0.99,
        verification_decision=VerificationDecision.PASS,
        verification_passed=True,
        created_at=two_years_ago,
    )
    db_session.add(old_report)
    db_session.commit()
    db_session.refresh(old_report)

    # 2. Resolution record
    resolution = Resolution(
        report_id=old_report.id,
        worker_id=sample_user.id,
        remarks="Replaced entire drainage pipeline.",
        resolved_at=two_years_ago,
    )
    db_session.add(resolution)

    # 3. Report Forward History
    forward_hist = ReportForwardHistory(
        report_id=old_report.id,
        forward_number=1,
        from_department_id=sample_user.department_id,
        to_department_id=sample_user.department_id,
        forwarded_by=sample_user.id,
        issue_type="Drainage",
        reason_type=ForwardReasonType.ADMINISTRATIVE_TRANSFER,
        remarks="Administrative transfer",
        created_at=two_years_ago,
    )
    db_session.add(forward_hist)

    # 4. Audit Log
    audit_log = AuditLog(
        report_id=old_report.id,
        user_id=sample_user.id,
        action="REPORT_RESOLVED",
        details="Resolution verified by system",
        created_at=two_years_ago,
    )
    db_session.add(audit_log)
    db_session.commit()

    report_id = old_report.id
    resolution_id = resolution.id
    forward_id = forward_hist.id
    audit_id = audit_log.id

    # Run the comprehensive retention cleanup
    service = DataRetentionService(db_session)
    res = service.run_all(dry_run=False)

    assert res["overall_status"] == "success"

    # Verify that ALL core civic records remain intact
    assert db_session.query(Report).filter(Report.id == report_id).count() == 1
    assert db_session.query(Resolution).filter(Resolution.id == resolution_id).count() == 1
    assert (
        db_session.query(ReportForwardHistory)
        .filter(ReportForwardHistory.id == forward_id)
        .count()
        == 1
    )
    assert db_session.query(AuditLog).filter(AuditLog.id == audit_id).count() == 1


# =========================================================================
# 12, 13, 14. IDEMPOTENCY, BATCHING, & FAILURE RESILIENCE TESTS
# =========================================================================


def test_cleanup_idempotent_can_safely_run_twice(db_session, sample_user):
    """Verify cleanup can run twice without side effects or errors (Requirement 12)."""
    now = utc_now()
    old_time = now - timedelta(days=200)

    # Insert old items
    audit = LoginAudit(
        user_id=sample_user.id,
        email=sample_user.email,
        login_success=True,
        login_at=old_time,
    )
    db_session.add(audit)
    db_session.commit()

    service = DataRetentionService(db_session)

    # Run 1: deletes the old record
    res1 = service.run_all(dry_run=False)
    assert res1["overall_status"] == "success"
    assert res1["total_deleted"] >= 1

    # Run 2: finds 0 eligible records, deletes 0, returns success
    res2 = service.run_all(dry_run=False)
    assert res2["overall_status"] == "success"
    assert res2["total_deleted"] == 0
    assert res2["total_examined"] == 0


def test_batched_execution_safety(db_session, sample_user):
    """Verify batched deletion operates in bounded chunks safely (Requirement 13)."""
    now = utc_now()
    old_time = now - timedelta(days=200)

    # Insert 25 old login audits
    audits = [
        LoginAudit(
            user_id=sample_user.id,
            email=f"user_{i}@test.gov.in",
            login_success=True,
            login_at=old_time,
        )
        for i in range(25)
    ]
    db_session.add_all(audits)
    db_session.commit()

    service = DataRetentionService(db_session)

    # Clean with small batch size of 7
    res = service.cleanup_login_audits(batch_size=7, dry_run=False)

    assert res["status"] == "success"
    assert res["deleted"] == 25
    # 25 records with batch size 7 -> 4 batches (7 + 7 + 7 + 4)
    assert res["batches"] == 4
    assert db_session.query(LoginAudit).count() == 0


def test_cleanup_failure_resilience(db_session):
    """Verify that a failure in one target is isolated, logged, and does not break application (Requirement 14)."""
    service = DataRetentionService(db_session)

    original_query = db_session.query

    def broken_query(*args, **kwargs):
        # Match query for LoginAudit or LoginAudit.id
        if args:
            target = args[0]
            if (
                target is LoginAudit
                or getattr(target, "class_", None) is LoginAudit
                or getattr(target, "table", None) is LoginAudit.__table__
            ):
                raise RuntimeError("Simulated transient database connection failure")
        return original_query(*args, **kwargs)

    db_session.query = broken_query

    # Run should not raise exception; instead, isolates error and returns status
    res = service.run_all(dry_run=False)

    # Restore query
    db_session.query = original_query

    assert res["overall_status"] in ("partial_failure", "failed")
    assert "login_audits" in res["targets"]
    assert res["targets"]["login_audits"]["status"] == "failed"
    assert "Simulated transient database connection failure" in res["targets"]["login_audits"]["error"]


# =========================================================================
# DRY RUN MODE TESTS
# =========================================================================


def test_dry_run_mode(db_session, sample_user):
    """Verify dry-run reports eligible row counts and cutoff timestamps without deleting anything."""
    now = utc_now()
    old_time = now - timedelta(days=200)

    audit = LoginAudit(
        user_id=sample_user.id,
        email=sample_user.email,
        login_success=True,
        login_at=old_time,
    )
    token = RefreshToken(
        user_id=sample_user.id,
        token_hash="dry_run_hash",
        jwt_id="dry_run_jwt",
        session_id="dry_run_sess",
        expires_at=old_time,
    )
    db_session.add_all([audit, token])
    db_session.commit()

    audit_id = audit.id
    token_id = token.id

    service = DataRetentionService(db_session)
    res = service.run_all(dry_run=True)

    assert res["dry_run"] is True
    assert res["overall_status"] == "success"
    assert res["total_examined"] >= 2
    assert res["total_deleted"] == 0

    # Ensure no rows were deleted in database
    assert db_session.query(LoginAudit).filter(LoginAudit.id == audit_id).count() == 1
    assert db_session.query(RefreshToken).filter(RefreshToken.id == token_id).count() == 1


# =========================================================================
# CLI SCRIPT TESTS
# =========================================================================


def test_cli_retention_script(monkeypatch, db_session, sample_user):
    """Verify scripts.run_data_retention CLI operates properly in dry-run and live modes."""
    import scripts.run_data_retention as cli_mod

    # Patch SessionLocal to return our in-memory test session
    monkeypatch.setattr(cli_mod, "SessionLocal", lambda: db_session)

    # Test 1: dry run via CLI arguments
    monkeypatch.setattr(
        "sys.argv",
        ["run_data_retention.py", "--dry-run", "--json", "--target", "all"],
    )
    with pytest.raises(SystemExit) as exc_info:
        cli_mod.main()
    assert exc_info.value.code == 0

    # Test 2: live run with specific target
    monkeypatch.setattr(
        "sys.argv",
        ["run_data_retention.py", "--target", "login_audits", "--batch-size", "50"],
    )
    with pytest.raises(SystemExit) as exc_info:
        cli_mod.main()
    assert exc_info.value.code == 0
