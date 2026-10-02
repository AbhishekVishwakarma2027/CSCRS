import { AxiosInstance } from 'axios';
import { apiClient } from './client';
import { MessageResponse } from './authEndpoints';

export interface CitizenDashboardSummary {
  total_reports: number;
  active_reports: number;
  resolved_reports: number;
  cancelled_reports: number;
  reopened_reports: number;
}

export interface CitizenStatusStatistics {
  pending: number;
  assigned: number;
  in_progress: number;
  resolved: number;
  cancelled: number;
}

export interface CitizenRecentReport {
  report_id: number;
  report_number: string;
  issue_type: string;
  priority: string;
  status: string;
  department_name: string | null;
  created_at: string;
}

export interface CitizenDashboardResponse {
  summary: CitizenDashboardSummary;
  status_distribution: CitizenStatusStatistics;
  recent_reports: CitizenRecentReport[];
}

/**
 * Fetches the authoritative Citizen Dashboard metrics and recent reports.
 * Calls GET /api/v1/dashboard/citizen/dashboard with Bearer token authentication.
 */
export async function getCitizenDashboard(
  client: AxiosInstance = apiClient
): Promise<CitizenDashboardResponse> {
  const response = await client.get<CitizenDashboardResponse>(
    '/api/v1/dashboard/citizen/dashboard'
  );
  return response.data;
}

export interface CreateReportResponse {
  success: boolean;
  message: string;
  report_id?: number;
  report_number?: string;
  duplicate?: boolean;
  supported_existing_report?: boolean;
  already_supported?: boolean;
  status?: string;
  priority?: string;
  department?: string;
  issue_type?: string;
  created_at?: string;
  support_count?: number;
  distance?: number;
  scene_similarity?: number;
  verification?: Record<string, any>;
  ai?: Record<string, any>;
  processing_time?: number;
}

/**
 * Submits a new citizen civic report via multipart/form-data.
 * Requires an image file with valid EXIF GPS coordinates.
 * Calls POST /api/v1/report.
 */
export async function submitCitizenReport(
  formData: FormData,
  client: AxiosInstance = apiClient
): Promise<CreateReportResponse> {
  const response = await client.post<CreateReportResponse>(
    '/api/v1/report',
    formData
  );
  return response.data;
}

export interface CitizenReportListItem {
  id: number;
  report_number: string;
  issue_type: string;
  status: string;
  priority: string;
  created_at: string;
}

/**
 * Fetches the authenticated citizen's submitted reports.
 * Calls GET /api/v1/reports/my.
 */
export async function getMyReports(
  client: AxiosInstance = apiClient
): Promise<CitizenReportListItem[]> {
  const response = await client.get<CitizenReportListItem[]>(
    '/api/v1/reports/my'
  );
  return response.data;
}

/**
 * Searches the authenticated citizen's submitted reports by query string.
 * Calls GET /api/v1/reports/my/search?query={query}.
 */
export async function searchMyReports(
  query: string,
  client: AxiosInstance = apiClient
): Promise<CitizenReportListItem[]> {
  const response = await client.get<CitizenReportListItem[]>(
    '/api/v1/reports/my/search',
    {
      params: { query },
    }
  );
  return response.data;
}

// =====================================================
// Phase 4E: Report Details & Timeline
// =====================================================

export interface ReportDetailsResponse {
  id: number;
  report_number: string;
  issue_type: string;
  status: string;
  priority: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  risk_score: number;
  ai_confidence: number;
  verification_decision: string;
  verification_passed: boolean;
}

export interface TimelineEvent {
  title: string;
  description: string;
  created_at: string;
}

export interface TimelineResponse {
  report_id: number;
  report_number: string;
  status: string;
  timeline: TimelineEvent[];
}

/**
 * Fetches the authoritative details of a single report by its report number.
 * Calls GET /api/v1/reports/{report_number}.
 */
export async function getReportDetails(
  reportNumber: string,
  client: AxiosInstance = apiClient
): Promise<ReportDetailsResponse> {
  const response = await client.get<ReportDetailsResponse>(
    `/api/v1/reports/${encodeURIComponent(reportNumber)}`
  );
  return response.data;
}

/**
 * Fetches the chronological timeline of events for a report by its report ID.
 * Calls GET /api/v1/reports/{report_id}/timeline.
 */
export async function getReportTimeline(
  reportId: number,
  client: AxiosInstance = apiClient
): Promise<TimelineResponse> {
  const response = await client.get<TimelineResponse>(
    `/api/v1/reports/${reportId}/timeline`
  );
  return response.data;
}

// =====================================================
// Phase 4F: Notifications & Profile
// =====================================================

export interface NotificationItem {
  id: number;
  report_id?: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  starts_at?: string | null;
  ends_at?: string | null;
  announcement_type?: string | null;
  broadcast_id?: string | null;
}

export interface UnreadNotificationCountResponse {
  unread_count: number;
}

/**
 * Fetches the authenticated user's in-app notifications.
 * Calls GET /api/v1/notifications.
 */
export async function getNotifications(
  client: AxiosInstance = apiClient
): Promise<NotificationItem[]> {
  const response = await client.get<NotificationItem[]>('/api/v1/notifications');
  return response.data;
}

/**
 * Fetches the count of unread notifications for the authenticated user.
 * Calls GET /api/v1/notifications/unread-count.
 */
export async function getUnreadNotificationCount(
  client: AxiosInstance = apiClient
): Promise<number> {
  const response = await client.get<UnreadNotificationCountResponse>(
    '/api/v1/notifications/unread-count'
  );
  return response.data.unread_count ?? 0;
}

