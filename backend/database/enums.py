from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "Citizen"
    WORKER = "Worker"

    DEPARTMENT_ADMIN = "DepartmentAdmin"
    CITY_ADMIN = "CityAdmin"

    SUPER_ADMIN = "SuperAdmin"


class ReportStatus(str, Enum):
    PENDING = "Pending"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    VERIFIED = "Verified"
    CLOSED = "Closed"
    CANCELLED = "Cancelled"
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
    IN_PROGRESS = "In Progress"
    REJECTED = "Rejected"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    REWORK_REQUIRED = "Rework Required"

class ResolutionDecision(str, Enum):
    FULLY_RESOLVED = "Fully Resolved"
    PARTIALLY_RESOLVED = "Partially Resolved"
    NOT_RESOLVED = "Not Resolved"
    REVIEW = "Review Required"

class ForwardReasonType(str, Enum):

    WRONG_AI_CLASSIFICATION = "WRONG_AI_CLASSIFICATION"

    WRONG_CITIZEN_CATEGORY = "WRONG_CITIZEN_CATEGORY"

    ADMINISTRATIVE_TRANSFER = "ADMINISTRATIVE_TRANSFER"

    DUPLICATE_DEPARTMENT = "DUPLICATE_DEPARTMENT"

    OTHER = "OTHER"

class ReportCancellationReason(str, Enum):

    DUPLICATE = "DUPLICATE"

    ALREADY_RESOLVED = "ALREADY_RESOLVED"

    NOT_A_CIVIC_ISSUE = "NOT_A_CIVIC_ISSUE"

    FALSE_REPORT = "FALSE_REPORT"

    OUTSIDE_JURISDICTION = "OUTSIDE_JURISDICTION"

    OTHER = "OTHER"

class ForwardRequestStatus(str, Enum):

    # Worker has submitted request.
    PENDING = "Pending"

    # Department Admin (Source) approved request.
    APPROVED_BY_SOURCE = "Approved By Source"

    # Waiting for destination department decision.
    WAITING_DESTINATION = "Waiting Destination"

    # Destination department accepted report.
    ACCEPTED = "Accepted"

    # Rejected either by source or destination.
    REJECTED = "Rejected"

    # Destination department forwarded again.
    FORWARDED_AGAIN = "Forwarded Again"

    # Request cancelled.
    CANCELLED = "Cancelled"
class BlockType(str, Enum):

    RETIRED = "RETIRED"

    TRANSFERRED = "TRANSFERRED"

    SUSPENDED = "SUSPENDED"

    TERMINATED = "TERMINATED"

    DISMISSED = "DISMISSED"

class SystemIssueStatus(str, Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    
class SystemIssueCategory(str, Enum):

    AUTHENTICATION = "Authentication"

    AUTHORIZATION = "Authorization"

    REPORT_SUBMISSION = "Report Submission"

    REPORT_VERIFICATION = "Report Verification"

    DUPLICATE_DETECTION = "Duplicate Detection"

    ASSIGNMENT = "Assignment"

    WORKER = "Worker"

    RESOLUTION_UPLOAD = "Resolution Upload"

    RESOLUTION_VERIFICATION = "Resolution Verification"

    TIMELINE = "Timeline"

    NOTIFICATION = "Notification"

    EMAIL = "Email"

    DASHBOARD = "Dashboard"

    SEARCH = "Search"

    FILTER = "Filter"

    PERFORMANCE = "Performance"

    UI_UX = "UI / UX"

    API = "API"

    DATABASE = "Database"

    AI_DETECTION = "AI Detection"

    GPS_EXIF = "GPS / EXIF"

    IMAGE_UPLOAD = "Image Upload"

    VIDEO_UPLOAD = "Video Upload"

    SECURITY = "Security"

    OTHER = "Other"