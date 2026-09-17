from sqlalchemy.orm import Session
from fastapi import (HTTPException,status,)

from database.crud import (report as report_crud,)

from database.crud.department_forward_request import (DepartmentForwardRequestCRUD,)
from database.crud.assignment import AssignmentCRUD
from database.enums import (ForwardRequestStatus,AssignmentStatus,ReportStatus)

from services.audit_log_service import (AuditLogService,)
from datetime import datetime,timezone

from types import SimpleNamespace
from services.assignment import AssignmentService
from services.in_app_notification_service import InAppNotificationService
from services.report_service import (
    ReportService,
)
from database.crud.user import UserCRUD
from database.crud.worker import WorkerCRUD


class ForwardRequestService:

    def __init__(
        self,
        db: Session,
    ):

        self.db = db
    def create_request(
        self,
        report_id: int,
        worker,
        request,
    ):

        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )

        assignment = AssignmentCRUD.get_active_assignment_for_report(
            self.db,
            report.id,
        )

        if (
            assignment is None
            or assignment.worker_id != worker.id
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can flag only reports assigned to you."
                ),
            )

        if report is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found.",
            )

        pending_request = (
            DepartmentForwardRequestCRUD.get_pending_request_for_report(
                self.db,
                report_id,
            )
        )

        if pending_request is not None:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A forward request is already pending.",
            )

        forward_request = (
            DepartmentForwardRequestCRUD.create(
                self.db,
                report_id=report.id,
                worker_id=worker.id,
                current_department_id=report.department_id,
                reason=request.reason,
                status=ForwardRequestStatus.PENDING,
            )
        )

        AuditLogService(
            self.db,
        ).log(
            report_id=report.id,
            user_id=worker.id,
            action="FORWARD_REQUEST_CREATED",
            details="Worker flagged report for department review.",
        )

        dept_admins = UserCRUD.get_department_admins(
            self.db,
            report.department_id,
        )

        for admin in dept_admins:
            InAppNotificationService(
                self.db,
            ).create_notification(
                user_id=admin.id,
                report_id=report.id,
                title="New Forward Request",
                message=(
                    f"Worker {worker.name} requested to forward report #{report.report_number}.\n\n"
                    f"Reason: {request.reason}"
                ),
                notification_type="FORWARD_REQUEST",
            )

        self.db.commit()

        self.db.refresh(
            forward_request,
        )

        return forward_request

    def _enrich_requests(self, requests):
        if not requests:
            return []

        dept_ids = {r.current_department_id for r in requests if r.current_department_id}.union(
            {r.destination_department_id for r in requests if r.destination_department_id}
        )
        user_ids = {r.worker_id for r in requests if r.worker_id}.union(
            {r.reviewed_by for r in requests if r.reviewed_by}
        )

        from database.models.department import Department
        from database.models.user import User

        depts = {d.id: d.name for d in self.db.query(Department).filter(Department.id.in_(dept_ids)).all()} if dept_ids else {}
        users = {u.id: u.name for u in self.db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

        results = []
        for req in requests:
            res = {
                "id": req.id,
                "report_id": req.report_id,
                "worker_id": req.worker_id,
                "worker_name": users.get(req.worker_id),
                "current_department_id": req.current_department_id,
                "destination_department_id": req.destination_department_id,
                "source_department_name": depts.get(req.current_department_id),
                "destination_department_name": depts.get(req.destination_department_id),
                "reason": req.reason,
                "status": req.status,
                "decision_reason": req.decision_reason,
                "reviewed_at": req.reviewed_at,
                "reviewed_by": req.reviewed_by,
                "reviewer_name": users.get(req.reviewed_by),
                "created_at": req.created_at,
            }
            results.append(res)
        return results

    def get_pending_requests(
        self,
        department_admin,
        include_history: bool = True,
    ):
        requests = (
            DepartmentForwardRequestCRUD
            .get_department_pending_requests(
                self.db,
                department_admin.department_id,
                include_history=include_history,
            )
        )
        return self._enrich_requests(requests)

    def get_rejected_requests(
        self,
        department_admin,
    ):
        requests = (
            DepartmentForwardRequestCRUD
            .get_department_rejected_requests(
                self.db,
                department_admin.department_id,
            )
        )
        return self._enrich_requests(requests)

    def get_request_details(
        self,
        request_id: int,
        department_admin,
    ):

        data = (
            DepartmentForwardRequestCRUD
            .get_request_details(
                self.db,
                request_id,
            )
        )

        if data is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Forward request not found.",
            )

        forward_request, report, worker, source_department, destination_department, reviewer_user = data

        if (
            forward_request.current_department_id
            != department_admin.department_id
            and
            forward_request.destination_department_id
            != department_admin.department_id
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied.",
            )

        from database.crud.report_image import (
            get_original_image,
            get_annotated_image,
        )

        original_image = get_original_image(
            self.db,
            report.id,
        )

        annotated_image = get_annotated_image(
            self.db,
            report.id,
        )

        return {

            "request_id": forward_request.id,

            "status": forward_request.status,

            "reason": forward_request.reason,

            "decision_reason": forward_request.decision_reason,

            "reviewed_at": forward_request.reviewed_at,

            "reviewed_by": forward_request.reviewed_by,

            "reviewer_name": reviewer_user.name if reviewer_user else None,

            "created_at": forward_request.created_at,

            "worker": {

                "id": worker.id,

                "name": worker.name,

                "email": worker.email,

                "phone": worker.phone,
            },

            "report": {

                "id": report.id,

                "report_number": report.report_number,

                "issue_type": report.issue_type,

                "priority": report.priority,

                "status": report.status,

                "latitude": report.latitude,

                "longitude": report.longitude,

                "address": report.address,

                "support_count": report.support_count,

                "risk_score": report.risk_score,

                "ai_confidence": report.ai_confidence,

                "verification_decision": (
                    report.verification_decision
                ),

                "verification_passed": (
                    report.verification_passed
                ),
            },

            "departments": {

                "source_department": {

                    "id": source_department.id,

                    "name": source_department.name,
                },

                "destination_department": (
                    {

                    "id": destination_department.id,

                    "name": destination_department.name,
                }
                if destination_department is not None
                else None
                ),
            },

            "images": {

                "original_image": (
                    original_image.image_path
                    if original_image
                    else None
                ),

                "annotated_image": (
                    annotated_image.image_path
                    if annotated_image
                    else None
                ),

                "resolution_image": None,
            },

            "timeline": [],
        }
    
    def approve_request(
        self,
        request_id: int,
        department_admin,
        request,
    ):
        forward_request = (
            DepartmentForwardRequestCRUD.get_by_id(
                self.db,
                request_id,
            )
        )

        if forward_request is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Forward request not found.",
            )

        if (
            forward_request.current_department_id
            != department_admin.department_id
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied.",
            )

        if (
            forward_request.status
            != ForwardRequestStatus.PENDING
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Forward request already processed.",
            )
        forward_request_data = SimpleNamespace(

            department_id=request.department_id,

            reason_type=request.reason_type,

            remarks=request.remarks,
        )
        ReportService(
            self.db,
        ).forward_report(
            report_id=forward_request.report_id,
            department_admin=department_admin,
            request=forward_request_data,
        )
        forward_request.status = (
            ForwardRequestStatus.WAITING_DESTINATION
        )

        forward_request.destination_department_id = (
            request.department_id
        )

        forward_request.reviewed_by = (
            department_admin.id
        )

        forward_request.reviewed_at = (
            datetime.now(timezone.utc)
        )
        forward_request.decision_reason = (
            request.remarks
        )
        DepartmentForwardRequestCRUD.update_status(
            self.db,
            forward_request,
        )
        self.db.commit()

        self.db.refresh(
            forward_request,
        )

    def get_destination_requests(
        self,
        department_admin,
        include_history: bool = True,
    ):
        requests = (
            DepartmentForwardRequestCRUD
            .get_destination_pending_requests(
                self.db,
                department_admin.department_id,
                include_history=include_history,
            )
        )
        return self._enrich_requests(requests)
    def accept_request(
        self,
        request_id: int,
        department_admin,
    ):
        forward_request = (
            DepartmentForwardRequestCRUD.get_by_id(
                self.db,
                request_id,
            )
        )

        if forward_request is None:

            raise HTTPException(
                status_code=404,
                detail="Forward request not found.",
            )
        if (
            forward_request.destination_department_id
            != department_admin.department_id
        ):

            raise HTTPException(
                status_code=403,
                detail="Access denied.",
            )

        if (
            forward_request.status
            != ForwardRequestStatus.WAITING_DESTINATION
        ):

            raise HTTPException(
                status_code=400,
                detail="Forward request is not waiting for destination approval.",
            )
        report = report_crud.get_report_by_id(
            self.db,
            forward_request.report_id,
        )
        if report is None:

            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )
        
        report_crud.update_report_department(
            self.db,
            report,
            forward_request.destination_department_id,
        )

        report_crud.increment_forward_count(
            self.db,
            report,
        )
        forward_request.status = (
            ForwardRequestStatus.ACCEPTED
        )

        forward_request.reviewed_by = (
            department_admin.id
        )

        forward_request.reviewed_at = (
            datetime.now(timezone.utc)
        )

        DepartmentForwardRequestCRUD.save(
            self.db,
            forward_request,
        )
        AuditLogService(
            self.db,
        ).log(
            report_id=report.id,
            user_id=department_admin.id,
            action="REPORT_ACCEPTED_BY_DESTINATION",
            details=(
                "Destination department accepted the report "
                "and assignment will be created."
            ),
        )
        AssignmentService(
            self.db,
        ).assign_worker(
            report_id=report.id,
            assigned_by=department_admin.id,
            remarks="Assigned after destination department accepted forwarding.",
            is_forward_assignment=True,
        )
        AuditLogService(
            self.db,
        ).log(
            report_id=report.id,
            user_id=department_admin.id,
            action="FORWARD_ACCEPTED",
            details="Destination department accepted forwarded report.",
        )
        InAppNotificationService(
            self.db,
        ).create_notification(
            user_id=report.citizen_id,
            report_id=report.id,
            title="Report Forward Accepted",
            message=(
                "Your report has been accepted by the "
                "concerned department and assigned "
                "for resolution."
            ),
            notification_type="FORWARD_ACCEPTED",
        )
        source_admins = UserCRUD.get_department_admins(
            self.db,
            forward_request.current_department_id,
        )

        for admin in source_admins:

            InAppNotificationService(
                self.db,
            ).create_notification(
                user_id=admin.id,
                report_id=report.id,
                title="Forward Request Accepted",
                message=(
                    "The destination department accepted "
                    "your forwarded report."
                ),
                notification_type="FORWARD_ACCEPTED",
            )
        self.db.commit()

        self.db.refresh(
            forward_request,
        )

        return forward_request
    
    def decline_request(
        self,
        request_id: int,
        department_admin,
        reason: str,
    ):

        forward_request = (
            DepartmentForwardRequestCRUD.get_by_id(
                self.db,
                request_id,
            )
        )

        if forward_request is None:

            raise HTTPException(
                status_code=404,
                detail="Forward request not found.",
            )

        if (
            forward_request.destination_department_id
            != department_admin.department_id
        ):

            raise HTTPException(
                status_code=403,
                detail="Access denied.",
            )

        if (
            forward_request.status
            != ForwardRequestStatus.WAITING_DESTINATION
        ):

            raise HTTPException(
                status_code=400,
                detail="Forward request has already been processed.",
            )

        report = report_crud.get_report_by_id(
            self.db,
            forward_request.report_id,
        )

        if report is None:

            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )

        forward_request.status = (
            ForwardRequestStatus.REJECTED
        )

        forward_request.reviewed_by = (
            department_admin.id
        )

        forward_request.reviewed_at = (
            datetime.now(timezone.utc)
        )

        forward_request.decision_reason = reason

        DepartmentForwardRequestCRUD.save(
            self.db,
            forward_request,
        )

        AuditLogService(
            self.db,
        ).log(
            report_id=report.id,
            user_id=department_admin.id,
            action="FORWARD_DECLINED",
            details=(
                f"Destination department declined forwarding. "
                f"Reason: {reason}"
            ),
        )
        InAppNotificationService(
            self.db,).create_notification(
            user_id=report.citizen_id,
            report_id=report.id,
            title="Forward Request Declined",
            message=(
                "The destination department declined "
                "the forwarded report. "
                "The source department will review it again."
            ),
            notification_type="FORWARD_DECLINED",
        )
        # Notify Source Department Admin(s)
        source_admins = UserCRUD.get_department_admins(
            self.db,
            forward_request.current_department_id,
        )

        for admin in source_admins:

            InAppNotificationService(
                self.db,
            ).create_notification(
                user_id=admin.id,
                report_id=report.id,
                title="Forward Request Declined",
                message=(
                    "The destination department declined "
                    "your forwarded report. "
                    "Please review and take further action."
                ),
                notification_type="FORWARD_DECLINED",
            )
        # Restore previous assignment
        assignment = AssignmentCRUD.get_assignment_by_report(
            self.db,
            report.id,
        )

        if assignment is not None:

            AssignmentCRUD.update_assignment_status(
                self.db,
                assignment,
                AssignmentStatus.ASSIGNED,
            )

            worker_profile = WorkerCRUD.get_worker_profile(
                self.db,
                assignment.worker_id,
            )

            if worker_profile is not None:

                worker_profile.is_available = False

                WorkerCRUD.save_worker_profile(
                    self.db,
                    worker_profile,
                )

            InAppNotificationService(
                self.db,
            ).create_notification(
                user_id=assignment.worker_id,
                report_id=report.id,
                title="Report Reassigned",
                message=(
                    "The destination department declined "
                    "the forwarding request. "
                    "The report has been assigned back to you."
                ),
                notification_type="REPORT_REASSIGNED",
            )

            report.status = ReportStatus.ASSIGNED
        AuditLogService(
            self.db,
        ).log(
            report_id=report.id,
            user_id=department_admin.id,
            action="REPORT_RETURNED_TO_SOURCE",
            details=(
                "Report returned to source department "
                "after destination department declined."
            ),
        )
        self.db.commit()

        self.db.refresh(
            forward_request,
        )

        return forward_request

    def reject_request(
        self,
        request_id: int,
        department_admin,
        reason: str,
    ):

        forward_request = (
            DepartmentForwardRequestCRUD.get_by_id(
                self.db,
                request_id,
            )
        )

        if forward_request is None:

            raise HTTPException(
                status_code=404,
                detail="Forward request not found.",
            )

        if (
            forward_request.current_department_id
            != department_admin.department_id
        ):

            raise HTTPException(
                status_code=403,
                detail="Access denied.",
            )

        if (
            forward_request.status
            != ForwardRequestStatus.PENDING
        ):

            raise HTTPException(
                status_code=400,
                detail="Forward request already processed.",
            )

        report = report_crud.get_report_by_id(
            self.db,
            forward_request.report_id,
        )

        if report is None:

            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )

        forward_request.status = (
            ForwardRequestStatus.REJECTED
        )

        forward_request.reviewed_by = (
            department_admin.id
        )

        forward_request.reviewed_at = (
            datetime.now(timezone.utc)
        )

        forward_request.decision_reason = (
            reason
        )

        DepartmentForwardRequestCRUD.save(
            self.db,
            forward_request,
        )

        report.status = ReportStatus.ASSIGNED

        assignment = (
            AssignmentCRUD.get_assignment_by_report(
                self.db,
                report.id,
            )
        )

        if assignment is not None:

            AssignmentCRUD.update_assignment_status(
                self.db,
                assignment,
                AssignmentStatus.ASSIGNED,
            )

        worker_profile = (
            WorkerCRUD.get_worker_profile(
                self.db,
                forward_request.worker_id,
            )
        )

        if worker_profile is not None:

            worker_profile.is_available = False

            WorkerCRUD.save_worker_profile(
                self.db,
                worker_profile,
            )

        AuditLogService(
            self.db,
        ).log(
            report_id=report.id,
            user_id=department_admin.id,
            action="FORWARD_REQUEST_REJECTED",
            details=reason,
        )

        InAppNotificationService(
            self.db,
        ).create_notification(
            user_id=forward_request.worker_id,
            report_id=report.id,
            title="Forward Request Rejected",
            message=(
                "Your forwarding request was rejected. "
                "The report has been assigned back to you."
            ),
            notification_type="FORWARD_REJECTED",
        )

        self.db.commit()

        self.db.refresh(
            forward_request,
        )

        return forward_request