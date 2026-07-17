from sqlalchemy.orm import Session

from database.crud import report as report_crud
from database.crud import report_image as report_image_crud

from schemas.report import ReportCreateInternal

from utils.report_number import generate_report_number
from database.crud import report_detection as report_detection_crud
from database.enums import ImageType
from services.duplicate_detection_service import DuplicateDetectionService
from services.report_support_service import ReportSupportService
from services.priority_engine import PriorityEngine
from services.audit_log_service import AuditLogService
from fastapi import HTTPException, status

from database.enums import (
    ReportStatus,
    UserRole,
    ForwardRequestStatus,
    AssignmentStatus,
)

from database.crud.report_forward_history import (
    ReportForwardHistoryCRUD,
)
from database.crud import assignment as assignment_crud
from database.crud.assignment import AssignmentCRUD

from database.crud.worker import WorkerCRUD

from database.enums import AssignmentStatus
from database.crud import worker as worker_crud

from schemas.report import (
    ReportCreateRequest,
    ReportForwardRequest,
    ReportCancellationRequest,
    ReportReopenRequest,
)
from services.in_app_notification_service import (
    InAppNotificationService,
)
from services.assignment import AssignmentService
from database.crud.department_forward_request import (
    DepartmentForwardRequestCRUD,
)
from database.crud.user import UserCRUD


