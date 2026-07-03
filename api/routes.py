from pathlib import Path
import shutil

from fastapi import APIRouter, File, UploadFile

from inference.engine import InferenceEngine

router = APIRouter()

engine = InferenceEngine()


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/api/v1/report")

async def report_issue(file: UploadFile = File(...)):

    image_path = UPLOAD_DIR / file.filename

    with open(image_path, "wb") as buffer:

        shutil.copyfileobj(file.file, buffer)

    result = engine.predict(str(image_path))

    return result