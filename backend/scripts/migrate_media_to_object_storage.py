"""
CSCRS Production Historical Media Migration CLI
Migrates legacy local filesystem media to configured StorageProvider (OCI / Local).

Process:
1. Locate unmigrated records (storage_provider == 'local' or object_key is None).
2. Validate local source file.
3. Compute SHA-256 checksum.
4. Upload object to StorageProvider.
5. Verify storage existence and readability.
6. Atomically update DB record with object_key and storage_provider.
7. Preserve local file on disk for safety.
"""

import argparse
import hashlib
import json
import logging
from pathlib import Path
import sys

# Ensure backend root is in sys.path
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
logger = logging.getLogger("media_migration")


def compute_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def resolve_local_path(raw_path: str | None) -> Path | None:
    if not raw_path:
        return None
    p = Path(raw_path)
    if p.exists() and p.is_file():
        return p
    # Check relative to uploads/
    candidate = Path("uploads") / raw_path.lstrip("/\\")
    if candidate.exists() and candidate.is_file():
        return candidate
    # Check relative to project root
    candidate2 = PROJECT_ROOT / raw_path.lstrip("/\\")
    if candidate2.exists() and candidate2.is_file():
        return candidate2
    return None


class MediaMigrationRunner:
    def __init__(self, db, dry_run: bool = False, batch_size: int = 50):
        self.db = db
        self.dry_run = dry_run
        self.batch_size = batch_size
        self.media_service = get_media_service()

    def migrate_report_images(self) -> dict:
        query = (
            self.db.query(ReportImage)
            .filter(
                (ReportImage.object_key.is_(None))
                | (ReportImage.storage_provider == "local")
            )
            .limit(self.batch_size)
        )
        records = query.all()
        migrated, skipped, failed = 0, 0, 0

        for record in records:
            try:
                local_file = resolve_local_path(record.image_path)
                if not local_file:
                    skipped += 1
                    logger.warning(f"ReportImage {record.id}: Local file not found ({record.image_path})")
                    continue

                sha256_hash = compute_sha256(local_file)
                ext = local_file.suffix.lstrip(".").lower() or "webp"
                object_key = self.media_service.build_report_image_key(
                    record.report_id,
                    image_type="original",
                    ext=ext,
                )

                if not self.dry_run:
                    self.media_service.upload_file(
                        local_path=local_file,
                        object_key=object_key,
                        content_type=f"image/{ext if ext != 'jpg' else 'jpeg'}",
                    )
                    # Verify read
                    if not self.media_service.provider.exists(object_key):
                        raise RuntimeError(f"Uploaded object {object_key} existence verification failed")

                    record.object_key = object_key
                    record.storage_provider = self.media_service.provider_name
                    record.sha256 = sha256_hash
                    self.db.commit()

                migrated += 1
            except Exception as e:
                self.db.rollback()
                failed += 1
                logger.error(f"Failed migrating ReportImage {record.id}: {e}")

        return {"examined": len(records), "migrated": migrated, "skipped": skipped, "failed": failed}

    def migrate_resolution_attempts(self) -> dict:
        query = (
            self.db.query(ResolutionAttempt)
            .filter(
                (ResolutionAttempt.object_key.is_(None))
                | (ResolutionAttempt.storage_provider == "local")
            )
            .limit(self.batch_size)
        )
        records = query.all()
        migrated, skipped, failed = 0, 0, 0

        for record in records:
            try:
                local_file = resolve_local_path(record.image_path)
                if not local_file:
                    skipped += 1
                    continue

                ext = local_file.suffix.lstrip(".").lower() or "webp"
                report_id = record.resolution.report_id if record.resolution else "unknown"
                object_key = self.media_service.build_resolution_image_key(
                    report_id=report_id,
                    attempt_id=record.id,
                    image_type="proof",
                    ext=ext,
                )

                if not self.dry_run:
                    self.media_service.upload_file(
                        local_path=local_file,
                        object_key=object_key,
                        content_type=f"image/{ext if ext != 'jpg' else 'jpeg'}",
                    )
                    record.object_key = object_key
                    record.storage_provider = self.media_service.provider_name

                    # Also migrate annotated image if present
                    if record.annotated_image_path:
                        annotated_file = resolve_local_path(record.annotated_image_path)
                        if annotated_file:
                            ann_key = self.media_service.build_resolution_image_key(
                                report_id=report_id,
                                attempt_id=record.id,
                                image_type="annotated",
                                ext=annotated_file.suffix.lstrip(".").lower() or "webp",
                            )
                            self.media_service.upload_file(
                                local_path=annotated_file,
                                object_key=ann_key,
                                content_type="image/webp",
                            )
                            record.annotated_object_key = ann_key

                    self.db.commit()

                migrated += 1
            except Exception as e:
                self.db.rollback()
                failed += 1
                logger.error(f"Failed migrating ResolutionAttempt {record.id}: {e}")

        return {"examined": len(records), "migrated": migrated, "skipped": skipped, "failed": failed}

    def migrate_profile_photos(self) -> dict:
        query = (
            self.db.query(User)
            .filter(
                User.profile_image.isnot(None),
                User.profile_image != "",
                (User.profile_image_object_key.is_(None))
                | (User.profile_image_storage_provider == "local"),
            )
            .limit(self.batch_size)
        )
        records = query.all()
        migrated, skipped, failed = 0, 0, 0

        for user in records:
            try:
                local_file = resolve_local_path(user.profile_image)
                if not local_file:
                    skipped += 1
                    continue

                ext = local_file.suffix.lstrip(".").lower() or "webp"
                object_key = self.media_service.build_profile_image_key(user.id, ext=ext)

                if not self.dry_run:
                    self.media_service.upload_file(
                        local_path=local_file,
                        object_key=object_key,
                        content_type=f"image/{ext if ext != 'jpg' else 'jpeg'}",
                    )
                    user.profile_image_object_key = object_key
                    user.profile_image_storage_provider = self.media_service.provider_name
                    self.db.commit()

                migrated += 1
            except Exception as e:
                self.db.rollback()
                failed += 1
                logger.error(f"Failed migrating User {user.id} profile: {e}")

        return {"examined": len(records), "migrated": migrated, "skipped": skipped, "failed": failed}

    def migrate_system_issues(self) -> dict:
        query = (
            self.db.query(SystemIssueAttachment)
            .filter(
                (SystemIssueAttachment.object_key.is_(None))
                | (SystemIssueAttachment.storage_provider == "local")
            )
            .limit(self.batch_size)
        )
        records = query.all()
        migrated, skipped, failed = 0, 0, 0

        for record in records:
            try:
                local_file = resolve_local_path(record.file_path)
                if not local_file:
                    skipped += 1
                    continue

                sha256_hash = compute_sha256(local_file)
                ext = local_file.suffix.lstrip(".").lower() or "bin"
                object_key = self.media_service.build_system_issue_key(record.issue_id, ext=ext)

                if not self.dry_run:
                    self.media_service.upload_file(
                        local_path=local_file,
                        object_key=object_key,
                        content_type=record.mime_type or "application/octet-stream",
                    )
                    record.object_key = object_key
                    record.storage_provider = self.media_service.provider_name
                    record.sha256 = sha256_hash
                    self.db.commit()

                migrated += 1
            except Exception as e:
                self.db.rollback()
                failed += 1
                logger.error(f"Failed migrating SystemIssueAttachment {record.id}: {e}")

        return {"examined": len(records), "migrated": migrated, "skipped": skipped, "failed": failed}

    def migrate_public_updates(self) -> dict:
        query = (
            self.db.query(PublicUpdate)
            .filter(
                PublicUpdate.thumbnail_url.isnot(None),
                (PublicUpdate.thumbnail_object_key.is_(None))
                | (PublicUpdate.thumbnail_storage_provider == "local"),
            )
            .limit(self.batch_size)
        )
        records = query.all()
        migrated, skipped, failed = 0, 0, 0

        for record in records:
            try:
                # thumbnail_url is usually /api/v1/public/updates/images/{filename} or filename
                filename = Path(record.thumbnail_url).name
                local_file = resolve_local_path(f"public_updates/{filename}")
                if not local_file:
                    skipped += 1
                    continue

                object_key = f"{self.media_service.prefix}/public-updates/thumbnails/{filename}"
                if not self.dry_run:
                    self.media_service.upload_file(
                        local_path=local_file,
                        object_key=object_key,
                        content_type="image/webp",
                    )
                    record.thumbnail_object_key = object_key
                    record.thumbnail_storage_provider = self.media_service.provider_name
                    self.db.commit()

                migrated += 1
            except Exception as e:
                self.db.rollback()
                failed += 1
                logger.error(f"Failed migrating PublicUpdate {record.id} thumbnail: {e}")

        return {"examined": len(records), "migrated": migrated, "skipped": skipped, "failed": failed}

    def run_all(self) -> dict:
        r_reports = self.migrate_report_images()
        r_resolutions = self.migrate_resolution_attempts()
        r_profiles = self.migrate_profile_photos()
        r_issues = self.migrate_system_issues()
        r_updates = self.migrate_public_updates()

        total_examined = sum(x["examined"] for x in [r_reports, r_resolutions, r_profiles, r_issues, r_updates])
        total_migrated = sum(x["migrated"] for x in [r_reports, r_resolutions, r_profiles, r_issues, r_updates])
        total_skipped = sum(x["skipped"] for x in [r_reports, r_resolutions, r_profiles, r_issues, r_updates])
        total_failed = sum(x["failed"] for x in [r_reports, r_resolutions, r_profiles, r_issues, r_updates])

        return {
            "dry_run": self.dry_run,
            "provider": self.media_service.provider_name,
            "targets": {
                "report_images": r_reports,
                "resolution_attempts": r_resolutions,
                "profile_photos": r_profiles,
                "system_issues": r_issues,
                "public_updates": r_updates,
            },
            "total_examined": total_examined,
            "total_migrated": total_migrated,
            "total_skipped": total_skipped,
            "total_failed": total_failed,
        }


