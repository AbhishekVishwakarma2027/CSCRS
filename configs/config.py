import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# ==========================
# JWT Configuration
# ==========================

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        60,
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

SMTP_PORT = 587
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