from sqlalchemy.orm import Session

from configs.department_mapping import DEPARTMENT_MAPPING
from database.crud.department import get_department_by_name


class DepartmentService:

    def __init__(self, db: Session):
        self.db = db

    def resolve(self, issue_type: str):

        department_name = DEPARTMENT_MAPPING.get(issue_type)

        if department_name is None:
            raise ValueError(
                f"No department mapping for '{issue_type}'"
            )

        department = get_department_by_name(
            self.db,
            department_name,
        )

        if department is None:
            raise ValueError(
                f"Department '{department_name}' not found."
            )

        return department