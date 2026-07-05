import smtplib
from email.message import EmailMessage
import socket
from configs.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    MAIL_FROM,
)


class EmailService:

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
    ):

        message = EmailMessage()

        message["Subject"] = subject
        message["From"] = MAIL_FROM
        message["To"] = to_email

        message.set_content(body)
        try: 
            with smtplib.SMTP(
                SMTP_HOST,
                SMTP_PORT,
                timeout=20,
            ) as smtp:

                smtp.ehlo()
                smtp.starttls()
                smtp.ehlo()

                smtp.login(
                    SMTP_USERNAME,
                    SMTP_PASSWORD,
                )

                smtp.send_message(message)
        except (
            smtplib.SMTPException,
            socket.timeout,
        ) as e:

            raise RuntimeError(
                f"Email sending failed: {e}"

            )