from pathlib import Path
import shutil
import asyncio
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from storage import get_media_service
from utils.file_utils import safe_delete_file

from authentication.dependencies import (
    require_citizen,
    require_department_admin,
    require_city_admin,
    require_admin_reports,
    get_current_user,
)

from database.dependencies import get_db
from database.models.user import User
from database.enums import ImageType

from inference.engine import InferenceEngine

from services.department_service import DepartmentService
from services.report_builder import ReportBuilder
from services.report_service import ReportService
from services.assignment import AssignmentService

from schemas.report import (
    CitizenReportListItem,
    DepartmentReportListItem,
    CityReportListItem,
    ReportResponse,
    ReportForwardRequest,
    ReportCancellationRequest,
    ReportReopenRequest,
    AdminReportDetailsResponse,
)
from schemas.report import PaginatedCityReports
from utils.file_utils import (
    generate_filename,
    validate_uploaded_file,
)
from database.enums import (
    ReportStatus,
    Priority,
)
from services.duplicate_detection_service import DuplicateDetectionService
from services.report_support_service import ReportSupportService
from utils.gps import exif_to_decimal
from services.audit_log_service import AuditLogService
from configs.config import MAX_PAGE_SIZE_LIMIT,MAX_FILE_SIZE
from fastapi import Request
from utils.rate_limiter import limiter

router = APIRouter()

