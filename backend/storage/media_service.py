import io
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import BinaryIO, Iterator

from fastapi import HTTPException
from PIL import Image, ImageOps

from configs.config import (
    CANONICAL_IMAGE_MAX_DIMENSION,
    CANONICAL_IMAGE_MAX_PIXELS,
    CANONICAL_IMAGE_WEBP_QUALITY,
    OBJECT_STORAGE_PREFIX,
    OBJECT_STORAGE_PROVIDER,
)
from storage.base import StorageProvider
from storage.local_storage import LocalStorageProvider
from storage.oci_storage import OCIStorageProvider

logger = logging.getLogger("cscrs.storage.media_service")

# Configure Pillow decompression bomb protection globally
Image.MAX_IMAGE_PIXELS = CANONICAL_IMAGE_MAX_PIXELS


class MediaService:
    """
    Central orchestration service for media lifecycle in CSCRS:
    - Object key generation with structured hierarchy
    - Canonical WebP conversion and optimization
    - Pre-upload and post-upload verification
    - Storage abstraction (Local & OCI Object Storage)
    - Dual-read compatibility for legacy filesystem paths
    - Safe streaming and temporary download for AI engines
    """

    def __init__(self, provider: StorageProvider | None = None):
        if provider is not None:
            self.provider = provider
        elif OBJECT_STORAGE_PROVIDER == "oci":
            self.provider = OCIStorageProvider()
        else:
            self.provider = LocalStorageProvider()
        self.prefix = OBJECT_STORAGE_PREFIX

    @property
    def provider_name(self) -> str:
        return self.provider.provider_name

    # ==========================================================
    # Object Key Generation (Structured, Collision-Resistant)
    # ==========================================================

    def build_report_image_key(
        self,
        report_id: int | str,
        image_type: str = "original",
        ext: str = "webp",
    ) -> str:
        clean_ext = ext.lstrip(".").lower()
        subfolder = image_type.lower()
        random_id = uuid.uuid4().hex
        return f"{self.prefix}/reports/{report_id}/{subfolder}/{random_id}.{clean_ext}"

    def build_resolution_image_key(
        self,
        report_id: int | str,
        attempt_id: int | str = "initial",
        image_type: str = "proof",
        ext: str = "webp",
    ) -> str:
        clean_ext = ext.lstrip(".").lower()
        random_id = uuid.uuid4().hex
        return (
            f"{self.prefix}/resolutions/{report_id}/attempts/{attempt_id}/"
            f"{image_type.lower()}/{random_id}.{clean_ext}"
        )

    def build_profile_image_key(
        self,
        user_id: int | str,
        ext: str = "webp",
    ) -> str:
        clean_ext = ext.lstrip(".").lower()
        random_id = uuid.uuid4().hex
        return f"{self.prefix}/profiles/{user_id}/{random_id}.{clean_ext}"

    def build_system_issue_key(
        self,
        issue_id: int | str,
        ext: str,
    ) -> str:
        clean_ext = ext.lstrip(".").lower()
        random_id = uuid.uuid4().hex
        return f"{self.prefix}/system-issues/{issue_id}/attachments/{random_id}.{clean_ext}"

    def build_public_update_key(
        self,
        update_id: int | str,
        ext: str = "webp",
    ) -> str:
        clean_ext = ext.lstrip(".").lower()
        random_id = uuid.uuid4().hex
        return f"{self.prefix}/public-updates/{update_id}/thumbnail/{random_id}.{clean_ext}"

    # ==========================================================
    # Canonical Image Processing
    # ==========================================================

    @staticmethod
    def process_canonical_image(
        input_image_path: Path | str,
        output_image_path: Path | str | None = None,
        preserve_transparency: bool = False,
        **kwargs,
    ):
        """
        Converts an image to canonical WebP format:
        1. Protects against decompression bombs
        2. Corrects EXIF orientation (exif_transpose)
        3. Scales down if max dimension > 2048px (never upscales)
        4. Encodes to WebP (quality=85, method=6)
        """
        input_path = Path(input_image_path)
        auto_temp = False
        if output_image_path is None or (
            isinstance(output_image_path, str)
            and not ("/" in output_image_path or "\\" in output_image_path or "." in output_image_path)
        ):
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".webp")
            output_path = Path(tmp.name)
            tmp.close()
            auto_temp = True
        else:
            output_path = Path(output_image_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)

        with Image.open(input_path) as img:
            w_orig, h_orig = img.size
            if (w_orig * h_orig) > CANONICAL_IMAGE_MAX_PIXELS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image dimensions exceed safety threshold ({w_orig}x{h_orig} > {CANONICAL_IMAGE_MAX_PIXELS} pixels).",
                )

            # Re-orient based on EXIF tag before stripping
            img = ImageOps.exif_transpose(img)

            # Preserve transparency if requested and available
            if preserve_transparency and img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")

            width, height = img.size

            # Proportional downscaling only (never upscale)
            max_dim = kwargs.get("max_dimension", CANONICAL_IMAGE_MAX_DIMENSION)
            if max(width, height) > max_dim:
                if width >= height:
                    new_width = max_dim
                    new_height = int(height * (max_dim / width))
                else:
                    new_height = max_dim
                    new_width = int(width * (max_dim / height))

                img = img.resize(
                    (new_width, new_height),
                    resample=Image.Resampling.LANCZOS,
                )
                width, height = new_width, new_height

            img.save(
                output_path,
                format="WEBP",
                quality=CANONICAL_IMAGE_WEBP_QUALITY,
                method=6,
            )

        file_size = output_path.stat().st_size
        if auto_temp:
            return output_path, width, height
        return width, height, file_size

    # ==========================================================
    # Storage Upload & Compensating Operations
    # ==========================================================

    def upload_file(
        self,
        file_input: str | Path | BinaryIO | bytes | None = None,
        object_key: str = "",
        content_type: str | None = None,
        local_path: str | Path | None = None,
    ) -> dict:
        """Uploads file to the active storage provider and returns metadata."""
        target_input = file_input if file_input is not None else local_path
        if target_input is None:
            raise ValueError("upload_file requires file_input or local_path.")
        return self.provider.upload_file(
            file_input=target_input,
            object_key=object_key,
            content_type=content_type,
        )

    def upload_bytes(
        self,
        data: bytes,
        object_key: str,
        content_type: str | None = None,
    ) -> dict:
        """Uploads raw bytes to the active storage provider."""
        return self.provider.upload_file(
            file_input=data,
            object_key=object_key,
            content_type=content_type,
        )

    def delete(self, object_key: str | None) -> bool:
        """Deletes an object from the active storage provider."""
        if not object_key:
            return False
        return self.provider.delete(object_key)

    def delete_quietly(self, object_key: str | None) -> None:
        """
        Deletes an object from storage without throwing an exception.
        Used for compensating rollback transactions and best-effort cleanup.
        """
        if not object_key:
            return
        try:
            self.provider.delete_file(object_key)
        except Exception as e:
            logger.warning("Failed to delete object quietly: %s (%s)", object_key, e)

    def safe_delete_media(
        self,
        object_key_or_path: str | None,
        storage_provider: str | None = None,
    ) -> None:
        """Deletes media whether stored in OCI or legacy local filesystem."""
        if not object_key_or_path:
            return

        is_cloud = (
            storage_provider == "oci"
            or object_key_or_path.startswith(self.prefix)
            or object_key_or_path.startswith("cscrs/")
        )

        if is_cloud:
            self.delete_quietly(object_key_or_path)
        else:
            # Local filesystem path
            try:
                p = Path(object_key_or_path)
                if p.exists() and p.is_file():
                    p.unlink()
            except Exception as e:
                logger.warning(
                    "Failed to delete local file: %s (%s)", object_key_or_path, e
                )

    # ==========================================================
    # Dual-Read, Retrieval & Streaming
    # ==========================================================

    def is_cloud_object(
        self,
        object_key_or_path: str,
        storage_provider: str | None = None,
    ) -> bool:
        """Determines if a reference is a cloud object key or a local filesystem path."""
        if storage_provider == "oci":
            return True
        if storage_provider == "local" and not object_key_or_path.startswith(self.prefix):
            return False
        clean = object_key_or_path.replace("\\", "/").strip("/")
        return clean.startswith(self.prefix) or clean.startswith("cscrs/")

    def get_stream(
        self,
        object_key_or_path: str,
        storage_provider: str | None = None,
    ) -> tuple[BinaryIO | Iterator[bytes], str, int]:
        """
        Retrieves a stream for the specified media:
        - If cloud object or managed key, delegates to storage provider.
        - If legacy local path, streams directly from local filesystem.
        """
        if self.is_cloud_object(object_key_or_path, storage_provider):
            return self.provider.get_stream(object_key_or_path)

        # Legacy local file fallback
        local_path = Path(object_key_or_path)
        if not local_path.is_absolute() and not local_path.exists():
            # Check relative to uploads directory
            candidate = Path("uploads") / object_key_or_path.lstrip("/\\")
            if candidate.exists():
                local_path = candidate

        if local_path.exists() and local_path.is_file():
            import mimetypes

            mime_type, _ = mimetypes.guess_type(str(local_path))
            mime_type = mime_type or "application/octet-stream"
            file_size = local_path.stat().st_size

            def file_iterator() -> Iterator[bytes]:
                with open(local_path, "rb") as f:
                    while chunk := f.read(65536):
                        yield chunk

            return file_iterator(), mime_type, file_size

        # If not on local disk, try provider as last resort
        return self.provider.get_stream(object_key_or_path)

    def download_to_temp(
        self,
        object_key_or_path: str,
        storage_provider: str | None = None,
        suffix: str = ".webp",
    ) -> Path:
        """
        Ensures the media is accessible as a local file for AI/cv2/PIL inspection.
        If already on local disk, returns the existing Path.
        If in cloud storage, downloads to a secure temporary file.
        Caller is responsible for cleaning up the returned temporary Path.
        """
        if not self.is_cloud_object(object_key_or_path, storage_provider):
            local_path = Path(object_key_or_path)
            if local_path.exists() and local_path.is_file():
                return local_path
            candidate = Path("uploads") / object_key_or_path.lstrip("/\\")
            if candidate.exists() and candidate.is_file():
                return candidate

        # Download from storage provider into a temporary file
        fd, temp_path_str = tempfile.mkstemp(suffix=suffix, prefix="cscrs_media_")
        os.close(fd)
        temp_path = Path(temp_path_str)
        self.provider.download_file(object_key_or_path, temp_path)
        return temp_path

    def get_image_for_embedding(
        self,
        object_key_or_path: str,
        storage_provider: str | None = None,
    ) -> Image.Image:
        """
        Loads a PIL Image directly into memory for AI embedding models (e.g. OpenCLIP).
        Avoids disk writes when streaming from cloud storage.
        """
        if not self.is_cloud_object(object_key_or_path, storage_provider):
            local_path = Path(object_key_or_path)
            if not local_path.exists():
                local_path = Path("uploads") / object_key_or_path.lstrip("/\\")
            if local_path.exists():
                return Image.open(local_path).convert("RGB")

        # Download bytes and convert in-memory
        data = self.provider.get_bytes(object_key_or_path)
        return Image.open(io.BytesIO(data)).convert("RGB")


# Singleton instance
media_service = MediaService()

def get_media_service() -> MediaService:
    return media_service
