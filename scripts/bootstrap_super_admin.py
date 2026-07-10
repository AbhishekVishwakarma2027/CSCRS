import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from database.connection import SessionLocal
from database.crud.user import UserCRUD
from database.enums import UserRole

db = SessionLocal()

try:

    existing = UserCRUD.get_by_email(
        db,
        "admin@cscrs.local",
    )

    if existing:
        print("Super Admin already exists.")

    else:

        user = UserCRUD.create(
            db=db,
            name="System Owner",
            email="admin@cscrs.local",
            phone=None,
            password="Admin@123",
            role=UserRole.SUPER_ADMIN,
        )

        user.is_active = True
        user.is_email_verified = True

        db.commit()
        db.refresh(user)

        print("Super Admin created successfully.")

finally:

    db.close()