/**
 * Marks a single notification as read.
 * Calls PATCH /api/v1/notifications/{notification_id}/read.
 */
export async function markNotificationAsRead(
  notificationId: number,
  client: AxiosInstance = apiClient
): Promise<{ success: boolean; message: string }> {
  const response = await client.patch<{ success: boolean; message: string }>(
    `/api/v1/notifications/${notificationId}/read`
  );
  return response.data;
}

/**
 * Marks all notifications as read.
 * Calls PATCH /api/v1/notifications/read-all.
 */
export async function markAllNotificationsAsRead(
  client: AxiosInstance = apiClient
): Promise<{ success: boolean; updated: number }> {
  const response = await client.patch<{ success: boolean; updated: number }>(
    '/api/v1/notifications/read-all'
  );
  return response.data;
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  profile_image?: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  department_id?: number | null;
  department_name?: string | null;
  employee_code?: string | null;
  designation?: string | null;
  phone_extension?: string | null;
  joined_at?: string | null;
  is_available?: boolean | null;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
}

/**
 * Fetches the authenticated citizen's full profile details.
 * Calls GET /api/v1/profile/me.
 */
export async function getMyProfile(
  client: AxiosInstance = apiClient
): Promise<ProfileData> {
  const response = await client.get<ProfileData>('/api/v1/profile/me');
  return response.data;
}

/**
 * Updates the authenticated user's profile details (name and/or phone).
 * Calls PATCH /api/v1/profile/me.
 */
export async function updateMyProfile(
  payload: UpdateProfilePayload,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.patch<MessageResponse>(
    '/api/v1/profile/me',
    payload
  );
  return response.data;
}

export interface ProfilePhotoResponse {
  message: string;
  profile_image: string;
}

/**
 * Uploads a profile photo for the authenticated user.
 * Calls POST /api/v1/profile/photo with multipart/form-data.
 */
export async function uploadProfilePhoto(
  photoInput: FormData | string,
  mimeTypeOrClient?: string | AxiosInstance,
  fileName?: string,
  client: AxiosInstance = apiClient
): Promise<ProfilePhotoResponse> {
  let body: any;
  let activeClient = client;

  if (typeof photoInput === 'string') {
    const mime = typeof mimeTypeOrClient === 'string' ? mimeTypeOrClient : 'image/jpeg';
    const name = fileName || 'profile.jpg';
    const formData = new FormData();
    formData.append('photo', {
      uri: photoInput,
      type: mime,
      name: name,
    } as any);
    body = formData;
  } else {
    body = photoInput;
    if (mimeTypeOrClient && typeof mimeTypeOrClient !== 'string') {
      activeClient = mimeTypeOrClient;
    }
  }

  const response = await activeClient.post<ProfilePhotoResponse>(
    '/api/v1/profile/photo',
    body
  );
  return response.data;
}

/**
 * Deletes the profile photo for the authenticated user.
 * Calls DELETE /api/v1/profile/photo.
 */
export async function deleteProfilePhoto(
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.delete<MessageResponse>(
    '/api/v1/profile/photo'
  );
  return response.data;
}

export interface FeedbackPayload {
  rating: number;
  liked_text?: string;
  suggestion_text?: string;
}

export interface FeedbackResponse {
  message: string;
  feedback_id: number;
}

/**
 * Submits platform/redressal feedback.
 * Calls POST /api/v1/feedback.
 */
export async function submitFeedback(
  data: FeedbackPayload,
  client: AxiosInstance = apiClient
): Promise<FeedbackResponse> {
  const response = await client.post<FeedbackResponse>(
    '/api/v1/feedback',
    data
  );
  return response.data;
}

export interface SystemIssueItem {
  id: number;
  reporter_id: number;
  category: string;
  title: string;
  description: string;
  status: string;
  related_report_number?: string | null;
  created_at: string;
}

/**
 * Submits a technical platform bug/issue report.
 * Calls POST /api/v1/issues with multipart/form-data.
 */
export async function submitPlatformIssue(
  formData: FormData,
  client: AxiosInstance = apiClient
): Promise<{ message: string; issue_id: number }> {
  const response = await client.post<{ message: string; issue_id: number }>(
    '/api/v1/issues',
    formData
  );
  return response.data;
}

/**
 * Fetches platform issues submitted by the current authenticated user.
 * Calls GET /api/v1/issues/my.
 */
export async function getMyPlatformIssues(
  params?: { status?: string; category?: string; search?: string },
  client: AxiosInstance = apiClient
): Promise<SystemIssueItem[]> {
  const response = await client.get<SystemIssueItem[]>('/api/v1/issues/my', {
    params,
  });
  return response.data;
}

/**
 * Fetches an authenticated secure report image as a base64 Data URI.
 * Reuses the existing apiClient Bearer token interceptor without putting tokens in URLs.
 * Calls GET /api/v1/reports/{report_id}/image?type={type}.
 */
export async function fetchReportImageBase64(
  reportId: number,
  type: 'original' | 'annotated' | 'resolution',
  client: AxiosInstance = apiClient
): Promise<string | null> {
  try {
    const response = await client.get(`/api/v1/reports/${reportId}/image`, {
      params: { type },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    let base64 = '';
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(response.data).toString('base64');
    } else {
      const bytes = new Uint8Array(response.data);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        const byte = bytes[i];
        if (byte !== undefined) {
          binary += String.fromCharCode(byte);
        }
      }
      const globalBtoa = typeof btoa !== 'undefined' ? btoa : (globalThis as any).btoa;
      base64 = globalBtoa ? globalBtoa(binary) : '';
    }
    return `data:${contentType};base64,${base64}`;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