class ReportService:

    def __init__(self, db: Session):
        self.db = db
        self.notification = InAppNotificationService(db)
        self.audit_log = AuditLogService(db)

    def create_report(
        self,
        report_data: ReportCreateInternal,
    ):
        report_number = generate_report_number()

        report = report_crud.create_report(
            self.db,
            report_data,
            report_number,
        )

        report.priority = PriorityEngine.calculate(
            risk_score=report.risk_score,
            support_count=report.support_count,
        )

        report = report_crud.update_report(
            self.db,
            report,
        )
        AuditLogService(self.db).log(
            report_id=report.id,
            user_id=report.citizen_id,
            action="REPORT_CREATED",
            details="Citizen report created.",
        )
        return report

    def save_image(
        self,
        report_id: int,
        original_filename: str,
        stored_filename: str,
        image_path: str,
        mime_type: str,
        file_size: int,
        image_type=ImageType.ORIGINAL,
    ):
        return report_image_crud.create_report_image(
            self.db,
            report_id,
            original_filename,
            stored_filename,
            image_path,
            mime_type,
            file_size,
            image_type,
        )
    def save_detections(
        self,
        report_id: int,
        detections: list,
        model_version: str,
        inference_time_ms: int,
    ):
        return report_detection_crud.create_many_detections(
            db=self.db,
            report_id=report_id,
            detections=detections,
            model_version=model_version,
            inference_time_ms=inference_time_ms,
        )
    def get_original_image(
        self,
        report_id: int,
    ):

        return report_image_crud.get_original_image(
            self.db,
            report_id,
        )
    
    def get_latest_resolution_image(
        self,
        report_id: int,
    ):
        return report_image_crud.get_latest_resolution_image(
            self.db,
            report_id,
        )


    def delete_image(
        self,
        image,
    ):
        report_image_crud.delete_image(
            self.db,
            image,
        )
    def get_my_reports(
        self,
        citizen_id: int,
    ):

        return report_crud.get_reports_by_citizen(
            self.db,
            citizen_id,
        )
    def get_my_report(
        self,
        citizen_id: int,
        report_number: str,
    ):

        report = report_crud.get_citizen_report_by_number(
            self.db,
            citizen_id,
            report_number,
        )

        if report is None:

            raise ValueError(
                "Report not found."
            )

        return report
    def get_department_reports(
        self,
        department_id: int,
        status=None,
        priority=None,
        issue_type=None,
    ):

        return report_crud.get_department_reports_filtered(
            self.db,
            department_id,
            status,
            priority,
            issue_type,
        )
    def get_all_reports(
        self,
        department_id=None,
        status=None,
        priority=None,
        issue_type=None,
    ):

        return report_crud.get_all_reports_filtered(
            self.db,
            department_id,
            status,
            priority,
            issue_type,
        )
    def search_reports(
        self,
        query: str,
    ):

        return report_crud.search_reports(
            self.db,
            query,
        )
    def search_department_reports(
        self,
        department_id: int,
        query: str,
    ):

        return report_crud.search_department_reports(
            self.db,
            department_id,
            query,
        )
    def search_my_reports(
        self,
        citizen_id: int,
        query: str,
    ):

        return report_crud.search_citizen_reports(
            self.db,
            citizen_id,
            query,
        )
    def get_all_reports_paginated(
        self,
        page: int,
        page_size: int,
        department_id=None,
        status=None,
        priority=None,
        issue_type=None,
    ):

        items, total_items, total_pages = (
            report_crud.get_all_reports_paginated(
                self.db,
                page,
                page_size,
                department_id,
                status,
                priority,
                issue_type,
            )
        )

        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1,
            },
        }
    def forward_report(
        self,
        report_id: int,
        department_admin,
        request,
    ):
        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )

        if report is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found.",
            )
        
        if department_admin.role != UserRole.DEPARTMENT_ADMIN:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Department Admin can forward reports.",
            )
        if report.department_id != department_admin.department_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can forward only reports "
                    "belonging to your department."
                ),
            )
        
        if report.status not in [

            ReportStatus.PENDING,

            ReportStatus.ASSIGNED,

            ReportStatus.IN_PROGRESS,

        ]:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This report cannot be forwarded.",
            )
        
        if report.department_id is None:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report is not assigned to any department.",
            )
        
        if report.department_id == request.department_id:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report already belongs to this department.",
            )
        
        if department_admin.department_id == request.department_id:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot forward to your own department.",
            )

        old_department_id = report.department_id

        assignment = AssignmentCRUD.get_active_assignment_for_report(
            self.db,
            report.id,
        )
        if assignment is not None:

            AssignmentCRUD.update_assignment_status(
                self.db,
                assignment,
                AssignmentStatus.CANCELLED,
            )
            worker_profile = WorkerCRUD.get_worker_profile(
                self.db,
                assignment.worker_id,
            )

            if worker_profile is not None:

                worker_profile.is_available = True

                WorkerCRUD.save_worker_profile(
                    self.db,
                    worker_profile,
                )
            self.notification.create_notification(
                user_id=assignment.worker_id,
                report_id=report.id,
                title="Assignment Cancelled",
                message=(
                    "Your assignment has been cancelled because "
                    "the report has been forwarded to another department."
                ),
                notification_type="ASSIGNMENT_CANCELLED",
            )
        forward_number = (
            ReportForwardHistoryCRUD.get_next_forward_number(
                self.db,
                report.id,
            )
        )
        ReportForwardHistoryCRUD.create(
            self.db,

            report_id=report.id,

            forward_number=forward_number,

            from_department_id=old_department_id,

            to_department_id=request.department_id,

            forwarded_by=department_admin.id,

            issue_type=report.issue_type,

            reason_type=request.reason_type,

            remarks=request.remarks,
        )
        report.status = ReportStatus.PENDING

        # Ownership transfer will happen only after
        # destination department accepts the request.
        # ---------------------------------------------------------
        # IMPORTANT
        #
        # Ownership is NOT transferred here.
        #
        # Department change and forward counter will be updated
        # only after the destination department accepts the request.
        # ---------------------------------------------------------
        # report_crud.increment_forward_count(
        #     self.db,
        #     report,
        # )# this block can be remove
        self.audit_log.log(
            report_id=report.id,
            user_id=department_admin.id,
            action="FORWARD_SENT_TO_DESTINATION",
            details=(
                f"Forward request sent from department "
                f"{old_department_id} "
                f"to department "
                f"{request.department_id}."
            ),
        )
        self.audit_log.log(
            report_id=report.id,
            user_id=department_admin.id,
            action="REPORT_FORWARDED_TO_DEPARTMENT",
            details=(
                f"Your report has been forwarded to "
                f"Department ID {request.department_id} "
                f"for review."
            ),
        )
        InAppNotificationService(
            self.db,
        ).create_notification(
            user_id=department_admin.id,
            report_id=report.id,
            title="Forward Request Sent",
            message=(
                "The forwarding request has been "
                "sent to the destination department "
                "for review."
            ),
            notification_type="FORWARD_SENT",
        )
        destination_admins = (
            UserCRUD.get_department_admins(
                self.db,
                request.department_id,
            )
        )

        for admin in destination_admins:

            InAppNotificationService(
                self.db,
            ).create_notification(
                user_id=admin.id,
                report_id=report.id,
                title="Incoming Forward Request",
                message=(
                    "A report has been forwarded "
                    "to your department for review."
                ),
                notification_type="FORWARD_REQUEST",
            )
        InAppNotificationService(
            self.db,
        ).create_notification(
            user_id=assignment.worker_id,
            report_id=report.id,
            title="Forward Request Approved",
            message=(
                "Your forwarding request has been approved "
                "and sent to the destination department."
            ),
            notification_type="FORWARD_APPROVED",
        )
        # Assignment will be created after
        # destination department accepts.
        # TODO:
        # Assignment will be moved after
        # Destination Department accepts
        # the forwarded report.

        forward_request = (
            DepartmentForwardRequestCRUD
            .get_pending_request_for_report(
                self.db,
                report.id,
            )
        )

        if forward_request is not None:

            forward_request.destination_department_id = (
                request.department_id
            )

            forward_request.status = (
                ForwardRequestStatus.WAITING_DESTINATION
            )

            DepartmentForwardRequestCRUD.save(
                self.db,
                forward_request,
            )
        
        return report
    def cancel_report(
        self,
        report_id: int,
        department_admin,
        request: ReportCancellationRequest,
    ):
        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )

        if report is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found.",
            )

        if department_admin.role != UserRole.DEPARTMENT_ADMIN:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Department Admin can cancel reports.",
            )

        if report.department_id != department_admin.department_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can cancel only reports "
                    "belonging to your department."
                ),
            )
        if report.status == ReportStatus.CANCELLED:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report has already been cancelled.",
            )

        if report.status not in [

            ReportStatus.PENDING,

            ReportStatus.ASSIGNED,

            ReportStatus.IN_PROGRESS,

        ]:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This report cannot be cancelled.",
            )

        assignment = (
            AssignmentCRUD.get_active_assignment_for_report(
                self.db,
                report.id,
            )
        )

        report.status = ReportStatus.CANCELLED
        self.db.add(report)
        
        if assignment is not None:

            AssignmentCRUD.update_assignment_status(
                self.db,
                assignment,
                AssignmentStatus.CANCELLED,
            )
            assignment.remarks = (
                "Cancelled by Department Admin"
                f" | Reason: {request.reason_type.value}"
                + (
                    f" | Remarks: {request.remarks}"
                    if request.remarks
                    else ""
                )
            )

            AssignmentCRUD.save_assignment(
                self.db,
                assignment,
            )
            worker_profile = WorkerCRUD.get_worker_profile(
                self.db,
                assignment.worker_id,
            )

            if worker_profile is not None:

                worker_profile.is_available = True

                WorkerCRUD.save_worker_profile(
                    self.db,
                    worker_profile,
                )

        if assignment is not None:

            self.notification.create_notification(
                user_id=assignment.worker_id,
                report_id=report.id,
                title="Assignment Cancelled",
                message=(
                    "Your assignment has been cancelled by "
                    "Department Admin.\n\n"
                    f"Reason: {request.reason_type.value}"
                    + (
                        f"\nRemarks: {request.remarks}"
                        if request.remarks
                        else ""
                    )
                ),
                notification_type="ASSIGNMENT_CANCELLED",
            )

        self.notification.create_notification(
            user_id=report.citizen_id,
            report_id=report.id,
            title="Report Cancelled",
            message=(
                "Your report has been cancelled after "
                "administrative review.\n\n"
                f"Reason: {request.reason_type.value}"
                + (
                    f"\nRemarks: {request.remarks}"
                    if request.remarks
                    else ""
                )
            ),
            notification_type="REPORT_CANCELLED",
        )

        self.audit_log.log(
            report_id=report.id,
            user_id=department_admin.id,
            action="REPORT_CANCELLED_BY_DEPARTMENT",
            details=(
                f"Reason: {request.reason_type.value}"
                + (
                    f", Remarks: {request.remarks}"
                    if request.remarks
                    else ""
                )
            ),
        )

        self.db.commit()

        return {
            "success": True,
            "message": "Report cancelled successfully.",
            "report_id": report.id,
            "report_number": report.report_number,
            "status": report.status.value,
            "reason": request.reason_type.value,
        }
    def reopen_report(
        self,
        report_id: int,
        department_admin,
        request: ReportReopenRequest,
    ):

        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )

        if report is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found.",
            )

        if department_admin.role != UserRole.DEPARTMENT_ADMIN:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Department Admin can reopen reports.",
            )

        if report.department_id != department_admin.department_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can reopen only reports "
                    "belonging to your department."
                ),
            )

        if report.status != ReportStatus.CANCELLED:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only cancelled reports can be reopened.",
            )

        report.status = ReportStatus.PENDING

        self.db.add(report)

        self.audit_log.log(
            report_id=report.id,
            user_id=department_admin.id,
            action="REPORT_REOPENED",
            details=(
                "Report reopened by Department Admin."
                + (
                    f" Reason: {request.reason}"
                    if request.reason
                    else ""
                )
            ),
        )

        self.notification.create_notification(
            user_id=report.citizen_id,
            report_id=report.id,
            title="Report Reopened",
            message=(
                "Your report has been reopened "
                "after administrative review."
                + (
                    f"\n\nReason: {request.reason}"
                    if request.reason
                    else ""
                )
            ),
            notification_type="REPORT_REOPENED",
        )

        AssignmentService(
            self.db,
        ).assign_worker(
            report_id=report.id,
            assigned_by=department_admin.id,
            remarks="Automatic assignment after report reopening."

        )

        return {
            "success": True,
            "message": "Report reopened successfully.",
            "report_id": report.id,
            "report_number": report.report_number,
            "status": report.status.value,
        }