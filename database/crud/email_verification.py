from sqlalchemy.orm import Session

from database.models.email_verification import EmailVerification


class EmailVerificationCRUD:

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: int,
        otp_hash: str,
        expires_at,
    ):

        verification = EmailVerification(

            user_id=user_id,

            otp_hash=otp_hash,

            expires_at=expires_at,

        )

        db.add(verification)

        db.commit()

        db.refresh(verification)

        return verification

    @staticmethod
    def get_latest(
        db: Session,
        user_id: int,
    ):

        return (
            db.query(EmailVerification)

            .filter(
                EmailVerification.user_id == user_id,
            )

            .order_by(
                EmailVerification.id.desc(),
            )

            .first()
        )

    @staticmethod
    def save(
        db: Session,
        verification,
    ):

        db.commit()
        db.refresh(verification)

    @staticmethod
    def delete_unverified(
        db: Session,
        user_id: int,
    ):

        (
            db.query(EmailVerification)
            .filter(
                EmailVerification.user_id == user_id,
                EmailVerification.verified == False,
            )
            .delete()
        )

        db.commit()