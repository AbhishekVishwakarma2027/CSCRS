import logging
from storage.base import StorageProvider
from storage.local_storage import LocalStorageProvider
from storage.oci_storage import OCIStorageProvider
from storage.media_service import MediaService
from configs.config import OBJECT_STORAGE_PROVIDER

logger = logging.getLogger("cscrs.storage")

_storage_singleton: StorageProvider | None = None
_media_service_singleton: MediaService | None = None


def get_storage_provider() -> StorageProvider:
    """
    Factory function returning the configured StorageProvider instance.
    Defaults to LocalStorageProvider for dev/test, and OCIStorageProvider for production.
    """
    global _storage_singleton
    if _storage_singleton is None:
        if OBJECT_STORAGE_PROVIDER == "oci":
            logger.info("Initializing OCI Object Storage provider.")
            _storage_singleton = OCIStorageProvider()
        else:
            logger.info("Initializing Local Storage provider (uploads/).")
            _storage_singleton = LocalStorageProvider()

    return _storage_singleton


def get_media_service() -> MediaService:
    """Factory function returning the central MediaService singleton."""
    global _media_service_singleton
    if _media_service_singleton is None:
        _media_service_singleton = MediaService(get_storage_provider())
    return _media_service_singleton


def reset_storage_provider() -> None:
    """Used in tests to reset the active storage provider singleton."""
    global _storage_singleton, _media_service_singleton
    _storage_singleton = None
    _media_service_singleton = None


__all__ = [
    "StorageProvider",
    "LocalStorageProvider",
    "OCIStorageProvider",
    "MediaService",
    "get_storage_provider",
    "get_media_service",
    "reset_storage_provider",
]

