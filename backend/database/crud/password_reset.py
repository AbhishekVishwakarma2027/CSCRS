from sqlalchemy.orm import Session

from database.models.password_reset import PasswordReset


class PasswordResetCRUD:

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: int,
        otp_hash: str,
        expires_at,
    ):

        reset = PasswordReset(
            user_id=user_id,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )

        db.add(reset)
        db.commit()
        db.refresh(reset)

        return reset

    @staticmethod
    def get_latest(
        db: Session,
        user_id: int,
    ):

        return (
            db.query(PasswordReset)
            .filter(
                PasswordReset.user_id == user_id,
            )
            .order_by(
                PasswordReset.id.desc(),
            )
            .first()
        )

    @staticmethod
    def delete_unverified(
        db: Session,
        user_id: int,
    ):

        (
            db.query(PasswordReset)
            .filter(
                PasswordReset.user_id == user_id,
                PasswordReset.verified == False,
            )
            .delete()
        )

        db.commit()

    @staticmethod
    def save(
        db: Session,
        reset,
    ):

        db.commit()
        db.refresh(reset)