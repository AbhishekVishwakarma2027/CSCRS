import hashlib
import io
import mimetypes
import os
import shutil
from pathlib import Path
from typing import BinaryIO, Iterator

# Ensure webp is registered across platforms
mimetypes.add_type("image/webp", ".webp")

from storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    """
    Local filesystem storage provider.
    Used for local development, test environments, and fallback compatibility.
    """

    def __init__(self, base_dir: str | Path = "uploads"):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    @property
    def provider_name(self) -> str:
        return "local"

    def _resolve_path(self, object_key: str) -> Path:
        normalized_key = object_key.strip("/").replace("\\", "/")
        target_path = (self.base_dir / normalized_key).resolve()
        # Path traversal guard
        if not str(target_path).startswith(str(self.base_dir)):
            raise ValueError(f"Path traversal detected: {object_key}")
        return target_path

    def upload_file(
        self,
        file_input: str | Path | BinaryIO | bytes,
        object_key: str,
        content_type: str | None = None,
    ) -> dict:
        target_path = self._resolve_path(object_key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        hasher = hashlib.sha256()
        file_size = 0

        if isinstance(file_input, (str, Path)):
            src_path = Path(file_input)
            with open(src_path, "rb") as src, open(target_path, "wb") as dst:
                while chunk := src.read(65536):
                    hasher.update(chunk)
                    dst.write(chunk)
            file_size = target_path.stat().st_size
        elif isinstance(file_input, bytes):
            hasher.update(file_input)
            with open(target_path, "wb") as dst:
                dst.write(file_input)
            file_size = len(file_input)
        else:
            # File-like object
            with open(target_path, "wb") as dst:
                file_input.seek(0)
                while chunk := file_input.read(65536):
                    hasher.update(chunk)
                    dst.write(chunk)
            file_size = target_path.stat().st_size
            file_input.seek(0)

        sha256_hex = hasher.hexdigest()

        if not content_type:
            content_type, _ = mimetypes.guess_type(str(target_path))
            content_type = content_type or "application/octet-stream"

        return {
            "object_key": object_key.strip("/").replace("\\", "/"),
            "storage_provider": self.provider_name,
            "sha256": sha256_hex,
            "file_size": file_size,
            "mime_type": content_type,
        }

    def download_file(
        self,
        object_key: str,
        destination_path: str | Path,
    ) -> Path:
        src = self._resolve_path(object_key)
        if not src.exists() or not src.is_file():
            raise FileNotFoundError(f"Local storage object not found: {object_key}")

        dst = Path(destination_path)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        return dst

    def get_bytes(
        self,
        object_key: str,
    ) -> bytes:
        src = self._resolve_path(object_key)
        if not src.exists() or not src.is_file():
            raise FileNotFoundError(f"Local storage object not found: {object_key}")
        with open(src, "rb") as f:
            return f.read()

    def get_stream(
        self,
        object_key: str,
    ) -> tuple[Iterator[bytes], str, int]:
        src = self._resolve_path(object_key)
        if not src.exists() or not src.is_file():
            raise FileNotFoundError(f"Local storage object not found: {object_key}")

        content_type, _ = mimetypes.guess_type(str(src))
        content_type = content_type or "application/octet-stream"
        file_size = src.stat().st_size

        def iterator() -> Iterator[bytes]:
            with open(src, "rb") as f:
                while chunk := f.read(65536):
                    yield chunk

        return iterator(), content_type, file_size

    def delete_file(
        self,
        object_key: str,
    ) -> bool:
        src = self._resolve_path(object_key)
        if src.exists() and src.is_file():
            src.unlink()
            return True
        return False

    def file_exists(
        self,
        object_key: str,
    ) -> bool:
        src = self._resolve_path(object_key)
        return src.exists() and src.is_file()

    def generate_signed_url(
        self,
        object_key: str,
        expires_in_seconds: int = 900,
    ) -> str:
        # In local storage, return a relative URL rooted at /uploads
        clean_key = object_key.strip("/").replace("\\", "/")
        return f"/uploads/{clean_key}"
