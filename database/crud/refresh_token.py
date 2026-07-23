from datetime import datetime, timezone

from sqlalchemy.orm import Session

from database.models.refresh_token import RefreshToken


class RefreshTokenCRUD:

    @staticmethod
    def create(
        db: Session,
        **kwargs,
    ) -> RefreshToken:

        token = RefreshToken(
            **kwargs,
        )

        db.add(token)

        db.flush()

        db.refresh(token)

        return token

    @staticmethod
    def get_by_token_hash(
        db: Session,
        token_hash: str,
    ) -> RefreshToken | None:

        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
            .first()
        )
    @staticmethod
    def get_any_by_token_hash(
        db: Session,
        token_hash: str,
    ) -> RefreshToken | None:

        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
            )
            .first()
        )
    @staticmethod
    def get_by_session_id(
        db: Session,
        session_id: str,
    ):

        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.session_id == session_id,
            )
            .all()
        )

    @staticmethod
    def revoke_token(
        db: Session,
        token: RefreshToken,
        reason: str = "LOGOUT",
    ):

        token.revoked_at = datetime.now(
            timezone.utc,
        )

        token.revoked_reason = reason

        db.flush()

    @staticmethod
    def revoke_session(
        db: Session,
        session_id: str,
        reason: str = "SESSION_REVOKED",
    ):

        tokens = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.session_id == session_id,
                RefreshToken.revoked_at.is_(None),
            )
            .all()
        )

        now = datetime.now(
            timezone.utc,
        )

        for token in tokens:

            token.revoked_at = now

            token.revoked_reason = reason

        db.flush()

    @staticmethod
    def revoke_all_user_tokens(
        db: Session,
        user_id: int,
        reason: str = "LOGOUT_ALL",
    ):

        tokens = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .all()
        )

        now = datetime.now(
            timezone.utc,
        )

        for token in tokens:

            token.revoked_at = now

            token.revoked_reason = reason

        db.flush()
    @staticmethod
    def get_active_sessions(
        db: Session,
        user_id: int,
    ):

        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
            .order_by(
                RefreshToken.last_used_at.desc().nullslast(),
                RefreshToken.created_at.desc(),
            )
            .all()
        )
    @staticmethod
    def update_last_used(
        db: Session,
        token: RefreshToken,
    ):

        token.last_used_at = datetime.now(
            timezone.utc,
        )

        db.flush()

    @staticmethod
    def delete_expired(
        db: Session,
    ):

        (
            db.query(RefreshToken)
            .filter(
                RefreshToken.expires_at
                < datetime.now(timezone.utc),
            )
            .delete(
                synchronize_session=False,
            )
        )

        db.flush()