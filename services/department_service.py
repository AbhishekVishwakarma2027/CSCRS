from sqlalchemy.orm import Session

from configs.department_mapping import DEPARTMENT_MAPPING
from database.crud.department import get_department_by_name
from database.crud.department import DepartmentCRUD
from database.models.department import Department


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
    def create_department(
        self,
        data,
    ):

        existing = get_department_by_name(
            self.db,
            data.name,
        )

        if existing:

            raise ValueError(
                "Department already exists."
            )

        department = Department(
            name=data.name.strip(),
            description=data.description,
        )

        DepartmentCRUD.create(
            self.db,
            department,
        )

        self.db.commit()

        self.db.refresh(department)

        return department
    def get_departments(
        self,
    ):

        return DepartmentCRUD.get_all(
            self.db,
        )
    def get_department(
        self,
        department_id: int,
    ):

        department = DepartmentCRUD.get_by_id(
            self.db,
            department_id,
        )

        if department is None:

            raise ValueError(
                "Department not found."
            )

        return department
    def activate_department(
        self,
        department_id: int,
    ):

        department = DepartmentCRUD.get_by_id(
            self.db,
            department_id,
        )

        if department is None:

            raise ValueError(
                "Department not found."
            )

        DepartmentCRUD.activate(
            self.db,
            department,
        )

        self.db.commit()

        return {
            "message": "Department activated successfully."
        }
    def deactivate_department(
        self,
        department_id: int,
    ):

        department = DepartmentCRUD.get_by_id(
            self.db,
            department_id,
        )

        if department is None:

            raise ValueError(
                "Department not found."
            )

        DepartmentCRUD.deactivate(
            self.db,
            department,
        )

        self.db.commit()

        return {
            "message": "Department deactivated successfully."
        }