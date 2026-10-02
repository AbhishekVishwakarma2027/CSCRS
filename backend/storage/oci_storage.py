import datetime
import hashlib
import io
import logging
import mimetypes
import os
from pathlib import Path
from typing import BinaryIO, Iterator

try:
    import oci
    from oci.object_storage import ObjectStorageClient, UploadManager
    from oci.object_storage.models import CreatePreauthenticatedRequestDetails
    HAS_OCI = True
except ImportError:
    oci = None
    ObjectStorageClient = None
    UploadManager = None
    CreatePreauthenticatedRequestDetails = None
    HAS_OCI = False

from storage.base import StorageProvider
from configs.config import (
    OCI_OBJECT_STORAGE_REGION,
    OCI_OBJECT_STORAGE_NAMESPACE,
    OCI_OBJECT_STORAGE_BUCKET,
    OCI_OBJECT_STORAGE_TENANCY_OCID,
    OCI_OBJECT_STORAGE_USER_OCID,
    OCI_OBJECT_STORAGE_FINGERPRINT,
    OCI_OBJECT_STORAGE_KEY_FILE,
    OCI_OBJECT_STORAGE_KEY_PASSPHRASE,
)

logger = logging.getLogger("cscrs.storage.oci")


class OCIStorageProvider(StorageProvider):
    """
    Oracle Cloud Infrastructure (OCI) Object Storage provider.
    Supports private bucket operations, streaming, checksums, and PAR URLs.
    """

    def __init__(
        self,
        region: str | None = None,
        namespace: str | None = None,
        bucket: str | None = None,
        tenancy_ocid: str | None = None,
        user_ocid: str | None = None,
        fingerprint: str | None = None,
        key_file: str | None = None,
        passphrase: str | None = None,
    ):
        self.region = region or OCI_OBJECT_STORAGE_REGION
        self.namespace = namespace or OCI_OBJECT_STORAGE_NAMESPACE
        self.bucket = bucket or OCI_OBJECT_STORAGE_BUCKET
        self.tenancy_ocid = tenancy_ocid or OCI_OBJECT_STORAGE_TENANCY_OCID
        self.user_ocid = user_ocid or OCI_OBJECT_STORAGE_USER_OCID
        self.fingerprint = fingerprint or OCI_OBJECT_STORAGE_FINGERPRINT
        self.key_file = key_file or OCI_OBJECT_STORAGE_KEY_FILE
        self.passphrase = passphrase or OCI_OBJECT_STORAGE_KEY_PASSPHRASE

        self._client: ObjectStorageClient | None = None
        self._upload_manager: UploadManager | None = None

    @property
    def provider_name(self) -> str:
        return "oci"

    def _get_client(self) -> ObjectStorageClient:
        if not HAS_OCI:
            raise RuntimeError(
                "The 'oci' Python SDK is required for OCIStorageProvider. Please install it using 'pip install oci>=2.140.0'."
            )
        if self._client is None:
            if not self.key_file or not os.path.isfile(self.key_file):
                raise RuntimeError(
                    f"OCI private key file is missing: {self.key_file}"
                )

            config = {
                "user": self.user_ocid,
                "key_file": self.key_file,
                "fingerprint": self.fingerprint,
                "tenancy": self.tenancy_ocid,
                "region": self.region,
            }
            if self.passphrase:
                config["pass_phrase"] = self.passphrase

            try:
                oci.config.validate_config(config)
            except Exception as e:
                logger.error("OCI configuration validation failed.")
                raise RuntimeError(f"OCI config invalid: {e}") from e

            self._client = ObjectStorageClient(config)
            self._upload_manager = UploadManager(self._client)
            logger.info(
                "OCI Object Storage client initialized. region=%s bucket=%s",
                self.region,
                self.bucket,
            )

        return self._client

    def _get_upload_manager(self) -> UploadManager:
        self._get_client()
        return self._upload_manager

    def upload_file(
        self,
        file_input: str | Path | BinaryIO | bytes,
        object_key: str,
        content_type: str | None = None,
    ) -> dict:
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")

        if not content_type:
            content_type, _ = mimetypes.guess_type(clean_key)
            content_type = content_type or "application/octet-stream"

        hasher = hashlib.sha256()

        if isinstance(file_input, (str, Path)):
            src_path = str(file_input)
            file_size = os.path.getsize(src_path)
            with open(src_path, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)

            # Upload using UploadManager (handles multipart for large files)
            upload_manager = self._get_upload_manager()
            upload_manager.upload_file(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
                file_path=src_path,
                content_type=content_type,
            )
        elif isinstance(file_input, bytes):
            hasher.update(file_input)
            file_size = len(file_input)
            client.put_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
                put_object_body=file_input,
                content_type=content_type,
            )
        else:
            # BinaryIO stream
            file_input.seek(0)
            data = file_input.read()
            hasher.update(data)
            file_size = len(data)
            client.put_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
                put_object_body=data,
                content_type=content_type,
            )
            file_input.seek(0)

        sha256_hex = hasher.hexdigest()

        return {
            "object_key": clean_key,
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
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")
        dst = Path(destination_path)
        dst.parent.mkdir(parents=True, exist_ok=True)

        try:
            response = client.get_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
            )
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                raise FileNotFoundError(f"OCI object not found: {clean_key}") from e
            raise

        with open(dst, "wb") as f:
            for chunk in response.data.raw.stream(65536):
                f.write(chunk)

        return dst

    def get_bytes(
        self,
        object_key: str,
    ) -> bytes:
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")

        try:
            response = client.get_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
            )
            return response.data.content
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                raise FileNotFoundError(f"OCI object not found: {clean_key}") from e
            raise

    def get_stream(
        self,
        object_key: str,
    ) -> tuple[Iterator[bytes], str, int]:
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")

        try:
            response = client.get_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
            )
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                raise FileNotFoundError(f"OCI object not found: {clean_key}") from e
            raise

        content_type = (
            response.headers.get("content-type")
            or mimetypes.guess_type(clean_key)[0]
            or "application/octet-stream"
        )
        content_length = int(response.headers.get("content-length", 0))

        def iterator() -> Iterator[bytes]:
            for chunk in response.data.raw.stream(65536):
                yield chunk

        return iterator(), content_type, content_length

    def delete_file(
        self,
        object_key: str,
    ) -> bool:
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")

        try:
            client.delete_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
            )
            return True
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                return False
            raise

    def file_exists(
        self,
        object_key: str,
    ) -> bool:
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")

        try:
            client.head_object(
                namespace_name=self.namespace,
                bucket_name=self.bucket,
                object_name=clean_key,
            )
            return True
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                return False
            raise

    def generate_signed_url(
        self,
        object_key: str,
        expires_in_seconds: int = 900,
    ) -> str:
        client = self._get_client()
        clean_key = object_key.strip("/").replace("\\", "/")
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            seconds=expires_in_seconds
        )

        details = CreatePreauthenticatedRequestDetails(
            name=f"par_{clean_key.split('/')[-1]}_{int(datetime.datetime.now().timestamp())}",
            access_type=CreatePreauthenticatedRequestDetails.ACCESS_TYPE_OBJECT_READ,
            time_expires=expires_at,
            object_name=clean_key,
        )

        par_response = client.create_preauthenticated_request(
            namespace_name=self.namespace,
            bucket_name=self.bucket,
            create_preauthenticated_request_details=details,
        )
        par = par_response.data
        return f"https://objectstorage.{self.region}.oraclecloud.com{par.access_uri}"
