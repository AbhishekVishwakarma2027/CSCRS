from services.email_service import EmailService


class NotificationService:

    def __init__(self):
        self.email_service = EmailService()

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