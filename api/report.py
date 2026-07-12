from pathlib import Path
import shutil
import traceback

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from sqlalchemy.orm import Session

from authentication.dependencies import (
    require_citizen,
    require_department_admin,
    require_city_admin
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
)
from schemas.report import PaginatedCityReports
from utils.file_utils import generate_filename
from database.enums import (
    ReportStatus,
    Priority,
)



router = APIRouter(
    tags=["Reports"]
)

engine = InferenceEngine()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/api/v1/report")
async def report_issue(
    file: UploadFile = File(...),
    description: str | None = Form(None),
    current_user: User = Depends(require_citizen()),
    db: Session = Depends(get_db),
):

    report_service = ReportService(db)
    department_service = DepartmentService(db)
    assignment_service = AssignmentService(db)

    stored_filename = generate_filename(file.filename)
    image_path = UPLOAD_DIR / stored_filename

    try:

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = image_path.stat().st_size

        mime_type = (
            file.content_type
            or "application/octet-stream"
        )

        result = engine.predict(str(image_path))

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

        report_data = ReportBuilder.build(
            inference_result=result,

            citizen_id=current_user.id,  

            department_id=department.id,

            address=None,

            description=description,
        )

        report = report_service.create_report(
            report_data
        )



        report_service.save_image(
            report_id=report.id,

            original_filename=file.filename,

            stored_filename=stored_filename,

            image_path=str(image_path),

            mime_type=mime_type,

            file_size=file_size,
        )

        annotated_relative_path = result["ai"]["annotated_image"]

        annotated_filename = Path(
            annotated_relative_path
        ).name

        annotated_full_path = Path(
            annotated_relative_path.lstrip("/")
        )

        if annotated_full_path.exists():

            report_service.save_image(

                report_id=report.id,

                original_filename=annotated_filename,

                stored_filename=annotated_filename,

                image_path=str(annotated_full_path),

                mime_type="image/jpeg",

                file_size=annotated_full_path.stat().st_size,

                image_type=ImageType.ANNOTATED,
            )

        report_service.save_detections(
                report_id=report.id,
                detections=result["ai"]["detections"],
                model_version=result["ai"]["model_version"],
                inference_time_ms=int(
                    result["processing_time"] * 1000
                ),
            )
        
        try:

            assignment_service.assign_worker(
                report_id=report.id,
                assigned_by=3,      # System Owner
                remarks="Auto assigned by system",
            )

        except HTTPException:

            pass
        public_detections = []

        for detection in result["ai"]["detections"]:

            public_detection = detection.copy()

            public_detection.pop("polygon", None)

            public_detections.append(public_detection)

        return {

            "success": True,

            "report_id": report.id,

            "report_number": report.report_number,

            "verification": result["verification"],

            "ai": {**result["ai"],"detections":public_detections,},

            # "detections": result["detections"],

            "processing_time": result["processing_time"],
        }

    except HTTPException:

        if image_path.exists():
            image_path.unlink()
        raise

    except Exception as e:
        traceback.print_exc() #temporary add
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {str(e)}", #temporary add
            # detail=f"Failed to process report: {str(e)}",
        )
@router.get(
    "/api/v1/reports/my",
    response_model=list[CitizenReportListItem],
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
    "/api/v1/reports",
    response_model=PaginatedCityReports,
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
    "/api/v1/reports/department",
    response_model=list[DepartmentReportListItem],
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
    "/api/v1/reports/my/search",
    response_model=list[CitizenReportListItem],
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
    "/api/v1/reports/search",
    response_model=list[CityReportListItem],
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
    "/api/v1/reports/department/search",
    response_model=list[DepartmentReportListItem],
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
    "/api/v1/reports/{report_number}",
    response_model=ReportResponse,
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