import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from database.connection import SessionLocal
from database.crud.user import UserCRUD
from database.enums import UserRole

admin_email = os.getenv("INITIAL_SUPER_ADMIN_EMAIL", "superadmin@gmail.com")
admin_password = os.getenv("INITIAL_SUPER_ADMIN_PASSWORD")

is_production = (
    os.getenv("OBJECT_STORAGE_PROVIDER", "").lower() == "oci"
    or "cscrs.tech" in os.getenv("APP_BASE_URL", "").lower()
    or os.getenv("ENVIRONMENT", "").lower() == "production"
)

if not admin_password:
    if is_production:
        print(
            "ERROR: INITIAL_SUPER_ADMIN_PASSWORD is required in production but not configured. "
            "Refusing to create privileged Super Admin account.",
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        # Development / testing fallback only
        print(
            "WARNING: INITIAL_SUPER_ADMIN_PASSWORD not set; using local development fallback.",
            file=sys.stderr,
        )
        admin_password = "Admin@123"

db = SessionLocal()

try:

    existing = UserCRUD.get_by_email(
        db,
        admin_email,
    )

    if existing:
        print("Super Admin already exists.")

    else:

        user = UserCRUD.create(
            db=db,
            name="System Owner",
            email=admin_email,
            phone=None,
            password=admin_password,
            role=UserRole.SUPER_ADMIN,
        )

        user.is_active = True
        user.is_email_verified = True

        db.commit()
        db.refresh(user)

        print("Super Admin created successfully.")

finally:

    db.close()