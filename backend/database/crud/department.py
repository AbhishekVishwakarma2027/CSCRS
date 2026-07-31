from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models.department import Department


def get_department_by_name(
    db: Session,
    name: str,
):
    return (
        db.query(Department)
        .filter(func.lower(Department.name) == name.lower())
        .first()
    )
class DepartmentCRUD:

    @staticmethod
    def create(
        db: Session,
        department: Department,
    ) -> Department:

        db.add(department)

        db.flush()

        return department
    @staticmethod
    def get_all(
        db: Session,
    ):

        return (
            db.query(Department)
            .order_by(Department.id)
            .all()
        )
    @staticmethod
    def get_by_id(
        db: Session,
        department_id: int,
    ):

        return (
            db.query(Department)
            .filter(
                Department.id == department_id
            )
            .first()
        )
    @staticmethod
    def save(
        db: Session,
        department: Department,
    ):

        db.flush()

        return department
    @staticmethod
    def activate(
        db: Session,
        department: Department,
    ):

        department.is_active = True

        db.flush()

        return department
    @staticmethod
    def deactivate(
        db: Session,
        department: Department,
    ):

        department.is_active = False

        db.flush()

        return department