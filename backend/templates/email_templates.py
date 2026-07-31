class EmailTemplates:

    @staticmethod
    def worker_invitation(
        *,
        worker_name: str,
        activation_link: str,
    ):

        subject = (
            "Activate your CSCRS Worker Account"
        )

        body = f"""
        Hello {worker_name},

        You have been invited to join the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS) as a Worker.

        Please activate your account using the link below:

        {activation_link}

        This activation link is valid for 24 hours.

        If you were not expecting this invitation, you may safely ignore this email.

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        return subject, body
    
    @staticmethod
    def department_admin_invitation(
        *,
        admin_name: str,
        department_name: str,
        activation_link: str,
    ):

        subject = (
            "Activate your CSCRS Department Admin Account"
        )

        body = f"""
        Hello {admin_name},

        You have been appointed as the Department Administrator for the {department_name} department in the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS).

        Please activate your account using the link below:

        {activation_link}

        This activation link is valid for 24 hours.

        If you were not expecting this invitation, you may safely ignore this email.

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        return subject, body
    
    @staticmethod
    def email_verification_otp(
            *,
            user_name: str,
            otp: str,
            expiry_minutes: int,
        ):

            subject = (
                "Verify Your Email Address - CSCRS"
            )

            body = f"""
    Hello {user_name},

    Welcome to the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS).

    Your One-Time Password (OTP) for email verification is:

    ==================================================
    OTP : {otp}
    ==================================================

    This OTP is valid for {expiry_minutes} minutes.

    Security Notice:
    • Never share this OTP with anyone.
    • CSCRS will never ask for your OTP.

    If you did not create this account, please ignore this email.

    Regards,

    Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
    Government of Uttar Pradesh
    """

            return subject, body

    @staticmethod
    def password_reset_otp(
        *,
        user_name: str,
        otp: str,
        expiry_minutes: int,
    ):

        subject = (
            "Reset Your CSCRS Password"
        )

        body = f"""
        Hello {user_name},

        We received a request to reset your CSCRS account password.

        Your One-Time Password (OTP) is:

        ==================================================
        OTP : {otp}
        ==================================================

        This OTP is valid for {expiry_minutes} minutes.

        If you did not request a password reset, you can safely ignore this email.

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        return subject, body
    
    @staticmethod
    def city_admin_invitation(
        *,
        admin_name: str,
        activation_link: str,
    ):

        subject = (
            "Activate your CSCRS City Administrator Account"
        )

        body = f"""
        Hello {admin_name},

        You have been appointed as a City Administrator in the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS).

        As a City Administrator, you will oversee city-wide civic issue management, monitor departments, and ensure timely resolution of public complaints.

        Please activate your account using the secure activation link below:

        {activation_link}

        This activation link is valid for 24 hours.

        Security Notice:
        • Do not share this activation link with anyone.
        • If you were not expecting this invitation, please ignore this email.

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """
        return subject, body
    
    @staticmethod
    def account_activation_success(
        *,
        user_name: str,
        role_name: str,
    ):

        subject = (
            "Your CSCRS Account Has Been Activated"
        )

        body = f"""
        Hello {user_name},

        Congratulations!

        Your CSCRS {role_name} account has been successfully activated.

        You can now securely sign in and access the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS).

        For your security:

        • Never share your password.
        • Always log out from shared devices.
        • Contact the system administrator if you notice any suspicious activity.

        Thank you for being a part of CSCRS.

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        return subject, body
    @staticmethod
    def account_blocked(
        *,
        user_name: str,
        block_type: str,
        reason: str,
    ):

        subject = (
            "Your CSCRS Account Has Been Blocked"
        )

        body = f"""
        Hello {user_name},

        Your CSCRS account has been blocked by the City Administration.

        Status:
        ------------------------------------------------
        {block_type}
        ------------------------------------------------

        Reason:
        ------------------------------------------------
        {reason}
        ------------------------------------------------

        As a result:

        • You cannot sign in to your account.
        • Access to the CSCRS platform has been temporarily disabled.

        If you believe this action was taken in error, please contact CSCRS Support.

        Support Email:
        support@cscrs.gov.in

        Helpline:
        1800-XXXX-XXX

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        return subject, body


    @staticmethod
    def account_unblocked(
        *,
        user_name: str,
    ):

        subject = (
            "Your CSCRS Account Has Been Restored"
        )

        body = f"""
        Hello {user_name},

        Your CSCRS account has been restored by the City Administration.

        You can now sign in and continue using the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS).

        If you continue experiencing any issues, please contact CSCRS Support.

        Support Email:
        support@cscrs.gov.in

        Helpline:
        1800-XXXX-XXX

        Regards,

        Crowdsourced Civic Issue Reporting & Resolution System (CSCRS)
        Government of Uttar Pradesh
        """

        return subject, body
    @staticmethod
    def resolution_completed(
        *,
        citizen_name: str,
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

        return subject, body