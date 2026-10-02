"""
CSCRS Production Orphan Object Storage Reconciliation CLI
Audits and safely reconciles storage objects against PostgreSQL references.

Detects:
1. missing_in_storage: object_key exists in DB, but missing from storage provider.
2. orphaned_in_storage: object exists in storage provider, but no DB record references it.

Modes:
- audit (default): Read-only audit; reports discrepancies without deleting anything.
- cleanup: Requires explicit flags (--force and --safety-days) to clean confirmed orphans.
"""

import argparse
from datetime import datetime, timezone, timedelta
import json
import logging
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from database.connection import SessionLocal
from database.models.report_image import ReportImage
from database.models.resolution_attempt import ResolutionAttempt
from database.models.user import User
from database.models.system_issue_attachment import SystemIssueAttachment
from database.models.public_update import PublicUpdate
from storage.media_service import get_media_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reconciliation")


class ObjectReconciler:
    def __init__(self, db, safety_days: int = 7):
        self.db = db
        self.safety_days = safety_days
        self.media_service = get_media_service()

    def collect_db_keys(self) -> set[str]:
        db_keys = set()

        # 1. Report Images
        try:
            for (key,) in self.db.query(ReportImage.object_key).filter(ReportImage.object_key.isnot(None)):
                if key:
                    db_keys.add(key)
        except Exception as e:
            self.db.rollback()
            logger.warning(f"Could not query ReportImage.object_key (schema may be pending migration): {e}")

        # 2. Resolution Attempts
        try:
            for (key,) in self.db.query(ResolutionAttempt.object_key).filter(ResolutionAttempt.object_key.isnot(None)):
                if key:
                    db_keys.add(key)
            for (key,) in self.db.query(ResolutionAttempt.annotated_object_key).filter(
                ResolutionAttempt.annotated_object_key.isnot(None)
            ):
                if key:
                    db_keys.add(key)
        except Exception as e:
            self.db.rollback()
            logger.warning(f"Could not query ResolutionAttempt object keys: {e}")

        # 3. User Profiles
        try:
            for (key,) in self.db.query(User.profile_image_object_key).filter(
                User.profile_image_object_key.isnot(None)
            ):
                if key:
                    db_keys.add(key)
        except Exception as e:
            self.db.rollback()
            logger.warning(f"Could not query User.profile_image_object_key: {e}")

        # 4. System Issue Attachments
        try:
            for (key,) in self.db.query(SystemIssueAttachment.object_key).filter(
                SystemIssueAttachment.object_key.isnot(None)
            ):
                if key:
                    db_keys.add(key)
        except Exception as e:
            self.db.rollback()
            logger.warning(f"Could not query SystemIssueAttachment.object_key: {e}")

        # 5. Public Updates
        try:
            for (key,) in self.db.query(PublicUpdate.thumbnail_object_key).filter(
                PublicUpdate.thumbnail_object_key.isnot(None)
            ):
                if key:
                    db_keys.add(key)
        except Exception as e:
            self.db.rollback()
            logger.warning(f"Could not query PublicUpdate.thumbnail_object_key: {e}")

        return db_keys

    def run_audit(self) -> dict:
        db_keys = self.collect_db_keys()

        # Check DB keys that are missing in storage
        missing_in_storage = []
        for key in db_keys:
            try:
                if not self.media_service.provider.exists(key):
                    missing_in_storage.append(key)
            except Exception as e:
                logger.error(f"Error checking existence for key {key}: {e}")

        # List storage objects under prefix
        orphaned_in_storage = []
        now = datetime.now(timezone.utc)
        cutoff_date = now - timedelta(days=self.safety_days)

        # Provider-specific listing (LocalStorage or OCIStorage)
        provider = self.media_service.provider
        storage_objects = []

        if hasattr(provider, "list_objects"):
            try:
                storage_objects = provider.list_objects(prefix=self.media_service.prefix)
            except Exception as e:
                logger.warning(f"Failed listing storage objects: {e}")
        elif hasattr(provider, "base_dir"):
            # Local storage provider directory scan
            prefix_dir = provider.base_dir / self.media_service.prefix
            if prefix_dir.exists():
                for p in prefix_dir.rglob("*"):
                    if p.is_file():
                        rel = p.relative_to(provider.base_dir).as_posix()
                        stat = p.stat()
                        mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
                        storage_objects.append({"name": rel, "time_modified": mtime, "size": stat.st_size})

        for obj in storage_objects:
            obj_name = obj.get("name") if isinstance(obj, dict) else getattr(obj, "name", None)
            time_created = (
                obj.get("time_modified") if isinstance(obj, dict) else getattr(obj, "time_created", None)
            )

            if obj_name and obj_name not in db_keys:
                # Check safety period
                eligible_for_cleanup = False
                if time_created and time_created < cutoff_date:
                    eligible_for_cleanup = True

                orphaned_in_storage.append({
                    "object_key": obj_name,
                    "created_at": time_created.isoformat() if time_created else None,
                    "eligible_for_cleanup": eligible_for_cleanup,
                })

        return {
            "mode": "audit",
            "provider": self.media_service.provider_name,
            "total_db_keys": len(db_keys),
            "missing_in_storage_count": len(missing_in_storage),
            "missing_in_storage": missing_in_storage,
            "orphaned_in_storage_count": len(orphaned_in_storage),
            "orphaned_in_storage": orphaned_in_storage,
            "safety_days": self.safety_days,
        }

    def run_cleanup(self, force: bool = False) -> dict:
        audit_res = self.run_audit()
        if not force:
            raise ValueError("Cleanup mode requires explicit --force flag to execute object deletion.")

        deleted_keys = []
        failed_keys = []

        for orphan in audit_res["orphaned_in_storage"]:
            if orphan["eligible_for_cleanup"]:
                key = orphan["object_key"]
                try:
                    self.media_service.delete(key)
                    deleted_keys.append(key)
                except Exception as e:
                    failed_keys.append({"key": key, "error": str(e)})

        return {
            "mode": "cleanup",
            "provider": self.media_service.provider_name,
            "total_orphans_found": audit_res["orphaned_in_storage_count"],
            "eligible_for_cleanup": sum(1 for o in audit_res["orphaned_in_storage"] if o["eligible_for_cleanup"]),
            "deleted_count": len(deleted_keys),
            "deleted_keys": deleted_keys,
            "failed_count": len(failed_keys),
            "failed_keys": failed_keys,
        }


def parse_args():
    parser = argparse.ArgumentParser(
        description="CSCRS Production Orphan Object Storage Reconciliation CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--mode",
        type=str,
        choices=["audit", "cleanup"],
        default="audit",
        help="Reconciliation mode. 'audit' is read-only (default). 'cleanup' purges safe orphans.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        default=False,
        help="Explicit confirmation required to perform object deletions in cleanup mode.",
    )
    parser.add_argument(
        "--safety-days",
        type=int,
        default=7,
        help="Minimum age (in days) an orphan object must have to be eligible for cleanup.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        default=False,
        help="Format output strictly as JSON.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    db = SessionLocal()
    try:
        reconciler = ObjectReconciler(db, safety_days=args.safety_days)
        if args.mode == "audit":
            result = reconciler.run_audit()
        elif args.mode == "cleanup":
            result = reconciler.run_cleanup(force=args.force)

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print("\n=== Object Storage Reconciliation ===")
            print(json.dumps(result, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
