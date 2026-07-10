import uuid
from pathlib import Path
import shutil

from fastapi import UploadFile


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def generate_filename(filename: str):

    extension = Path(filename).suffix

    stored = f"{uuid.uuid4().hex}{extension}"

    return stored
def save_uploaded_file(
    file: UploadFile,
):

    stored_filename = generate_filename(
        file.filename,
    )

    destination = (
        UPLOAD_DIR
        / stored_filename
    )

    with destination.open("wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer,
        )

    file.file.seek(0)

    return {

        "original_filename": file.filename,

        "stored_filename": stored_filename,

        "image_path": str(destination),

        "mime_type": file.content_type,

        "file_size": destination.stat().st_size,
    }

def safe_delete_file(path: str | Path):

    try:

        file_path = Path(path)

        if file_path.exists():

            file_path.unlink()

    except Exception:
        pass