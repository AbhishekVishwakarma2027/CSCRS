import time
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from configs.config import (
    LOGIN_AUDIT_RETENTION_DAYS,
    NOTIFICATION_MAX_UNREAD_RETENTION_DAYS,
    NOTIFICATION_RETENTION_DAYS,
    REFRESH_TOKEN_RETENTION_DAYS,
    RETENTION_BATCH_SIZE,
)
from database.enums import ReportStatus
from database.models.in_app_notification import InAppNotification
from database.models.login_audit import LoginAudit
from database.models.refresh_token import RefreshToken
from database.models.report import Report
from utils.datetime_utils import utc_now
from utils.logger import get_logger

logger = get_logger("cscrs")

# Core civic records and audit logs that MUST NOT be deleted by retention cleanup
PROTECTED_TABLES = frozenset(
    [
        "reports",
        "audit_logs",
        "resolutions",
        "resolution_attempts",
        "resolution_ai_results",
        "report_forward_histories",
        "public_updates",
        "broadcasts",
    ]
)

# Terminal report statuses: reports that are no longer active/actionable
TERMINAL_REPORT_STATUSES = [
    ReportStatus.RESOLVED,
    ReportStatus.VERIFIED,
    ReportStatus.CLOSED,
    ReportStatus.CANCELLED,
    ReportStatus.REJECTED,
]


