from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "Citizen"
    WORKER = "Worker"
    ADMIN = "Admin"
    SUPERVISOR = "Supervisor"
    SUPER_ADMIN = "SuperAdmin"


class ReportStatus(str, Enum):
    PENDING = "Pending"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    VERIFIED = "Verified"
    CLOSED = "Closed"
    REJECTED = "Rejected"


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class ImageType(str, Enum):
    ORIGINAL = "Original"
    ANNOTATED = "Annotated"
    RESOLUTION = "Resolution"


class VerificationDecision(str, Enum):
    PASS = "PASS"
    REVIEW = "REVIEW"
    REJECT = "REJECT"

class AssignmentStatus(str, Enum):
    ASSIGNED = "Assigned"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"