engine = InferenceEngine()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/report",
             responses={
    429: {
        "description": "Rate limit exceeded."
    }
},
             tags=["Reports"],
)
@limiter.limit("60 per hour")
async def report_issue(
    request:Request,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    current_user: User = Depends(require_citizen()),
    db: Session = Depends(get_db),
):

    report_service = ReportService(db)
    department_service = DepartmentService(db)
    assignment_service = AssignmentService(db)

    duplicate_service = DuplicateDetectionService(db)
    support_service = ReportSupportService(db)

    file_size = validate_uploaded_file(
        file=file,
        allowed_extensions={
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
        },
        allowed_content_types={
            "image/jpeg",
            "image/png",
            "image/webp",
        },
        max_size=MAX_FILE_SIZE,
    )
    
    stored_filename = generate_filename(file.filename)
    image_path = UPLOAD_DIR / stored_filename

    try:

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)


        mime_type = (
            file.content_type
            or "application/octet-stream"
        )

        result = await asyncio.to_thread(
            engine.predict,
            str(image_path),
        )

        if not result.get("success", False):

            if image_path.exists():
                image_path.unlink()

            raise HTTPException(
                status_code=400,
                detail=result,
            )

        detections = result["ai"]["detections"]

        if len(detections) == 0:
            if image_path.exists():
                image_path.unlink()

            annotated_path = Path(
                result["ai"]["annotated_image"].lstrip("/")
            )

            if annotated_path.exists():
                annotated_path.unlink()

            raise HTTPException(
                status_code=400,
                detail="No civic issue detected in the image.",
            )

        issue_type = detections[0]["class_name"]

        department = department_service.resolve(
            issue_type
        )

        verification_exif = result["verification"]["exif"]

        latitude = exif_to_decimal(
            verification_exif["gps_latitude"]
        )

        longitude = exif_to_decimal(
            verification_exif["gps_longitude"]
        )
        duplicate = None

        if (
            latitude is not None
            and longitude is not None
        ):
            duplicate = duplicate_service.find_duplicate(
                issue_type=issue_type,
                latitude=latitude,
                longitude=longitude,
                uploaded_image=str(image_path),
            )

        
        if duplicate:

            report = duplicate["report"]
            # Same citizen already reported/supported this issue
            if report.citizen_id == current_user.id:

                raise HTTPException(
                    status_code=409,
                    detail={
                        "success": False,
                        "message": "You have already reported this civic issue.",
                        "report_id": report.id,
                        "report_number": report.report_number,
                        "status": report.status.value,
                        "priority": report.priority.value,
                        "support_count": report.support_count,
                    },
                )
            if support_service.already_supported(
                report.id,
                current_user.id,
            ):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "success": False,
                        "message": "You have already reported/supported this civic issue.",
                        "report_id": report.id,
                        "report_number": report.report_number,
                        "status": report.status.value,
                        "priority": report.priority.value,
                        "support_count": report.support_count,
                    },
                )

            support_service.add_support(
                report.id,
                current_user.id,
            )
            AuditLogService(db).log(
                report_id=report.id,
                user_id=current_user.id,
                action="DUPLICATE_SUPPORTED",
                details="Citizen supported an existing report.",
            )
            db.commit()
            # Temporary upload cleanup disabled for now
            # until StorageManager is implemented.

            if image_path.exists():
                image_path.unlink()

            annotated_path = Path(
                result["ai"]["annotated_image"].lstrip("/")
            )

            if annotated_path.exists():
                annotated_path.unlink()
            self_report = (
                report.citizen_id == current_user.id
            )

            return {
                "success": True,
                "duplicate": True,
                "supported_existing_report": True,
                "already_supported": False,
                "report_id": report.id,
                "report_number": report.report_number,
                "status": report.status.value,
                "priority": report.priority.value,
                "department": report.department.name,
                "issue_type": report.issue_type,
                "created_at": report.created_at,
                "support_count": report.support_count,
                "distance": duplicate["distance"],
                "scene_similarity": duplicate["scene_similarity"],
                "message": (
                    "Existing civic issue found. "
                    "Your report has been added as citizen support."
                ),
            }

        report_data = ReportBuilder.build(
            inference_result=result,
            citizen_id=current_user.id,
            department_id=department.id,
            address=None,
            description=description,
        )

        report = report_service.create_report(report_data)

        media_service = get_media_service()
        orig_key = None
        annotated_key = None
        canonical_temp = None
        annotated_canonical_temp = None

        try:
            # 1. Canonical conversion and upload of original image
            canonical_temp = image_path.with_suffix(".canonical.webp")
            orig_w, orig_h, orig_file_size = media_service.process_canonical_image(
                image_path, canonical_temp
            )
            orig_key = media_service.build_report_image_key(report.id, "original", "webp")
            orig_meta = media_service.upload_file(canonical_temp, orig_key, "image/webp")

            report_service.save_image(
                report_id=report.id,
                original_filename=file.filename,
                stored_filename=Path(orig_key).name,
                image_path=orig_key,
                mime_type="image/webp",
                file_size=orig_meta["file_size"],
                image_type=ImageType.ORIGINAL,
                object_key=orig_key,
                storage_provider=orig_meta["storage_provider"],
                sha256=orig_meta["sha256"],
                width=orig_w,
                height=orig_h,
            )

            # 2. Canonical conversion and upload of annotated image
            annotated_relative_path = result["ai"]["annotated_image"]
            annotated_full_path = Path(annotated_relative_path.lstrip("/"))

            if annotated_full_path.exists():
                annotated_canonical_temp = annotated_full_path.with_suffix(".canonical.webp")
                ann_w, ann_h, ann_file_size = media_service.process_canonical_image(
                    annotated_full_path, annotated_canonical_temp
                )
                annotated_key = media_service.build_report_image_key(report.id, "annotated", "webp")
                annotated_meta = media_service.upload_file(
                    annotated_canonical_temp, annotated_key, "image/webp"
                )

                report_service.save_image(
                    report_id=report.id,
                    original_filename=Path(annotated_key).name,
                    stored_filename=Path(annotated_key).name,
                    image_path=annotated_key,
                    mime_type="image/webp",
                    file_size=annotated_meta["file_size"],
                    image_type=ImageType.ANNOTATED,
                    object_key=annotated_key,
                    storage_provider=annotated_meta["storage_provider"],
                    sha256=annotated_meta["sha256"],
                    width=ann_w,
                    height=ann_h,
                )

            report_service.save_detections(
                report_id=report.id,
                detections=result["ai"]["detections"],
                model_version=result["ai"]["model_version"],
                inference_time_ms=int(
                    result["processing_time"] * 1000
                ),
            )
            db.commit()

        except Exception:
            db.rollback()
            if orig_key:
                media_service.delete_quietly(orig_key)
            if annotated_key:
                media_service.delete_quietly(annotated_key)
            raise

        finally:
            safe_delete_file(canonical_temp)
            safe_delete_file(annotated_canonical_temp)
            if 'annotated_full_path' in locals() and annotated_full_path:
                safe_delete_file(annotated_full_path)

        assignment_message = None
        try:
            assignment_service.assign_worker(
                report_id=report.id,
                assigned_by=current_user.id,
                remarks="Auto assigned by system",
            )
        except HTTPException as exc:
            if (
                exc.status_code == 404
                and exc.detail == "No available workers found."
            ):
                assignment_message = (
                    "Report submitted successfully. "
                    "Currently no worker is available. "
                    "and report will be assigned "
                    "manually as soon as a worker becomes available."
                )
            else:
                raise

        public_detections = []
        for detection in result["ai"]["detections"]:
            public_detection = detection.copy()
            public_detection.pop("polygon", None)
            public_detections.append(public_detection)

        return {
            "success": True,
            "message": assignment_message or "Report Submitted Successfully.",
            "report_id": report.id,
            "report_number": report.report_number,
            "verification": result["verification"],
            "ai": {**result["ai"], "detections": public_detections},
            "processing_time": result["processing_time"],
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to process report.",
        )
    finally:
        safe_delete_file(image_path)
        if "result" in locals() and isinstance(result, dict):
            annotated = result.get("ai", {}).get("annotated_image") if isinstance(result.get("ai"), dict) else None
            if annotated:
                safe_delete_file(Path(annotated.lstrip("/")))

