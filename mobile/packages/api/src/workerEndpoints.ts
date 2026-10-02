import { AxiosInstance } from 'axios';
import { apiClient } from './client';
import { resolveApiUrl } from '@cscrs/config';

export interface WorkerDashboardResponse {
  assigned_reports: number;
  in_progress_reports: number;
  pending_review_reports: number;
  completed_reports: number;
  today_completed_reports: number;
  average_resolution_time_hours: number;
}

export type AssignmentStatusType =
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Rework Required';

export interface WorkerAssignmentResponse {
  assignment_id: number;
  report_id: number;
  issue_type: string;
  description: string | null;
  priority: string;
  status: AssignmentStatusType | string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
  image_url: string | null;
  assigned_at: string;
  work_started_at: string | null;
}

export interface StartWorkRequest {
  latitude: number;
  longitude: number;
}

export interface StartWorkResponse {
  id: number;
  report_id: number;
  worker_id: number;
  assigned_by: number;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  work_started_at: string | null;
  work_started_latitude: number | null;
  work_started_longitude: number | null;
  status: AssignmentStatusType | string;
  remarks: string | null;
}

export type VerificationDecisionType = 'PASS' | 'REVIEW' | 'REJECT';

export interface ResolutionResponse {
  id: number;
  report_id: number;
  worker_id: number;
  remarks: string | null;
  verification_passed: boolean;
  verification_score: number | null;
  verification_decision: VerificationDecisionType | string | null;
  manual_review: boolean;
  verified_at: string | null;
  resolved_at: string;
}

export interface ForwardRequestCreate {
  reason: string;
}

export interface ForwardRequestResponse {
  id: number;
  report_id: number;
  worker_id: number;
  current_department_id: number;
  destination_department_id?: number | null;
  source_department_name?: string | null;
  destination_department_name?: string | null;
  worker_name?: string | null;
  reviewer_name?: string | null;
  reason: string;
  status: string;
  decision_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  created_at?: string | null;
}

/**
 * Resolves a media file path or relative URL to an absolute URL using the active API base URL.
 * If the input is already absolute or null/empty, returns it as-is.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = resolveApiUrl().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  if (path.startsWith('http://localhost:8000') || path.startsWith('http://127.0.0.1:8000')) {
    return path.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, base);
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Fetches the authoritative Worker Dashboard metrics.
 * Calls GET /api/v1/dashboard/worker/dashboard with Bearer token authentication.
 */
export async function getWorkerDashboard(
  client: AxiosInstance = apiClient
): Promise<WorkerDashboardResponse> {
  const response = await client.get<WorkerDashboardResponse>(
    '/api/v1/dashboard/worker/dashboard'
  );
  return response.data;
}

/**
 * Fetches the reports assigned to the current authenticated municipal worker.
 * Calls GET /api/v1/assignments/my with Bearer token authentication.
 */
export async function getMyAssignments(
  client: AxiosInstance = apiClient
): Promise<WorkerAssignmentResponse[]> {
  const response = await client.get<WorkerAssignmentResponse[]>(
    '/api/v1/assignments/my'
  );
  return response.data;
}

/**
 * Starts work on an assigned civic report after on-site GPS verification.
 * Calls POST /api/v1/assignments/{assignment_id}/start with payload { latitude, longitude }.
 */
export async function startWork(
  assignmentId: number,
  data: StartWorkRequest,
  client: AxiosInstance = apiClient
): Promise<StartWorkResponse> {
  const response = await client.post<StartWorkResponse>(
    `/api/v1/assignments/${assignmentId}/start`,
    data
  );
  return response.data;
}

/**
 * Submits resolution photo evidence and optional remarks for an in-progress assignment.
 * Calls POST /api/v1/resolutions with multipart/form-data.
 */
export async function submitResolution(
  formData: FormData,
  client: AxiosInstance = apiClient
): Promise<ResolutionResponse> {
  const response = await client.post<ResolutionResponse>(
    '/api/v1/resolutions',
    formData
  );
  return response.data;
}

/**
 * Flags an assigned civic report to be forwarded or reviewed by the department administrator.
 * Calls POST /api/v1/forward-requests/{report_id} with JSON body { reason }.
 */
export async function submitForwardRequest(
  reportId: number,
  data: ForwardRequestCreate,
  client: AxiosInstance = apiClient
): Promise<ForwardRequestResponse> {
  const response = await client.post<ForwardRequestResponse>(
    `/api/v1/forward-requests/${reportId}`,
    data
  );
  return response.data;
}

// =====================================================
// Phase 5F: Worker Notifications & Profile Editing
// =====================================================

import type {
  NotificationItem,
  UnreadNotificationCountResponse,
  ProfileData,
  UpdateProfilePayload,
} from './citizenEndpoints';
import type { MessageResponse } from './authEndpoints';

export type WorkerNotificationItem = NotificationItem;
export type WorkerProfileData = ProfileData;
export type UpdateWorkerProfilePayload = UpdateProfilePayload;

/**
 * Fetches the authenticated worker's in-app notifications.
 * Calls GET /api/v1/notifications with Bearer auth.
 */
export async function getWorkerNotifications(
  client: AxiosInstance = apiClient
): Promise<NotificationItem[]> {
  const response = await client.get<NotificationItem[]>('/api/v1/notifications');
  return response.data;
}

/**
 * Fetches the count of unread notifications for the worker.
 * Calls GET /api/v1/notifications/unread-count.
 */
export async function getWorkerUnreadNotificationCount(
  client: AxiosInstance = apiClient
): Promise<number> {
  const response = await client.get<UnreadNotificationCountResponse>(
    '/api/v1/notifications/unread-count'
  );
  return response.data.unread_count ?? 0;
}

/**
 * Marks a single worker notification as read.
 * Calls PATCH /api/v1/notifications/{notificationId}/read.
 */
export async function markWorkerNotificationRead(
  notificationId: number,
  client: AxiosInstance = apiClient
): Promise<{ success: boolean; message: string }> {
  const response = await client.patch<{ success: boolean; message: string }>(
    `/api/v1/notifications/${notificationId}/read`
  );
  return response.data;
}

/**
 * Marks all worker notifications as read.
 * Calls PATCH /api/v1/notifications/read-all.
 */
export async function markAllWorkerNotificationsRead(
  client: AxiosInstance = apiClient
): Promise<{ success: boolean; updated: number }> {
  const response = await client.patch<{ success: boolean; updated: number }>(
    '/api/v1/notifications/read-all'
  );
  return response.data;
}

/**
 * Fetches the authenticated municipal worker's full profile details.
 * Calls GET /api/v1/profile/me.
 */
export async function getWorkerProfile(
  client: AxiosInstance = apiClient
): Promise<ProfileData> {
  const response = await client.get<ProfileData>('/api/v1/profile/me');
  return response.data;
}

/**
 * Updates the authenticated worker's profile details (strictly name and/or phone).
 * Calls PATCH /api/v1/profile/me.
 */
export async function updateWorkerProfile(
  payload: UpdateProfilePayload,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.patch<MessageResponse>(
    '/api/v1/profile/me',
    payload
  );
  return response.data;
}

