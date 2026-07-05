DATABASE_URL = "sqlite:///./cscrs.db"

# ==========================
# JWT Configuration
# ==========================

SECRET_KEY = "CHANGE_THIS_TO_A_RANDOM_64_CHARACTER_SECRET_BEFORE_PRODUCTION"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ==========================
# Email Configuration
# ==========================

SMTP_HOST = "smtp.gmail.com"

SMTP_PORT = 587

# TODO:
# Move SMTP credentials to .env
# before production deployment.
SMTP_USERNAME = "abhishek34656srmu@gmail.com"

SMTP_PASSWORD = "soihoxzmuwlukwvb"

MAIL_FROM = "abhishek34656srmu@gmail.com"

# ==========================
# OTP Configuration
# ==========================

OTP_LENGTH = 6

OTP_EXPIRY_MINUTES = 5

OTP_MAX_ATTEMPTS = 5

OTP_RESEND_COOLDOWN_SECONDS = 60