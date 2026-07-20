from sqlalchemy.orm import Session

from database.models.login_audit import LoginAudit


class LoginAuditCRUD:

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: int | None,
        email: str,
        login_success: bool,
        failure_reason: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        browser: str | None = None,
        browser_version: str | None = None,
        operating_system: str | None = None,
        os_version: str | None = None,
        device_type: str | None = None,
        platform: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        role: str | None = None,
        request_path: str | None = None,
        http_method: str | None = None,
        login_source: str | None = None,
        session_id: str | None = None,
        jwt_id: str | None = None,
    ) -> LoginAudit:

        audit = LoginAudit(
            user_id=user_id,
            email=email,
            login_success=login_success,
            failure_reason=failure_reason,
            ip_address=ip_address,
            user_agent=user_agent,
            browser=browser,
            browser_version=browser_version,
            operating_system=operating_system,
            os_version=os_version,
            device_type=device_type,
            platform=platform,
            city=city,
            state=state,
            country=country,
            role=role,
            request_path=request_path,
            http_method=http_method,
            login_source=login_source,
            session_id=session_id,
            jwt_id=jwt_id,
        )

        db.add(audit)
        db.commit()
        db.refresh(audit)

        return audit

    @staticmethod
    def update_logout(
        db: Session,
        audit: LoginAudit,
        logout_at,
    ) -> LoginAudit:

        audit.logout_at = logout_at

        db.add(audit)

        db.commit()

        db.refresh(audit)

        return audit

    @staticmethod
    def get_by_id(
        db: Session,
        audit_id: int,
    ) -> LoginAudit | None:

        return (
            db.query(LoginAudit)
            .filter(LoginAudit.id == audit_id)
            .first()
        )

    @staticmethod
    def get_user_history(
        db: Session,
        user_id: int,
        limit: int = 50,
    ) -> list[LoginAudit]:

        return (
            db.query(LoginAudit)
            .filter(
                LoginAudit.user_id == user_id,
            )
            .order_by(
                LoginAudit.login_at.desc(),
            )
            .limit(limit)
            .all()
        )