"""
CSCRS Production OCI & Local Object Storage Test Suite
Comprehensive validation of StorageProvider, MediaService, Canonical Image Pipeline,
Video handling, Dual-Read Fallback, Profile Lifecycle, and Transaction Rollback Compensation.
"""

import io
from pathlib import Path
import shutil
import sys
import tempfile
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure dependencies are mocked if absent in test runner
for mod_name in [
    "user_agents",
    "open_clip",
    "ultralytics",
    "exifread",
    "torch",
    "torch.nn",
    "torch.nn.functional",
]:
    if mod_name not in sys.modules:
        sys.modules[mod_name] = MagicMock()

from database.base import Base
from database.enums import UserRole, SystemIssueCategory
from database.models.report import Report
from database.models.report_image import ReportImage
from database.models.resolution import Resolution
from database.models.resolution_attempt import ResolutionAttempt
from database.models.user import User
from database.models.system_issue import SystemIssue
from database.models.system_issue_attachment import SystemIssueAttachment
from database.models.public_update import PublicUpdate
from storage.local_storage import LocalStorageProvider
from storage.oci_storage import OCIStorageProvider
from storage.media_service import MediaService, get_media_service
from services.profile_service import ProfileService
from services.system_issue_service import SystemIssueService
from schemas.system_issue import SystemIssueCreate


@pytest.fixture
def temp_storage_dir():
    temp_dir = tempfile.mkdtemp(prefix="cscrs_test_storage_")
    yield Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def local_storage(temp_storage_dir):
    return LocalStorageProvider(base_dir=temp_storage_dir)


@pytest.fixture
def media_service(local_storage):
    return MediaService(provider=local_storage)


