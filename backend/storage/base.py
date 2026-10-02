from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO, Iterator


class StorageProvider(ABC):
    """
    Abstract interface for object storage providers (Local, OCI, etc.).
    All operations work on normalized object keys (e.g., 'cscrs/v1/reports/123/original/abc.webp').
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the canonical name of the storage provider (e.g., 'local', 'oci')."""
        pass

    @abstractmethod
    def upload_file(
        self,
        file_input: str | Path | BinaryIO | bytes,
        object_key: str,
        content_type: str | None = None,
    ) -> dict:
        """
        Uploads an object to storage.
        Returns a dict containing:
            - object_key: str
            - storage_provider: str
            - sha256: str
            - file_size: int
            - mime_type: str
        """
        pass

    def upload_bytes(
        self,
        data: bytes,
        object_key: str,
        content_type: str | None = None,
    ) -> dict:
        """Convenience method to upload raw bytes."""
        return self.upload_file(data, object_key, content_type)

    @abstractmethod
    def download_file(
        self,
        object_key: str,
        destination_path: str | Path,
    ) -> Path:
        """Downloads an object from storage to a local filesystem destination."""
        pass

    @abstractmethod
    def get_bytes(
        self,
        object_key: str,
    ) -> bytes:
        """Fetches the full byte payload of the specified object."""
        pass

    @abstractmethod
    def get_stream(
        self,
        object_key: str,
    ) -> tuple[BinaryIO | Iterator[bytes], str, int]:
        """
        Retrieves a stream for the specified object.
        Returns a tuple: (stream_or_iterator, mime_type, content_length).
        """
        pass

    @abstractmethod
    def delete_file(
        self,
        object_key: str,
    ) -> bool:
        """Deletes an object from storage. Returns True if deleted or did not exist."""
        pass

    @abstractmethod
    def file_exists(
        self,
        object_key: str,
    ) -> bool:
        """Returns True if the object exists in storage."""
        pass

    @abstractmethod
    def generate_signed_url(
        self,
        object_key: str,
        expires_in_seconds: int = 900,
    ) -> str:
        """Generates a temporary signed or pre-authenticated read URL."""
        pass

    def exists(self, object_key: str) -> bool:
        """Alias for file_exists."""
        return self.file_exists(object_key)

    def delete(self, object_key: str) -> bool:
        """Alias for delete_file."""
        return self.delete_file(object_key)