@router.get(
    "/reports/my",
    response_model=list[CitizenReportListItem],
    tags=["Reports"],
)
def get_my_reports(
    current_user: User = Depends(
        require_citizen(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).get_my_reports(
        current_user.id,
    )

@router.get(
    "/reports",
    response_model=PaginatedCityReports,
    tags=["Reports"],
)
def get_all_reports(
    page: int = 1,
    page_size: int = 20,
    department_id: int | None = None,
    status: ReportStatus | None = None,
    priority: Priority | None = None,
    issue_type: str | None = None,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1.",
        )

    if page_size < 1 or page_size > MAX_PAGE_SIZE_LIMIT:
        raise HTTPException(
            status_code=400,
            detail="page_size must be between 1 and 100.",
        )

    return ReportService(
        db,
    ).get_all_reports_paginated(
        page,
        page_size,
        department_id,
        status,
        priority,
        issue_type,
    )

@router.get(
    "/reports/department",
    response_model=list[DepartmentReportListItem],
    tags=["Reports"],
)


def get_department_reports(
    status: ReportStatus | None = None,
    priority: Priority | None = None,
    issue_type: str | None = None,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).get_department_reports(
        current_user.department_id,
        status,
        priority,
        issue_type,
    )

@router.get(
    "/reports/my/search",
    response_model=list[CitizenReportListItem],
    tags=["Reports"],
)
def search_my_reports(
    query: str,
    current_user: User = Depends(
        require_citizen(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).search_my_reports(
        current_user.id,
        query,
    )

@router.get(
    "/reports/search",
    response_model=list[CityReportListItem],
    tags=["Reports"],
)
def search_reports(
    query: str,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).search_reports(
        query,
    )

@router.get(
    "/reports/department/search",
    response_model=list[DepartmentReportListItem],
    tags=["Reports"],
)
def search_department_reports(
    query: str,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).search_department_reports(
        current_user.department_id,
        query,
    )

@router.get(
    "/reports/{report_number}",
    response_model=ReportResponse,
    tags=["Reports"],
)
def get_my_report(
    report_number: str,
    current_user: User = Depends(
        require_citizen(),
    ),
    db: Session = Depends(get_db),
):

    service = ReportService(db)

    try:

        return service.get_my_report(
            current_user.id,
            report_number,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
@router.post(
    "/reports/{report_id}/cancel",
    tags=["Reports"],
)
def cancel_report(
    report_id: int,
    request: ReportCancellationRequest,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).cancel_report(
        report_id=report_id,
        department_admin=current_user,
        request=request,
    )
@router.post(
    "/reports/{report_id}/reopen",
    tags=["Reports"],
)
def reopen_report(
    report_id: int,
    request: ReportReopenRequest,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(get_db),
):

    return ReportService(
        db,
    ).reopen_report(
        report_id=report_id,
        department_admin=current_user,
        request=request,
    )

@router.get(
    "/reports/{report_id}/admin",
    response_model=AdminReportDetailsResponse,
    tags=["Admin Reports"],
)
def get_admin_report_details_api(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_reports()),
):
    report_service = ReportService(db)
    return report_service.get_admin_report_details(report_id, current_user)

@router.get(
    "/reports/{report_id}/admin/image",
    tags=["Admin Reports"],
)
def get_admin_report_image_api(
    report_id: int,
    type: str = "original",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_reports()),
):
    report_service = ReportService(db)
    image = report_service.get_admin_secure_image(report_id, type, current_user)
    media_service = get_media_service()
    ref = getattr(image, "object_key", None) or image.image_path
    stream, mime_type, file_size = media_service.get_stream(
        ref, getattr(image, "storage_provider", None)
    )
    headers = {"Content-Length": str(file_size)} if file_size else {}
    return StreamingResponse(
        stream,
        media_type=mime_type or image.mime_type or "image/jpeg",
        headers=headers,
    )

@router.get(
    "/reports/{report_id}/image",
    tags=["Reports"],
)
def get_report_image_api(
    report_id: int,
    type: str = "original",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report_service = ReportService(db)
    image = report_service.get_report_secure_image(report_id, type, current_user)
    media_service = get_media_service()
    ref = getattr(image, "object_key", None) or image.image_path
    stream, mime_type, file_size = media_service.get_stream(
        ref, getattr(image, "storage_provider", None)
    )
    headers = {"Content-Length": str(file_size)} if file_size else {}
    return StreamingResponse(
        stream,
        media_type=mime_type or image.mime_type or "image/jpeg",
        headers=headers,
    )