class DataRetentionService:
    """Production-grade data retention service for operational database tables.

    Preserves all core civic records indefinitely while cleaning up:
    1. Login audits older than LOGIN_AUDIT_RETENTION_DAYS (180 days).
    2. Expired / lifetime-elapsed refresh tokens (expires_at < cutoff).
    3. In-app notifications:
       - Read notifications older than NOTIFICATION_RETENTION_DAYS (90 days).
       - Unread notifications associated with terminal reports older than 90 days.
       - Stale unread notifications exceeding NOTIFICATION_MAX_UNREAD_RETENTION_DAYS (365 days).
       - Actionable unread notifications on active reports are preserved.

    Guarantees:
    - Bounded batch operations to prevent unbounded memory and long-running locks.
    - Deterministic timestamp cutoffs computed once per run.
    - Idempotent and safe to retry.
    - Dry-run capability reporting eligible counts without deletions.
    - Safe error containment so failures do not break regular application functionality.
    """

    def __init__(self, db: Session):
        self.db = db

    def cleanup_login_audits(
        self,
        *,
        cutoff: datetime | None = None,
        dry_run: bool = False,
        batch_size: int | None = None,
    ) -> dict[str, Any]:
        """Clean up login audit records older than the cutoff timestamp."""
        batch_size = batch_size or RETENTION_BATCH_SIZE
        if cutoff is None:
            cutoff = utc_now() - timedelta(days=LOGIN_AUDIT_RETENTION_DAYS)

        start_time = time.time()
        logger.info(
            "Starting login audits retention cleanup | cutoff=%s | dry_run=%s | batch_size=%d",
            cutoff.isoformat(),
            dry_run,
            batch_size,
        )

        filter_condition = LoginAudit.login_at < cutoff

        if dry_run:
            try:
                eligible_count = (
                    self.db.query(LoginAudit)
                    .filter(filter_condition)
                    .count()
                )
                duration = time.time() - start_time
                logger.info(
                    "Dry-run login audits cleanup complete | eligible=%d | duration=%.3fs",
                    eligible_count,
                    duration,
                )
                return {
                    "target": "login_audits",
                    "cutoff": cutoff.isoformat(),
                    "dry_run": True,
                    "examined": eligible_count,
                    "deleted": 0,
                    "batches": 0,
                    "duration_seconds": round(duration, 3),
                    "status": "success",
                }
            except Exception as exc:
                duration = time.time() - start_time
                logger.exception("Dry-run login audits cleanup failed: %s", exc)
                return {
                    "target": "login_audits",
                    "cutoff": cutoff.isoformat(),
                    "dry_run": True,
                    "examined": 0,
                    "deleted": 0,
                    "batches": 0,
                    "duration_seconds": round(duration, 3),
                    "status": "failed",
                    "error": str(exc),
                }

        deleted_total = 0
        batch_num = 0
        try:
            while True:
                batch_ids = [
                    row[0]
                    for row in (
                        self.db.query(LoginAudit.id)
                        .filter(filter_condition)
                        .order_by(LoginAudit.id.asc())
                        .limit(batch_size)
                        .all()
                    )
                ]

                if not batch_ids:
                    break

                deleted = (
                    self.db.query(LoginAudit)
                    .filter(LoginAudit.id.in_(batch_ids))
                    .delete(synchronize_session=False)
                )
                self.db.commit()

                deleted_total += deleted
                batch_num += 1
                logger.info(
                    "Login audits batch %d deleted %d records (total: %d)",
                    batch_num,
                    deleted,
                    deleted_total,
                )

                if len(batch_ids) < batch_size:
                    break

            duration = time.time() - start_time
            logger.info(
                "Login audits retention cleanup completed | deleted=%d | batches=%d | duration=%.3fs",
                deleted_total,
                batch_num,
                duration,
            )
            return {
                "target": "login_audits",
                "cutoff": cutoff.isoformat(),
                "dry_run": False,
                "examined": deleted_total,
                "deleted": deleted_total,
                "batches": batch_num,
                "duration_seconds": round(duration, 3),
                "status": "success",
            }
        except Exception as exc:
            self.db.rollback()
            duration = time.time() - start_time
            logger.exception("Login audits retention cleanup failed: %s", exc)
            return {
                "target": "login_audits",
                "cutoff": cutoff.isoformat(),
                "dry_run": False,
                "examined": deleted_total,
                "deleted": deleted_total,
                "batches": batch_num,
                "duration_seconds": round(duration, 3),
                "status": "failed",
                "error": str(exc),
            }

    def cleanup_refresh_tokens(
        self,
        *,
        cutoff: datetime | None = None,
        dry_run: bool = False,
        batch_size: int | None = None,
    ) -> dict[str, Any]:
        """Clean up expired and lifetime-elapsed refresh tokens.

        Active tokens (revoked_at IS NULL AND expires_at > now) are NEVER deleted.
        Tokens are eligible for cleanup once expires_at < cutoff (default utc_now()).
        """
        batch_size = batch_size or RETENTION_BATCH_SIZE
        if cutoff is None:
            cutoff = utc_now() - timedelta(days=REFRESH_TOKEN_RETENTION_DAYS)

        start_time = time.time()
        logger.info(
            "Starting refresh tokens retention cleanup | cutoff=%s | dry_run=%s | batch_size=%d",
            cutoff.isoformat(),
            dry_run,
            batch_size,
        )

        filter_condition = RefreshToken.expires_at < cutoff

        if dry_run:
            try:
                eligible_count = (
                    self.db.query(RefreshToken)
                    .filter(filter_condition)
                    .count()
                )
                duration = time.time() - start_time
                logger.info(
                    "Dry-run refresh tokens cleanup complete | eligible=%d | duration=%.3fs",
                    eligible_count,
                    duration,
                )
                return {
                    "target": "refresh_tokens",
                    "cutoff": cutoff.isoformat(),
                    "dry_run": True,
                    "examined": eligible_count,
                    "deleted": 0,
                    "batches": 0,
                    "duration_seconds": round(duration, 3),
                    "status": "success",
                }
            except Exception as exc:
                duration = time.time() - start_time
                logger.exception("Dry-run refresh tokens cleanup failed: %s", exc)
                return {
                    "target": "refresh_tokens",
                    "cutoff": cutoff.isoformat(),
                    "dry_run": True,
                    "examined": 0,
                    "deleted": 0,
                    "batches": 0,
                    "duration_seconds": round(duration, 3),
                    "status": "failed",
                    "error": str(exc),
                }

        deleted_total = 0
        batch_num = 0
        try:
            while True:
                batch_ids = [
                    row[0]
                    for row in (
                        self.db.query(RefreshToken.id)
                        .filter(filter_condition)
                        .order_by(RefreshToken.id.asc())
                        .limit(batch_size)
                        .all()
                    )
                ]

                if not batch_ids:
                    break

                deleted = (
                    self.db.query(RefreshToken)
                    .filter(RefreshToken.id.in_(batch_ids))
                    .delete(synchronize_session=False)
                )
                self.db.commit()

                deleted_total += deleted
                batch_num += 1
                logger.info(
                    "Refresh tokens batch %d deleted %d records (total: %d)",
                    batch_num,
                    deleted,
                    deleted_total,
                )

                if len(batch_ids) < batch_size:
                    break

            duration = time.time() - start_time
            logger.info(
                "Refresh tokens retention cleanup completed | deleted=%d | batches=%d | duration=%.3fs",
                deleted_total,
                batch_num,
                duration,
            )
            return {
                "target": "refresh_tokens",
                "cutoff": cutoff.isoformat(),
                "dry_run": False,
                "examined": deleted_total,
                "deleted": deleted_total,
                "batches": batch_num,
                "duration_seconds": round(duration, 3),
                "status": "success",
            }
        except Exception as exc:
            self.db.rollback()
            duration = time.time() - start_time
            logger.exception("Refresh tokens retention cleanup failed: %s", exc)
            return {
                "target": "refresh_tokens",
                "cutoff": cutoff.isoformat(),
                "dry_run": False,
                "examined": deleted_total,
                "deleted": deleted_total,
                "batches": batch_num,
                "duration_seconds": round(duration, 3),
                "status": "failed",
                "error": str(exc),
            }

    def cleanup_in_app_notifications(
        self,
        *,
        read_cutoff: datetime | None = None,
        max_unread_cutoff: datetime | None = None,
        dry_run: bool = False,
        batch_size: int | None = None,
    ) -> dict[str, Any]:
        """Clean up in-app notifications according to approved lifecycle policy:

        1. Read notifications older than read_cutoff (90 days) are deleted.
        2. Unread notifications older than read_cutoff (90 days) are deleted ONLY IF
           their underlying report is terminal (Resolved, Verified, Closed, Cancelled, Rejected)
           or has no associated report.
        3. Stale unread notifications exceeding max_unread_cutoff (365 days) are deleted for safety.
        4. Actionable unread notifications on active reports are strictly preserved.
        """
        batch_size = batch_size or RETENTION_BATCH_SIZE
        now = utc_now()
        if read_cutoff is None:
            read_cutoff = now - timedelta(days=NOTIFICATION_RETENTION_DAYS)
        if max_unread_cutoff is None:
            max_unread_cutoff = now - timedelta(
                days=NOTIFICATION_MAX_UNREAD_RETENTION_DAYS
            )

        start_time = time.time()
        logger.info(
            "Starting in-app notifications retention cleanup | read_cutoff=%s | max_unread_cutoff=%s | dry_run=%s | batch_size=%d",
            read_cutoff.isoformat(),
            max_unread_cutoff.isoformat(),
            dry_run,
            batch_size,
        )

        cond_read_expired = and_(
            InAppNotification.is_read.is_(True),
            InAppNotification.created_at < read_cutoff,
        )

        cond_unread_stale = and_(
            InAppNotification.is_read.is_(False),
            InAppNotification.created_at < max_unread_cutoff,
        )

        cond_unread_terminal = and_(
            InAppNotification.is_read.is_(False),
            InAppNotification.created_at < read_cutoff,
            or_(
                InAppNotification.report_id.is_(None),
                Report.status.in_(TERMINAL_REPORT_STATUSES),
            ),
        )

        eligible_filter = or_(
            cond_read_expired,
            cond_unread_stale,
            cond_unread_terminal,
        )

        query = (
            self.db.query(InAppNotification.id)
            .outerjoin(Report, InAppNotification.report_id == Report.id)
            .filter(eligible_filter)
        )

        if dry_run:
            try:
                eligible_count = query.count()
                duration = time.time() - start_time
                logger.info(
                    "Dry-run in-app notifications cleanup complete | eligible=%d | duration=%.3fs",
                    eligible_count,
                    duration,
                )
                return {
                    "target": "in_app_notifications",
                    "read_cutoff": read_cutoff.isoformat(),
                    "max_unread_cutoff": max_unread_cutoff.isoformat(),
                    "dry_run": True,
                    "examined": eligible_count,
                    "deleted": 0,
                    "batches": 0,
                    "duration_seconds": round(duration, 3),
                    "status": "success",
                }
            except Exception as exc:
                duration = time.time() - start_time
                logger.exception(
                    "Dry-run in-app notifications cleanup failed: %s", exc
                )
                return {
                    "target": "in_app_notifications",
                    "read_cutoff": read_cutoff.isoformat(),
                    "max_unread_cutoff": max_unread_cutoff.isoformat(),
                    "dry_run": True,
                    "examined": 0,
                    "deleted": 0,
                    "batches": 0,
                    "duration_seconds": round(duration, 3),
                    "status": "failed",
                    "error": str(exc),
                }

        deleted_total = 0
        batch_num = 0
        try:
            while True:
                batch_ids = [
                    row[0]
                    for row in (
                        query.order_by(InAppNotification.id.asc())
                        .limit(batch_size)
                        .all()
                    )
                ]

                if not batch_ids:
                    break

                deleted = (
                    self.db.query(InAppNotification)
                    .filter(InAppNotification.id.in_(batch_ids))
                    .delete(synchronize_session=False)
                )
                self.db.commit()

                deleted_total += deleted
                batch_num += 1
                logger.info(
                    "In-app notifications batch %d deleted %d records (total: %d)",
                    batch_num,
                    deleted,
                    deleted_total,
                )

                if len(batch_ids) < batch_size:
                    break

            duration = time.time() - start_time
            logger.info(
                "In-app notifications retention cleanup completed | deleted=%d | batches=%d | duration=%.3fs",
                deleted_total,
                batch_num,
                duration,
            )
            return {
                "target": "in_app_notifications",
                "read_cutoff": read_cutoff.isoformat(),
                "max_unread_cutoff": max_unread_cutoff.isoformat(),
                "dry_run": False,
                "examined": deleted_total,
                "deleted": deleted_total,
                "batches": batch_num,
                "duration_seconds": round(duration, 3),
                "status": "success",
            }
        except Exception as exc:
            self.db.rollback()
            duration = time.time() - start_time
            logger.exception("In-app notifications retention cleanup failed: %s", exc)
            return {
                "target": "in_app_notifications",
                "read_cutoff": read_cutoff.isoformat(),
                "max_unread_cutoff": max_unread_cutoff.isoformat(),
                "dry_run": False,
                "examined": deleted_total,
                "deleted": deleted_total,
                "batches": batch_num,
                "duration_seconds": round(duration, 3),
                "status": "failed",
                "error": str(exc),
            }

    def run_all(
        self,
        *,
        dry_run: bool = False,
        batch_size: int | None = None,
    ) -> dict[str, Any]:
        """Execute data retention cleanup across all operational tables."""
        start_time = time.time()
        start_dt = utc_now()
        logger.info(
            "=== DATA RETENTION RUN STARTED | dry_run=%s | started_at=%s ===",
            dry_run,
            start_dt.isoformat(),
        )

        results: dict[str, Any] = {
            "dry_run": dry_run,
            "started_at": start_dt.isoformat(),
            "targets": {},
            "total_examined": 0,
            "total_deleted": 0,
            "errors": [],
            "overall_status": "success",
        }

        # 1. Login Audits
        audit_res = self.cleanup_login_audits(dry_run=dry_run, batch_size=batch_size)
        results["targets"]["login_audits"] = audit_res
        results["total_examined"] += audit_res.get("examined", 0)
        results["total_deleted"] += audit_res.get("deleted", 0)
        if audit_res.get("status") != "success":
            results["errors"].append(f"login_audits: {audit_res.get('error')}")
            results["overall_status"] = "partial_failure"

        # 2. Refresh Tokens
        token_res = self.cleanup_refresh_tokens(dry_run=dry_run, batch_size=batch_size)
        results["targets"]["refresh_tokens"] = token_res
        results["total_examined"] += token_res.get("examined", 0)
        results["total_deleted"] += token_res.get("deleted", 0)
        if token_res.get("status") != "success":
            results["errors"].append(f"refresh_tokens: {token_res.get('error')}")
            results["overall_status"] = "partial_failure"

        # 3. In-App Notifications
        notif_res = self.cleanup_in_app_notifications(
            dry_run=dry_run, batch_size=batch_size
        )
        results["targets"]["in_app_notifications"] = notif_res
        results["total_examined"] += notif_res.get("examined", 0)
        results["total_deleted"] += notif_res.get("deleted", 0)
        if notif_res.get("status") != "success":
            results["errors"].append(
                f"in_app_notifications: {notif_res.get('error')}"
            )
            results["overall_status"] = "partial_failure"

        end_dt = utc_now()
        duration = time.time() - start_time
        results["completed_at"] = end_dt.isoformat()
        results["duration_seconds"] = round(duration, 3)

        if len(results["errors"]) == 3:
            results["overall_status"] = "failed"

        logger.info(
            "=== DATA RETENTION RUN COMPLETED | status=%s | examined=%d | deleted=%d | duration=%.3fs ===",
            results["overall_status"],
            results["total_examined"],
            results["total_deleted"],
            duration,
        )

        return results
