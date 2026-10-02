import argparse
import json
import sys
from pathlib import Path

# Add backend directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from database.connection import SessionLocal
from services.data_retention_service import DataRetentionService
from utils.logger import get_logger

logger = get_logger("cscrs")


def parse_args():
    parser = argparse.ArgumentParser(
        description="CSCRS Production Data Retention Cleanup CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Simulate retention execution and report eligible records without modifying the database.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Batch size for iterative deletion (defaults to RETENTION_BATCH_SIZE in configs).",
    )
    parser.add_argument(
        "--target",
        type=str,
        choices=["all", "login_audits", "refresh_tokens", "notifications"],
        default="all",
        help="Specific operational table target to clean up.",
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
        service = DataRetentionService(db)

        if args.target == "all":
            result = service.run_all(
                dry_run=args.dry_run,
                batch_size=args.batch_size,
            )
        elif args.target == "login_audits":
            res = service.cleanup_login_audits(
                dry_run=args.dry_run,
                batch_size=args.batch_size,
            )
            result = {
                "dry_run": args.dry_run,
                "targets": {"login_audits": res},
                "total_examined": res.get("examined", 0),
                "total_deleted": res.get("deleted", 0),
                "overall_status": res.get("status", "failed"),
            }
        elif args.target == "refresh_tokens":
            res = service.cleanup_refresh_tokens(
                dry_run=args.dry_run,
                batch_size=args.batch_size,
            )
            result = {
                "dry_run": args.dry_run,
                "targets": {"refresh_tokens": res},
                "total_examined": res.get("examined", 0),
                "total_deleted": res.get("deleted", 0),
                "overall_status": res.get("status", "failed"),
            }
        elif args.target == "notifications":
            res = service.cleanup_in_app_notifications(
                dry_run=args.dry_run,
                batch_size=args.batch_size,
            )
            result = {
                "dry_run": args.dry_run,
                "targets": {"in_app_notifications": res},
                "total_examined": res.get("examined", 0),
                "total_deleted": res.get("deleted", 0),
                "overall_status": res.get("status", "failed"),
            }
        else:
            raise ValueError(f"Unknown target: {args.target}")

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            mode_label = "DRY-RUN (NO DELETIONS)" if args.dry_run else "LIVE EXECUTION"
            print("=" * 65)
            print(f"  CSCRS DATA RETENTION REPORT — {mode_label}")
            print("=" * 65)
            print(f"Overall Status: {result.get('overall_status', 'unknown').upper()}")
            print(f"Total Examined: {result.get('total_examined', 0):,}")
            print(f"Total Deleted:  {result.get('total_deleted', 0):,}")
            print("-" * 65)

            for target_name, target_info in result.get("targets", {}).items():
                print(f"[{target_name}]")
                print(f"  Status:   {target_info.get('status', 'unknown')}")
                print(f"  Examined: {target_info.get('examined', 0):,}")
                print(f"  Deleted:  {target_info.get('deleted', 0):,}")
                print(f"  Batches:  {target_info.get('batches', 0)}")
                print(f"  Duration: {target_info.get('duration_seconds', 0.0)}s")
                if "cutoff" in target_info:
                    print(f"  Cutoff:   {target_info['cutoff']}")
                if "read_cutoff" in target_info:
                    print(f"  Read Cutoff:       {target_info['read_cutoff']}")
                    print(f"  Max Unread Cutoff: {target_info['max_unread_cutoff']}")
                if "error" in target_info:
                    print(f"  Error:    {target_info['error']}")
                print("-" * 65)

        if result.get("overall_status") in ("failed", "partial_failure"):
            sys.exit(1)
        sys.exit(0)

    except Exception as exc:
        logger.exception("Data retention CLI failed: %s", exc)
        print(f"FATAL: Retention execution failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
