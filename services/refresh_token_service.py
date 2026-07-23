from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from authentication.security import (
    decode_access_token,
    hash_refresh_token,
)

from database.crud.refresh_token import RefreshTokenCRUD
from datetime import datetime, timedelta, timezone

from authentication.security import (
    create_access_token_with_metadata,
    create_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from database.crud.user import UserCRUD
from schemas.user import TokenResponse

class RefreshTokenService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def validate_refresh_token(
        self,
        refresh_token: str,
    ):

        payload = decode_access_token(
            refresh_token,
        )

        if payload.get("type") != "refresh":

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        token_hash = hash_refresh_token(
            refresh_token,
        )
        stored_token = RefreshTokenCRUD.get_any_by_token_hash(
            self.db,
            token_hash,
        )

        if (
            stored_token is not None
            and stored_token.revoked_at is not None
        ):

            RefreshTokenCRUD.revoke_session(
                db=self.db,
                session_id=stored_token.session_id,
                reason="TOKEN_REUSE_DETECTED",
            )

            self.db.commit()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been revoked. Please login again.",
            )
        db_token = RefreshTokenCRUD.get_by_token_hash(
            self.db,
            token_hash,
        )

        if db_token is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found or revoked.",
            )

        return payload, db_token
    
    def refresh(
        self,
        refresh_token: str,
    ):

        payload, db_token = self.validate_refresh_token(
            refresh_token,
        )
        user_id = int(payload["sub"])

        user = UserCRUD.get_by_id(
            self.db,
            user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found.",
            )

        if not user.is_active:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive.",
            )

        if user.is_blocked:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been blocked.",
            )
        access_data = create_access_token_with_metadata(
            {
                "sub": str(user.id),
                "role": user.role.value,
            }
        )

        refresh_data = create_refresh_token(
            data={
                "sub": str(user.id),
                "role": user.role.value,
            },
            session_id=db_token.session_id,
        )

        refresh_token_hash = hash_refresh_token(
            refresh_data["refresh_token"],
        )
        try:

            RefreshTokenCRUD.update_last_used(
                db=self.db,
                token=db_token,
            )
            RefreshTokenCRUD.revoke_token(
                db=self.db,
                token=db_token,
                reason="ROTATED",
            )
            RefreshTokenCRUD.create(
                db=self.db,
                user_id=user.id,
                token_hash=refresh_token_hash,
                jwt_id=refresh_data["jwt_id"],
                session_id=refresh_data["session_id"],
                ip_address=db_token.ip_address,
                device_type=db_token.device_type,
                browser=db_token.browser,
                operating_system=db_token.operating_system,
                expires_at=datetime.now(timezone.utc)
                + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            )

            self.db.commit()

        except Exception:

            self.db.rollback()

            raise
        return TokenResponse(
            access_token=access_data["access_token"],
            refresh_token=refresh_data["refresh_token"],
            token_type="bearer",
            expires_in=1800,
        )
    
    def logout(
        self,
        refresh_token: str,
    ):

        _, db_token = self.validate_refresh_token(
            refresh_token,
        )

        try:

            RefreshTokenCRUD.revoke_token(
                db=self.db,
                token=db_token,
                reason="LOGOUT",
            )

            self.db.commit()

        except Exception:

            self.db.rollback()

            raise

        return {
            "message": "Logged out successfully.",
        }
    def logout_all(
        self,
        user_id: int,
    ):

        try:

            RefreshTokenCRUD.revoke_all_user_tokens(
                db=self.db,
                user_id=user_id,
                reason="LOGOUT_ALL",
            )

            self.db.commit()

        except Exception:

            self.db.rollback()

            raise

        return {
            "message": "Logged out from all devices successfully.",
        }
    def get_active_sessions(
        self,
        user_id: int,
    ):

        sessions = RefreshTokenCRUD.get_active_sessions(
            self.db,
            user_id,
        )

        return sessions