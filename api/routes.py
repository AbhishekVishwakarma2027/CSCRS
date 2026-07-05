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

from services.department_service import DepartmentService
from services.report_builder import ReportBuilder
from services.report_service import ReportService
from authentication.dependencies import (
    require_citizen,
)


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

            raise HTTPException(
                status_code=400,
                detail=result,
            )

        detections = result.get(
            "detections",
            [],
        )

        if len(detections) == 0:

            raise HTTPException(
                status_code=400,
                detail="No civic issue detected in the image.",
            )

        issue_type = detections[0]["class"]

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

        return {

            "success": True,

            "report_id": report.id,

            "report_number": report.report_number,

            "verification": result["verification"],

            "detections": result["detections"],

            "processing_time": result["processing_time"],
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to process report: {str(e)}",
        )
router.include_router(auth_router)