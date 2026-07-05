import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from configs.config import (
    OTP_EXPIRY_MINUTES,
    OTP_LENGTH,
)


class OTPService:

    @staticmethod
    def generate_otp() -> str:
        digits = "0123456789"

        return "".join(
            secrets.choice(digits)
            for _ in range(OTP_LENGTH)
        )

    @staticmethod
    def hash_otp(
        otp: str,
    ) -> str:

        return hashlib.sha256(
            otp.encode()
        ).hexdigest()

    @staticmethod
    def verify_otp(
        otp: str,
        otp_hash: str,
    ) -> bool:

        return (
            OTPService.hash_otp(otp)
            == otp_hash
        )

    @staticmethod
    def expiry_time():

        return (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=OTP_EXPIRY_MINUTES
            )
        )

    @staticmethod
    def is_expired(
        expires_at,
    ) -> bool:

        # SQLite usually returns naive datetime
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        return datetime.now(timezone.utc) > expires_at