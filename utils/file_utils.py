import uuid
from pathlib import Path


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def generate_filename(filename: str):

    extension = Path(filename).suffix

    stored = f"{uuid.uuid4().hex}{extension}"

    return stored