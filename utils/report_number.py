import uuid
from datetime import datetime


def generate_report_number():

    date = datetime.now().strftime("%Y%m%d")

    unique = uuid.uuid4().hex[:8].upper()

    return f"CSCRS-{date}-{unique}"

def generate_issue_number(
    issue_id: int,
) -> str:

    date = datetime.now().strftime("%Y%m%d")

    unique = uuid.uuid4().hex[:8].upper()

    return f"ISS-{date}-{unique}"