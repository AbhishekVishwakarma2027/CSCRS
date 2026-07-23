import uuid
from pathlib import Path
import shutil
from fastapi import UploadFile,HTTPException


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)
IMAGE_SIGNATURES = {
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".webp": [b"RIFF"],
}
VIDEO_SIGNATURES = {
    ".mp4": lambda h: len(h) >= 12 and h[4:8] == b"ftyp",
    ".mov": lambda h: len(h) >= 12 and h[4:8] == b"ftyp",
    ".avi": lambda h: h.startswith(b"RIFF") and h[8:12] == b"AVI ",
    ".mkv": lambda h: h.startswith(b"\x1A\x45\xDF\xA3"),
}

def validate_uploaded_file(
    file: UploadFile,
    *,
    allowed_extensions: set[str],
    allowed_content_types: set[str],
    max_size: int,
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing.",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail="Unsupported file extension.",
        )
    content_type = (file.content_type or "").lower()

    if content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type.",
        )
    
    file.file.seek(0, 2)

    size = file.file.tell()

    file.file.seek(0)

    if size == 0:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )
    if size > max_size:

        raise HTTPException(
            status_code=413,
            detail="File size exceeds allowed limit.",
        )
    header = file.file.read(16)

    file.file.seek(0)

    # ---------- Image Validation ----------

    expected = IMAGE_SIGNATURES.get(extension)

    if extension == ".webp":

        if not (
            header.startswith(b"RIFF")
            and header[8:12] == b"WEBP"
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid or corrupted image file.",
            )

    elif expected:

        if not any(header.startswith(sig) for sig in expected):
            raise HTTPException(
                status_code=400,
                detail="Invalid or corrupted image file.",
            )

    # ---------- Video Validation ----------

    elif extension in VIDEO_SIGNATURES:

        if not VIDEO_SIGNATURES[extension](header):

            raise HTTPException(
                status_code=400,
                detail="Invalid or corrupted video file.",
            )
    return size

def generate_filename(filename: str):

    extension = Path(filename).suffix

    stored = f"{uuid.uuid4().hex}{extension}"

    return stored
def save_uploaded_file(
    file: UploadFile,
    folder: str = "",
):

    stored_filename = generate_filename(
        file.filename,
    )

    upload_folder = UPLOAD_DIR / folder

    upload_folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    destination = (
        upload_folder
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