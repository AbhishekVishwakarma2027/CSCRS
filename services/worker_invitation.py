import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from database.models.worker_invitation import WorkerInvitation
from database.crud.worker import WorkerCRUD


class WorkerInvitationService:

    from configs.config import (
    WORKER_INVITATION_EXPIRY_HOURS,
    )

    INVITATION_EXPIRY_HOURS = WORKER_INVITATION_EXPIRY_HOURS

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(
            token.encode()
        ).hexdigest()

    @classmethod
    def expiry_time(cls):
        return (
            datetime.now(timezone.utc)
            + timedelta(hours=cls.INVITATION_EXPIRY_HOURS)
        )

    @classmethod
    def create_invitation(
        cls,
        db,
        user_id: int,
    ):
        token = cls.generate_token()

        invitation = WorkerInvitation(
            user_id=user_id,
            token_hash=cls.hash_token(token),
            expires_at=cls.expiry_time(),
        )

        WorkerCRUD.create_invitation(
            db,
            invitation,
        )

        return token, invitation
    
    @classmethod
    def verify_token(
        cls,
        db,
        token: str,
    ):

        token_hash = cls.hash_token(token)

        invitation = WorkerCRUD.get_invitation_by_token_hash(
            db,
            token_hash,
        )

        if invitation is None:
            return None

        if invitation.used:
            return None

        current_time = datetime.now(timezone.utc)

        expiry_time = invitation.expires_at

        if expiry_time.tzinfo is not None:
            expiry_time = expiry_time.replace(tzinfo=None)

        if expiry_time < current_time:
            return None

        return invitation