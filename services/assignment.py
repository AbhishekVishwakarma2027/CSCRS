from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from database.crud.assignment import AssignmentCRUD
from database.enums import (
    AssignmentStatus,
    ReportStatus,
)
from database.models.assignment import Assignment
from utils.gps import calculate_distance
from configs.config import START_WORK_RADIUS_METERS
from services.audit_log_service import AuditLogService
from services.in_app_notification_service import (
    InAppNotificationService,
)

class AssignmentService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def assign_worker(
        self,
        *,
        report_id: int,
        assigned_by: int,
        remarks: str | None = None,
        is_forward_assignment: bool = False,
    ):

        report = AssignmentCRUD.get_report(
            self.db,
            report_id,
        )

        if report is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found.",
            )
        existing_assignment = AssignmentCRUD.get_active_assignment_for_report(
            self.db,
            report.id,
        )

        if existing_assignment:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Report is already assigned.",
            )
        if report.status != ReportStatus.PENDING:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot assign report with status '{report.status.value}'.",
            )

        worker = self._select_best_worker(
            department_id=report.department_id,
        )

        profile = AssignmentCRUD.get_worker_profile(
            self.db,
            worker.id,
        )

        if profile is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker profile not found.",
            )

        assignment = Assignment(
            report_id=report.id,
            worker_id=worker.id,
            assigned_by=assigned_by,
            remarks=remarks,
            status=AssignmentStatus.ASSIGNED,
        )

        assignment = AssignmentCRUD.create(
            self.db,
            assignment,
        )

        AssignmentCRUD.update_report_status(
            self.db,
            report,
            ReportStatus.ASSIGNED,
        )

        action = (
            "FORWARDED_WORKER_ASSIGNED"
            if is_forward_assignment
            else "AUTO_ASSIGNED"
        )

        AuditLogService(self.db).log(
            report_id=report.id,
            user_id=assigned_by,
            action=action,
            details=f"Automatically assigned to worker #{worker.id}.",
        )

        self.db.commit()
        self.db.refresh(assignment)
        InAppNotificationService(self.db).create_notification(
            user_id=assignment.worker_id,
            report_id=assignment.report_id,
            title="New Assignment",
            message="You have been assigned a new civic issue.",
            notification_type="NEW_ASSIGNMENT",
        )


        return assignment

    def _select_best_worker(
        self,
        *,
        department_id: int,
    ):
        """
        Worker Selection Strategy

        Phase 10
        ----------
        Least Active Workload

        Future
        ----------
        - GPS Strategy
        - Hybrid Strategy
        - AI Scheduler
        """

        workers = AssignmentCRUD.get_available_workers(
            self.db,
            department_id,
        )

        if not workers:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No available workers found.",
            )

        best_worker = None
        lowest_workload = float("inf")

        for worker in workers:

            workload = AssignmentCRUD.get_active_assignment_count(
                self.db,
                worker.id,
            )

            if workload < lowest_workload:

                lowest_workload = workload
                best_worker = worker

        return best_worker
    
    def get_my_assignments(
        self,
        *,
        worker_id: int,
    ):

        assignments = AssignmentCRUD.get_worker_assignments(
            self.db,
            worker_id,
        )

        response = []

        for assignment in assignments:

            report = assignment.report

            image_url = None

            if report.images:

                image_url = ("/"+ report.images[0].image_path.replace("\\", "/"))

            google_maps_url = (
                f"https://www.google.com/maps?q="
                f"{report.latitude},{report.longitude}"
            )

            response.append(
                {
                    "assignment_id": assignment.id,
                    "report_id": report.id,
                    "issue_type": report.issue_type,
                    "description": report.description,
                    "priority": report.priority.value,
                    "status": assignment.status,
                    "address": report.address,
                    "latitude": report.latitude,
                    "longitude": report.longitude,
                    "google_maps_url": google_maps_url,
                    "image_url": image_url,
                    "assigned_at": assignment.assigned_at,
                    "work_started_at": assignment.work_started_at,
                }
            )
        return response
    
    def start_work(
        self,
        *,
        assignment_id: int,
        worker_id: int,
        latitude: float,
        longitude: float,
    ):

        assignment = AssignmentCRUD.get_assignment_by_id(
            self.db,
            assignment_id,
        )

        if assignment is None:

            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        if assignment.worker_id != worker_id:

            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this report.",
            )

        if assignment.status == AssignmentStatus.IN_PROGRESS:

            raise HTTPException(
                status_code=409,
                detail="Work already started.",
            )

        report = assignment.report

        distance = calculate_distance(
            latitude,
            longitude,
            report.latitude,
            report.longitude,
        )

        if distance > START_WORK_RADIUS_METERS:

            raise HTTPException(
                status_code=403,
                detail=(
                    f"You are not at the report location. "
                    f"Current distance: {distance:.2f} meters."
                ),
            )

        assignment.status = AssignmentStatus.IN_PROGRESS

        assignment.work_started_at = datetime.now(
            timezone.utc,
        )

        assignment.work_started_latitude = latitude

        assignment.work_started_longitude = longitude

        AssignmentCRUD.update_assignment(
            self.db,
            assignment,
        )

        AssignmentCRUD.update_report_status(
            self.db,
            assignment.report,
            ReportStatus.IN_PROGRESS,
        )

        AuditLogService(self.db).log(
            report_id=assignment.report.id,
            user_id=worker_id,
            action="WORK_STARTED",
            details=(
                f"Worker started work "
                f"at ({latitude:.6f}, {longitude:.6f})."
            ),
        )

        self.db.commit()

        self.db.refresh(assignment)

        InAppNotificationService(
            self.db,
        ).create_notification(
            user_id=assignment.report.citizen_id,
            report_id=assignment.report.id,
            title="Work Started",
            message="Repair work on your reported civic issue has started.",
            notification_type="WORK_STARTED",
        )

        return assignment