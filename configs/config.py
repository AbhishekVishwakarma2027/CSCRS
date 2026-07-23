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
REFRESH_TOKEN_EXPIRE_DAYS = 30

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