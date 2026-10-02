import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not configured."
    )

# ==========================
# JWT Configuration
# ==========================

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not configured."
    )

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        60,
    )
)
REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv(
        "REFRESH_TOKEN_EXPIRE_DAYS",
        30,
    )
)

# ==========================
# Email Configuration
# ==========================

SMTP_HOST = os.getenv("SMTP_HOST")

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        587,
    )
)

SMTP_USERNAME = os.getenv("SMTP_USERNAME")

SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

MAIL_FROM = os.getenv("MAIL_FROM")

required_email_settings = [
    SMTP_HOST,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    MAIL_FROM,
]

if not all(required_email_settings):
    raise RuntimeError(
        "SMTP configuration is incomplete."
    )
# ==========================
# OTP Configuration
# ==========================

OTP_LENGTH = int(
    os.getenv(
        "OTP_LENGTH",
        6,
    )
)

OTP_EXPIRY_MINUTES = int(
    os.getenv(
        "OTP_EXPIRY_MINUTES",
        5,
    )
)

OTP_MAX_ATTEMPTS = int(
    os.getenv(
        "OTP_MAX_ATTEMPTS",
        5,
    )
)

OTP_RESEND_COOLDOWN_SECONDS = int(
    os.getenv(
        "OTP_RESEND_COOLDOWN_SECONDS",
        60,
    )
)

MAX_LOGIN_ATTEMPTS = int(
    os.getenv(
        "MAX_LOGIN_ATTEMPTS",
        5,
    )
)

ACCOUNT_LOCK_MINUTES = int(
    os.getenv(
        "ACCOUNT_LOCK_MINUTES",
        30,
    )
)

# ==========================
# Application Configuration
# ==========================

APP_BASE_URL = os.getenv("APP_BASE_URL")

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")

if not APP_BASE_URL:
    raise RuntimeError(
        "APP_BASE_URL is not configured."
    )

if not FRONTEND_BASE_URL:
    raise RuntimeError(
        "FRONTEND_BASE_URL is not configured."
    )

WORKER_INVITATION_EXPIRY_HOURS = int(
    os.getenv(
        "WORKER_INVITATION_EXPIRY_HOURS",
        24,
    )
)

# Duplicate report detection
DUPLICATE_REPORT_RADIUS_METERS = float(
    os.getenv(
        "DUPLICATE_REPORT_RADIUS_METERS",
        8,
    )
)

# Duplicate scene detection
DUPLICATE_ENABLE_SCENE_CHECK = (
    os.getenv(
        "DUPLICATE_ENABLE_SCENE_CHECK",
        "True",
    ).lower()
    == "true"
)

# OpenCLIP cosine similarity threshold
DUPLICATE_SCENE_THRESHOLD = float(
    os.getenv(
        "DUPLICATE_SCENE_THRESHOLD",
        0.82,
    )
)


START_WORK_RADIUS_METERS = float(
    os.getenv(
        "START_WORK_RADIUS_METERS",
        30,
    )
)
# ==========================
# Dashboard
# ==========================

DASHBOARD_RECENT_REPORT_LIMIT = 5

DASHBOARD_RECENT_NOTIFICATION_LIMIT = 5

DASHBOARD_RECENT_TIMELINE_LIMIT = 5

DEFAULT_AVERAGE_RESOLUTION_TIME = 0.0

DEFAULT_AUTOMATION_RATE = 0.0

DEFAULT_AI_ACCEPTED = 0

DEFAULT_MANUAL_REVIEW = 0

MAX_PAGE_SIZE_LIMIT=100

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

LOG_MAX_SIZE_MB = int(
    os.getenv(
        "LOG_MAX_SIZE_MB",
        10,
    )
)

LOG_BACKUP_COUNT = int(
    os.getenv(
        "LOG_BACKUP_COUNT",
        5,
    )
)

ENABLE_API_DOCS = os.getenv(
    "ENABLE_API_DOCS",
    "True",
).lower() == "true"

# ==========================
# Data Retention Configuration
# ==========================

LOGIN_AUDIT_RETENTION_DAYS = int(
    os.getenv(
        "LOGIN_AUDIT_RETENTION_DAYS",
        180,
    )
)

NOTIFICATION_RETENTION_DAYS = int(
    os.getenv(
        "NOTIFICATION_RETENTION_DAYS",
        90,
    )
)

NOTIFICATION_MAX_UNREAD_RETENTION_DAYS = int(
    os.getenv(
        "NOTIFICATION_MAX_UNREAD_RETENTION_DAYS",
        365,
    )
)