@pytest.fixture
def db_session():
    """In-memory SQLite database session with full schema including object storage fields."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


# =========================================================================
# 1. STORAGE PROVIDER OPERATIONS
# =========================================================================

def test_local_storage_crud_and_stream(local_storage, temp_storage_dir):
    test_data = b"Civic System Image Binary Data 12345"
    key = "cscrs/v1/reports/101/original/test_photo.webp"

    # 1. Upload bytes
    upload_res = local_storage.upload_bytes(test_data, key, content_type="image/webp")
    assert upload_res["object_key"] == key
    assert upload_res["file_size"] == len(test_data)

    # 2. Exists
    assert local_storage.exists(key) is True
    assert local_storage.exists("non_existent_key.webp") is False

    # 3. Stream
    stream, ctype, length = local_storage.get_stream(key)
    assert ctype == "image/webp"
    assert length == len(test_data)
    read_bytes = stream.read() if hasattr(stream, "read") else b"".join(stream)
    assert read_bytes == test_data

    # 4. Get bytes
    assert local_storage.get_bytes(key) == test_data

    # 5. Delete
    deleted = local_storage.delete(key)
    assert deleted is True
    assert local_storage.exists(key) is False


def test_oci_storage_config_validation(monkeypatch):
    """Verify OCI provider raises on missing key file or invalid credentials."""
    provider = OCIStorageProvider(
        region="ap-mumbai-1",
        namespace="bmv2paypbavo",
        bucket="cscrs-storage",
        tenancy_ocid="ocid1.tenancy.oc1..test",
        user_ocid="ocid1.user.oc1..test",
        fingerprint="test:fingerprint",
        key_file="/path/to/missing/key.pem",
    )
    with pytest.raises(RuntimeError) as exc_info:
        provider._get_client()
    assert "OCI private key file is missing" in str(exc_info.value) or "oci" in str(exc_info.value).lower()


# =========================================================================
# 2. OBJECT KEY GENERATION
# =========================================================================

def test_object_key_generation(media_service):
    report_key = media_service.build_report_image_key(report_id=42, image_type="original")
    assert report_key.startswith("cscrs/v1/reports/42/original/")
    assert report_key.endswith(".webp")

    annotated_key = media_service.build_report_image_key(report_id=42, image_type="annotated")
    assert annotated_key.startswith("cscrs/v1/reports/42/annotated/")
    assert annotated_key.endswith(".webp")

    res_key = media_service.build_resolution_image_key(report_id=42, attempt_id=1, image_type="proof")
    assert res_key.startswith("cscrs/v1/resolutions/42/attempts/1/proof/")

    profile_key = media_service.build_profile_image_key(user_id=10)
    assert profile_key.startswith("cscrs/v1/profiles/10/")
    assert profile_key.endswith(".webp")

    issue_key = media_service.build_system_issue_key(issue_id=5, ext="mp4")
    assert issue_key.startswith("cscrs/v1/system-issues/5/attachments/")
    assert issue_key.endswith(".mp4")


# =========================================================================
# 3. CANONICAL IMAGE PIPELINE & COMPRESSION
# =========================================================================

def test_canonical_image_downscale(media_service):
    """Large images should be downscaled proportionally to max_dimension."""
    # Create large 3000x2000 image
    img = Image.new("RGB", (3000, 2000), color="blue")
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        img.save(tmp_path, "JPEG")

    try:
        canonical_path, w, h = media_service.process_canonical_image(
            tmp_path,
            max_dimension=2048,
            output_ext="webp",
        )
        assert canonical_path.exists()
        assert w == 2048
        assert h == int(2000 * (2048 / 3000))
        assert canonical_path.suffix == ".webp"
    finally:
        tmp_path.unlink(missing_ok=True)
        canonical_path.unlink(missing_ok=True)


def test_canonical_image_do_not_upscale_small(media_service):
    """Small images should NOT be upscaled."""
    img = Image.new("RGB", (400, 300), color="green")
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        img.save(tmp_path, "PNG")

    try:
        canonical_path, w, h = media_service.process_canonical_image(
            tmp_path,
            max_dimension=2048,
            output_ext="webp",
        )
        assert canonical_path.exists()
        assert w == 400
        assert h == 300
    finally:
        tmp_path.unlink(missing_ok=True)
        canonical_path.unlink(missing_ok=True)


def test_canonical_image_rgba_preserved(media_service):
    """RGBA images preserve alpha channel in WebP."""
    img = Image.new("RGBA", (500, 500), color=(255, 0, 0, 128))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        img.save(tmp_path, "PNG")

    try:
        canonical_path, w, h = media_service.process_canonical_image(
            tmp_path,
            preserve_transparency=True,
            output_ext="webp",
        )
        with Image.open(canonical_path) as res_img:
            assert res_img.mode == "RGBA"
    finally:
        tmp_path.unlink(missing_ok=True)
        canonical_path.unlink(missing_ok=True)


def test_canonical_image_decompression_bomb_protection(media_service):
    """Images exceeding MAX_IMAGE_PIXELS (50MP) should raise 400 Bad Request."""
    from fastapi import HTTPException
    fake_img_path = Path("fake_bomb.jpg")
    with patch("PIL.Image.open") as mock_open:
        mock_img = MagicMock()
        # 10,000 x 6,000 = 60,000,000 pixels (> 50 MP)
        mock_img.size = (10000, 6000)
        mock_open.return_value.__enter__.return_value = mock_img

        with pytest.raises(HTTPException) as exc_info:
            media_service.process_canonical_image(fake_img_path)
        assert exc_info.value.status_code == 400
        assert "dimensions exceed safety threshold" in exc_info.value.detail


# =========================================================================
# 4. DUAL-READ COMPATIBILITY
# =========================================================================

def test_dual_read_fallback(media_service, temp_storage_dir):
    """If file is not in object storage, fallback to local filesystem path."""
    # Create local legacy file
    legacy_file = temp_storage_dir / "uploads" / "legacy_report.jpg"
    legacy_file.parent.mkdir(parents=True, exist_ok=True)
    legacy_file.write_bytes(b"legacy report data")

    # get_stream should find it
    stream_res = media_service.get_stream(str(legacy_file))
    assert stream_res is not None
    stream, ctype, length = stream_res
    read_bytes = stream.read() if hasattr(stream, "read") else b"".join(stream)
    assert read_bytes == b"legacy report data"


def test_get_image_for_embedding_in_memory(media_service):
    """Verify get_image_for_embedding returns PIL.Image directly in RGB."""
    img = Image.new("RGB", (200, 200), color="yellow")
    buf = io.BytesIO()
    img.save(buf, "JPEG")
    key = "cscrs/v1/reports/1/original/embed_test.jpg"

    media_service.upload_bytes(buf.getvalue(), key, content_type="image/jpeg")

    pil_img = media_service.get_image_for_embedding(key, storage_provider="local")
    assert isinstance(pil_img, Image.Image)
    assert pil_img.size == (200, 200)
    assert pil_img.mode == "RGB"


# =========================================================================
# 5. PROFILE PHOTO LIFECYCLE (DB Commit First, Delete Old After)
# =========================================================================

def test_profile_photo_lifecycle(db_session, media_service, monkeypatch):
    """Ensure updating profile uploads to storage, updates DB, and deletes old object."""
    from fastapi import UploadFile

    user = User(
        name="Test User",
        email="testuser@cscrs.gov.in",
        phone="9876543210",
        password_hash="hashed_pw",
        role=UserRole.CITIZEN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    service = ProfileService(db_session)
    monkeypatch.setattr("services.profile_service.get_media_service", lambda: media_service)

    # 1. First upload
    img1 = Image.new("RGB", (300, 300), color="blue")
    buf1 = io.BytesIO()
    img1.save(buf1, "JPEG")
    buf1.seek(0)
    file1 = UploadFile(filename="photo1.jpg", file=buf1)
    file1.headers = {"content-type": "image/jpeg"}

    res1 = service.upload_profile_photo(user, file1)
    db_session.refresh(user)
    assert user.profile_image_object_key is not None
    assert user.profile_image_object_key.startswith("cscrs/v1/profiles/")
    assert media_service.provider.exists(user.profile_image_object_key) is True
    old_key = user.profile_image_object_key

    # 2. Replace photo
    img2 = Image.new("RGB", (300, 300), color="red")
    buf2 = io.BytesIO()
    img2.save(buf2, "PNG")
    buf2.seek(0)
    file2 = UploadFile(filename="photo2.png", file=buf2)
    file2.headers = {"content-type": "image/png"}

    res2 = service.upload_profile_photo(user, file2)
    db_session.refresh(user)
    new_key = user.profile_image_object_key

    assert new_key != old_key
    assert media_service.provider.exists(new_key) is True
    # Verify old key was safely cleaned up AFTER commit
    assert media_service.provider.exists(old_key) is False

    # 3. Delete photo
    service.delete_profile_photo(user)
    db_session.refresh(user)
    assert user.profile_image is None
    assert user.profile_image_object_key is None
    assert media_service.provider.exists(new_key) is False


# =========================================================================
# 6. SYSTEM ISSUE: VIDEO UPLOAD WITHOUT IMAGE COMPRESSION
# =========================================================================

def test_system_issue_video_uploaded_unmodified(db_session, media_service, monkeypatch):
    """Videos must NOT be processed with image compressor."""
    from fastapi import UploadFile

    user = User(
        name="Reporter",
        email="reporter@cscrs.gov.in",
        phone="9876543211",
        password_hash="pw",
        role=UserRole.CITIZEN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    service = SystemIssueService(db_session)
    monkeypatch.setattr("services.system_issue_service.get_media_service", lambda: media_service)

    # Valid MP4 binary header
    mp4_bytes = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42" + (b"\x00" * 100)
    buf = io.BytesIO(mp4_bytes)
    video_file = UploadFile(filename="pothole_leak.mp4", file=buf)
    video_file.headers = {"content-type": "video/mp4"}

    payload = SystemIssueCreate(
        title="Water pipe rupture",
        description="Major water pipe leak causing road flooding.",
        category=SystemIssueCategory.OTHER,
    )

    resp = service.submit_issue(
        reporter_id=user.id,
        data=payload,
        attachments=[video_file],
    )
    assert resp.issue_number is not None

    attachment = (
        db_session.query(SystemIssueAttachment)
        .filter(SystemIssueAttachment.original_filename == "pothole_leak.mp4")
        .first()
    )
    assert attachment is not None
    assert attachment.object_key is not None
    assert attachment.object_key.endswith(".mp4")
    assert attachment.mime_type == "video/mp4"

    # Verify binary data in storage is byte-for-byte identical (no image transcoding)
    stored_bytes = media_service.provider.get_bytes(attachment.object_key)
    assert stored_bytes == mp4_bytes


# =========================================================================
# 7. TRANSACTION COMPENSATION ROLLBACK
# =========================================================================

def test_compensating_rollback_on_db_failure(db_session, media_service, monkeypatch):
    """If DB commit fails after storage upload, uploaded object is deleted."""
    from fastapi import UploadFile

    user = User(
        name="Reporter",
        email="reporter2@cscrs.gov.in",
        phone="9876543212",
        password_hash="pw",
        role=UserRole.CITIZEN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    service = SystemIssueService(db_session)
    monkeypatch.setattr("services.system_issue_service.get_media_service", lambda: media_service)

    img = Image.new("RGB", (200, 200), color="black")
    buf = io.BytesIO()
    img.save(buf, "JPEG")
    buf.seek(0)
    img_file = UploadFile(filename="bug.jpg", file=buf)
    img_file.headers = {"content-type": "image/jpeg"}

    payload = SystemIssueCreate(
        title="Broken road issue",
        description="Detailed description of the issue.",
        category=SystemIssueCategory.OTHER,
    )

    # Force DB error on commit
    with patch.object(db_session, "commit", side_effect=RuntimeError("Simulated DB Disk Crash")):
        with pytest.raises(RuntimeError):
            service.submit_issue(reporter_id=user.id, data=payload, attachments=[img_file])

    # Verify no orphan objects exist in storage
    all_files = list(media_service.provider.base_dir.rglob("*.webp"))
    assert len(all_files) == 0
