import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


from services.email_service import EmailService

EmailService().send_email(
    to_email="av828792@gmail.com",
    subject="CSCRS SMTP Test",
    body="SMTP Working Successfully!",
)

print("Email Sent Successfully.")