from sqlalchemy.orm import Session


class ReportService:

    def __init__(self, db: Session):
        self.db = db