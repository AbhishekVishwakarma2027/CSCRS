import { apiClient } from '@/services/api'
import type { TokenResponse, UserProfile } from '@/types/auth.types'

export interface MessageResponse {
  message: string
}

export const authService = {
  /**
   * Authenticate user credentials.
   * Expects standard OAuth2 form payload values encoded as application/x-www-form-urlencoded.
   */
  async login(username: string, password: string): Promise<TokenResponse> {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    const { data } = await apiClient.post<TokenResponse>('/api/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return data
  },

  /**
   * Rotate the refresh token to obtain a fresh access token.
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },

  /**
   * Revoke active refresh token session on the backend.
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/api/v1/auth/logout', {
      refresh_token: refreshToken,
    })
  },

  /**
   * Fetch details of the active authenticated user profile.
   */
  async getCurrentUser(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/api/v1/auth/me')
    return data
  },

  /**
   * Initiate password recovery process.
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/api/v1/auth/forgot-password', {
      email,
    })
    return data
  },

  /**
   * Verify password reset OTP code.
   */
  async verifyResetOtp(email: string, otp: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/api/v1/auth/verify-reset-otp', {
      email,
      otp,
    })
    return data
  },

  /**
   * Reset user password using the verified OTP code.
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/api/v1/auth/reset-password', {
      email,
      otp,
      new_password: newPassword,
    })
    return data
  },
}
