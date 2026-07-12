from pathlib import Path
import shutil
from api.auth import router as auth_router
from authentication.dependencies import get_current_user
from database.models.user import User
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session
from utils.file_utils import generate_filename
from database.dependencies import get_db

from inference.engine import InferenceEngine
from api.worker import router as worker_router
from services.department_service import DepartmentService
from services.report_builder import ReportBuilder
from services.report_service import ReportService
from authentication.dependencies import (
    require_citizen,
)
from api.assignment import router as assignment_router
from api.resolution import router as resolution_router
from database.enums import ImageType
from services.assignment import AssignmentService
import traceback
from api.admin import router as admin_router
from api.city_admin import router as city_admin_router
from api.department import router as department_router

router = APIRouter()

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
router.include_router(auth_router)
router.include_router(worker_router)
router.include_router(admin_router)
router.include_router(city_admin_router)
router.include_router(assignment_router,prefix="/api/v1",)
router.include_router(resolution_router,prefix="/api/v1",)
router.include_router(department_router)