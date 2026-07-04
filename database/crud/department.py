from sqlalchemy.orm import Session

from database.models.department import Department


def get_department_by_name(
    db: Session,
    name: str,
):
    return (
        db.query(Department)
        .filter(Department.name == name)
        .first()
    )