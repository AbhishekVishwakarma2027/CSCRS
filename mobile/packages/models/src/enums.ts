// User Roles (matches backend models)
export type UserRole =
  | 'Citizen'
  | 'Worker'
  | 'DepartmentAdmin'
  | 'CityAdmin'
  | 'SuperAdmin';

// Mobile-supported client personas for onboarding and navigation
export type MobilePersona = 'Citizen' | 'Worker';

// Supported application languages
export type AppLanguage = 'en' | 'hi';

// Report Statuses
export type ReportStatus =
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Verified'
  | 'Closed'
  | 'Cancelled'
  | 'Rejected';

// Report Priorities
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

// Worker Assignment Statuses
export type AssignmentStatus =
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled'
  | 'Rework Required';

// Verification Decisions
export type VerificationDecision = 'PASS' | 'REVIEW' | 'REJECT';

// Resolution Decisions
export type ResolutionDecision =
  | 'Fully Resolved'
  | 'Partially Resolved'
  | 'Not Resolved'
  | 'Review Required';

// Forward Request Statuses
export type ForwardRequestStatus =
  | 'Pending'
  | 'Approved By Source'
  | 'Waiting Destination'
  | 'Accepted'
  | 'Rejected'
  | 'Forwarded Again'
  | 'Cancelled';
