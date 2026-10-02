import { AxiosInstance, isAxiosError } from 'axios';
import { AuthTokens, AuthUser } from '@cscrs/auth';
import { apiClient } from './client';

export interface RegisterCitizenRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export async function registerCitizen(
  data: RegisterCitizenRequest,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>('/api/v1/auth/register', data);
  return response.data;
}

export async function verifyEmail(
  data: VerifyEmailRequest,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>('/api/v1/auth/verify-email', data);
  return response.data;
}

export async function resendVerificationOtp(
  data: ResendOtpRequest,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>('/api/v1/auth/resend-otp', data);
  return response.data;
}

export function parseApiError(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
        return 'Request timed out. Please check your connection and try again.';
      }
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator as { onLine?: boolean }).onLine === false) {
        return 'Network connection unavailable. Please check your internet settings.';
      }
      return "Can't reach the server. Please check if the server is running and try again.";
    }

    const status = error.response.status;
    const data = error.response.data as { detail?: string | Array<{ msg?: string }>; message?: string } | undefined;

    if (status === 429) {
      return 'Too many requests. Please wait a few moments before trying again.';
    }

    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        if (first && typeof first.msg === 'string') {
          return first.msg;
        }
      }
    }

    if (data?.message) {
      return data.message;
    }

    if (status === 401) {
      return 'Invalid credentials or session expired. Please try again.';
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    if (status === 409) {
      return 'An account or record with these details already exists.';
    }
    if (status === 422) {
      return 'Please check your input for invalid format or missing fields.';
    }
    if (status === 423) {
      return 'Account has been temporarily locked due to too many failed attempts. Please try again later.';
    }
    if (status >= 500) {
      return 'The server encountered an error. Please try again shortly.';
    }
  }

  if (error instanceof Error) {
    const msgLower = error.message.toLowerCase();
    if (msgLower.includes('network') || msgLower.includes('offline') || msgLower.includes('failed to fetch')) {
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator as { onLine?: boolean }).onLine === false) {
        return 'Network connection unavailable. Please check your internet settings.';
      }
      return "Can't reach the server. Please check your connection and try again.";
    }
    return error.message;
  }

  return fallback;
}

export async function loginUser(
  data: LoginRequest,
  client: AxiosInstance = apiClient
): Promise<AuthTokens> {
  const params = new URLSearchParams();
  params.append('username', data.username);
  params.append('password', data.password);

  const response = await client.post<LoginResponse>(
    '/api/v1/auth/login',
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    tokenType: response.data.token_type,
    expiresIn: response.data.expires_in,
  };
}

export async function getCurrentUser(client: AxiosInstance = apiClient): Promise<AuthUser> {
  const response = await client.get<AuthUser>('/api/v1/auth/me');
  return response.data;
}

export async function refreshTokensApi(
  refreshToken: string,
  client: AxiosInstance = apiClient
): Promise<AuthTokens> {
  const response = await client.post<{
    access_token: string;
    refresh_token: string;
    token_type?: string;
    expires_in?: number;
  }>('/api/v1/auth/refresh', { refresh_token: refreshToken });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    tokenType: response.data.token_type,
    expiresIn: response.data.expires_in,
  };
}

export async function logoutApi(
  refreshToken: string,
  client: AxiosInstance = apiClient
): Promise<void> {
  try {
    await client.post('/api/v1/auth/logout', { refresh_token: refreshToken });
  } catch {
    // Best-effort logout: ignore network failures as local tokens will be cleared regardless
  }
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Initiates the forgot-password flow by sending a reset OTP to the given email.
 * Calls POST /api/v1/auth/forgot-password.
 */
export async function forgotPassword(
  payload: ForgotPasswordPayload,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>(
    '/api/v1/auth/forgot-password',
    payload
  );
  return response.data;
}

/**
 * Verifies the password reset OTP before allowing password change.
 * Calls POST /api/v1/auth/verify-reset-otp.
 */
export async function verifyResetOtp(
  payload: VerifyResetOtpPayload,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>(
    '/api/v1/auth/verify-reset-otp',
    payload
  );
  return response.data;
}

/**
 * Resets the user's password using the verified OTP.
 * Calls POST /api/v1/auth/reset-password.
 */
export async function resetPassword(
  payload: ResetPasswordPayload,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>(
    '/api/v1/auth/reset-password',
    payload
  );
  return response.data;
}

/**
 * Changes password for an authenticated session.
 * Calls POST /api/v1/auth/change-password.
 */
export async function changePassword(
  payload: ChangePasswordPayload,
  client: AxiosInstance = apiClient
): Promise<MessageResponse> {
  const response = await client.post<MessageResponse>(
    '/api/v1/auth/change-password',
    payload
  );
  return response.data;
}

