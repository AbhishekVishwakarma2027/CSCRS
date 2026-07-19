from services.email_service import EmailService
from templates.email_templates import EmailTemplates


class NotificationService:

    def __init__(self):
        self.email_service = EmailService()

    def send_worker_invitation(
        self,
        *,
        worker_name: str,
        worker_email: str,
        activation_link: str,
    ):

        subject, body = (
            EmailTemplates.worker_invitation(
                worker_name=worker_name,
                activation_link=activation_link,
            )
        )

        self.email_service.send_email(
            to_email=worker_email,
            subject=subject,
            body=body,
        )

    def send_department_admin_invitation(
        self,
        *,
        admin_name: str,
        admin_email: str,
        department_name: str,
        activation_link: str,
    ):

        subject, body = (
            EmailTemplates.department_admin_invitation(
                admin_name=admin_name,
                department_name=department_name,
                activation_link=activation_link,
            )
        )

        self.email_service.send_email(
            to_email=admin_email,
            subject=subject,
            body=body,
        )

    def send_city_admin_invitation(
        self,
        *,
        admin_name: str,
        admin_email: str,
        activation_link: str,
    ):

        subject, body = (
            EmailTemplates.city_admin_invitation(
                admin_name=admin_name,
                activation_link=activation_link,
            )
        )

        self.email_service.send_email(
            to_email=admin_email,
            subject=subject,
            body=body,
        )

    def send_resolution_completed_email(
        self,
        *,
        citizen_name: str,
        citizen_email: str,
        report_number: str,
        issue_type: str,
        department_name: str,
        resolved_at: str,
    ):

        subject = (
            "CSCRS | Your Civic Issue Has Been Successfully Resolved"
        )

        body = f"""
        Dear {citizen_name},

        We are pleased to inform you that the civic issue reported by you has been successfully resolved and verified by the concerned authority.

        Report Details
        ----------------------------------------
        Report Number : {report_number}
        Issue Type    : {issue_type}
        Department    : {department_name}
        Resolved On   : {resolved_at}
        Status        : Resolved
        ----------------------------------------

        You can log in to the CSCRS portal to view the complete report timeline, photographs and verification details.

        Thank you for helping improve civic infrastructure and public services.

        Regards,

        Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        self.email_service.send_email(
            to_email=citizen_email,
            subject=subject,
            body=body,
        )

    def send_email_verification_otp(
        self,
        *,
        user_name: str,
        user_email: str,
        otp: str,
        expiry_minutes: int,
    ):

        subject, body = (
            EmailTemplates.email_verification_otp(
                user_name=user_name,
                otp=otp,
                expiry_minutes=expiry_minutes,
            )
        )

        self.email_service.send_email(
            to_email=user_email,
            subject=subject,
            body=body,
        )

    def send_password_reset_otp(
        self,
        *,
        user_name: str,
        user_email: str,
        otp: str,
        expiry_minutes: int,
    ):

        subject, body = (
            EmailTemplates.password_reset_otp(
                user_name=user_name,
                otp=otp,
                expiry_minutes=expiry_minutes,
            )
        )

        self.email_service.send_email(
            to_email=user_email,
            subject=subject,
            body=body,
        )
    def send_account_activation_success(
        self,
        *,
        user_name: str,
        user_email: str,
        role_name: str,
    ):

        subject, body = (
            EmailTemplates.account_activation_success(
                user_name=user_name,
                role_name=role_name,
            )
        )

        self.email_service.send_email(
            to_email=user_email,
            subject=subject,
            body=body,
        )
    def send_account_blocked(
        self,
        *,
        user_name: str,
        user_email: str,
        block_type: str,
        reason: str,
    ):

        subject, body = (
            EmailTemplates.account_blocked(
                user_name=user_name,
                block_type=block_type,
                reason=reason,
            )
        )

        EmailService().send_email(
            to_email=user_email,
            subject=subject,
            body=body,
        )


    def send_account_unblocked(
        self,
        *,
        user_name: str,
        user_email: str,
    ):

        subject, body = (
            EmailTemplates.account_unblocked(
                user_name=user_name,
            )
        )

        EmailService().send_email(
            to_email=user_email,
            subject=subject,
            body=body,
        )