def parse_args():
    parser = argparse.ArgumentParser(
        description="CSCRS Production Historical Media Migration CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Simulate migration without uploading or updating database records.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Batch size per entity target.",
    )
    parser.add_argument(
        "--target",
        type=str,
        choices=["all", "reports", "resolutions", "profiles", "system_issues", "public_updates"],
        default="all",
        help="Entity target to migrate.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        default=False,
        help="Output results strictly formatted as JSON.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    db = SessionLocal()
    try:
        runner = MediaMigrationRunner(db, dry_run=args.dry_run, batch_size=args.batch_size)
        if args.target == "all":
            result = runner.run_all()
        elif args.target == "reports":
            res = runner.migrate_report_images()
            result = {"dry_run": args.dry_run, "targets": {"report_images": res}}
        elif args.target == "resolutions":
            res = runner.migrate_resolution_attempts()
            result = {"dry_run": args.dry_run, "targets": {"resolution_attempts": res}}
        elif args.target == "profiles":
            res = runner.migrate_profile_photos()
            result = {"dry_run": args.dry_run, "targets": {"profile_photos": res}}
        elif args.target == "system_issues":
            res = runner.migrate_system_issues()
            result = {"dry_run": args.dry_run, "targets": {"system_issues": res}}
        elif args.target == "public_updates":
            res = runner.migrate_public_updates()
            result = {"dry_run": args.dry_run, "targets": {"public_updates": res}}

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print("\n=== Media Migration Results ===")
            print(f"Dry Run: {args.dry_run}")
            print(f"Target: {args.target}")
            print(json.dumps(result, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