REFRESH_TOKEN_RETENTION_DAYS = int(
    os.getenv(
        "REFRESH_TOKEN_RETENTION_DAYS",
        0,
    )
)

RETENTION_BATCH_SIZE = int(
    os.getenv(
        "RETENTION_BATCH_SIZE",
        1000,
    )
)

ENABLE_RETENTION_SCHEDULER = (
    os.getenv(
        "ENABLE_RETENTION_SCHEDULER",
        "False",
    ).lower()
    == "true"
)

RETENTION_SCHEDULER_INTERVAL_HOURS = int(
    os.getenv(
        "RETENTION_SCHEDULER_INTERVAL_HOURS",
        24,
    )
)

# ==========================
# Object Storage Configuration
# ==========================

OBJECT_STORAGE_PROVIDER = os.getenv(
    "OBJECT_STORAGE_PROVIDER",
    "local",
).lower()

OCI_OBJECT_STORAGE_REGION = os.getenv("OCI_OBJECT_STORAGE_REGION", "ap-mumbai-1")
OCI_OBJECT_STORAGE_NAMESPACE = os.getenv("OCI_OBJECT_STORAGE_NAMESPACE", "bmv2paypbavo")
OCI_OBJECT_STORAGE_BUCKET = os.getenv("OCI_OBJECT_STORAGE_BUCKET", "cscrs-storage")

OCI_OBJECT_STORAGE_TENANCY_OCID = os.getenv("OCI_OBJECT_STORAGE_TENANCY_OCID")
OCI_OBJECT_STORAGE_USER_OCID = os.getenv("OCI_OBJECT_STORAGE_USER_OCID")
OCI_OBJECT_STORAGE_FINGERPRINT = os.getenv("OCI_OBJECT_STORAGE_FINGERPRINT")
OCI_OBJECT_STORAGE_KEY_FILE = os.getenv("OCI_OBJECT_STORAGE_KEY_FILE")
OCI_OBJECT_STORAGE_KEY_PASSPHRASE = os.getenv("OCI_OBJECT_STORAGE_KEY_PASSPHRASE")

OBJECT_STORAGE_PREFIX = os.getenv(
    "OBJECT_STORAGE_PREFIX",
    "cscrs/v1",
).strip("/")

MEDIA_SERVING_MODE = os.getenv(
    "MEDIA_SERVING_MODE",
    "stream",
).lower()

MEDIA_PAR_EXPIRES_SECONDS = int(
    os.getenv(
        "MEDIA_PAR_EXPIRES_SECONDS",
        900,
    )
)

CANONICAL_IMAGE_MAX_DIMENSION = int(
    os.getenv(
        "CANONICAL_IMAGE_MAX_DIMENSION",
        2048,
    )
)

CANONICAL_IMAGE_WEBP_QUALITY = int(
    os.getenv(
        "CANONICAL_IMAGE_WEBP_QUALITY",
        85,
    )
)

CANONICAL_IMAGE_MAX_PIXELS = int(
    os.getenv(
        "CANONICAL_IMAGE_MAX_PIXELS",
        50_000_000,
    )
)

if OBJECT_STORAGE_PROVIDER == "oci":
    oci_required_settings = [
        ("OCI_OBJECT_STORAGE_REGION", OCI_OBJECT_STORAGE_REGION),
        ("OCI_OBJECT_STORAGE_NAMESPACE", OCI_OBJECT_STORAGE_NAMESPACE),
        ("OCI_OBJECT_STORAGE_BUCKET", OCI_OBJECT_STORAGE_BUCKET),
        ("OCI_OBJECT_STORAGE_TENANCY_OCID", OCI_OBJECT_STORAGE_TENANCY_OCID),
        ("OCI_OBJECT_STORAGE_USER_OCID", OCI_OBJECT_STORAGE_USER_OCID),
        ("OCI_OBJECT_STORAGE_FINGERPRINT", OCI_OBJECT_STORAGE_FINGERPRINT),
        ("OCI_OBJECT_STORAGE_KEY_FILE", OCI_OBJECT_STORAGE_KEY_FILE),
    ]
    missing_oci = [name for name, val in oci_required_settings if not val]
    if missing_oci:
        raise RuntimeError(
            f"OCI Object Storage configuration is incomplete. Missing: {', '.join(missing_oci)}"
        )
    if not os.path.isfile(OCI_OBJECT_STORAGE_KEY_FILE):
        raise RuntimeError(
            f"OCI Object Storage private key file not found: {OCI_OBJECT_STORAGE_KEY_FILE}"
        )
