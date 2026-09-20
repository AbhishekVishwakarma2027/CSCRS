import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { resolveApiUrl, ENV } from '@cscrs/config';
import { defaultSecureTokenStore, SecureTokenStore } from '@cscrs/auth';

export interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  tokenStore?: SecureTokenStore;
  onSessionExpired?: () => void;
}

// Extend Axios internal request config to include single retry guard
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export class ApiClientManager {
  private instance: AxiosInstance;
  private tokenStore: SecureTokenStore;
  private onSessionExpiredCallback?: () => void;
  private refreshPromise: Promise<string> | null = null;

  constructor(options?: ApiClientOptions) {
    const baseURL = options?.baseURL ?? resolveApiUrl();
    const timeout = options?.timeout ?? ENV.API_TIMEOUT;

    this.tokenStore = options?.tokenStore ?? defaultSecureTokenStore;
    this.onSessionExpiredCallback = options?.onSessionExpired;

    // Build central Axios instance
    // Note: Do NOT hardcode rigid Content-Type here; Axios automatically sets
    // application/json for objects, application/x-www-form-urlencoded for URLSearchParams,
    // and multipart/form-data for FormData.
    this.instance = axios.create({
      baseURL,
      timeout,
      headers: {
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }

  public setOnSessionExpired(callback: () => void): void {
    this.onSessionExpiredCallback = callback;
  }

  public setTokenStore(store: SecureTokenStore): void {
    this.tokenStore = store;
  }

  private setupInterceptors(): void {
    // 1. Request Interceptor: Inject Bearer Token
    this.instance.interceptors.request.use(
      async (reqConfig: InternalAxiosRequestConfig) => {
        try {
          const accessToken = await this.tokenStore.getAccessToken();
          if (accessToken && !reqConfig.headers.Authorization) {
            reqConfig.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch {
          // Token retrieval failed; proceed without token
        }
        return reqConfig;
      },
      (error: AxiosError) => {
        return Promise.reject(this.sanitizeError(error));
      }
    );

    // 2. Response Interceptor: Single-Flight Refresh on HTTP 401
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

        // Pass-through conditions where we must NOT refresh:
        // 1. No request config exists
        // 2. Status is not 401 (e.g. 400, 403, 404, 409, 429)
        // 3. Request has already been retried once (_retry === true)
        // 4. Request was itself an auth refresh or login call
        if (
          !originalRequest ||
          error.response?.status !== 401 ||
          originalRequest._retry ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/login')
        ) {
          return Promise.reject(this.sanitizeError(error));
        }

        // Mark as retried to guarantee strictly one retry attempt
        originalRequest._retry = true;

        try {
          // Single-flight refresh: reuse existing in-flight promise if available
          if (!this.refreshPromise) {
            this.refreshPromise = this.performTokenRefresh();
          }

          const newAccessToken = await this.refreshPromise;

          // Update Authorization header on original request and retry
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return this.instance(originalRequest);
        } catch (refreshErr) {
          // Refresh failed; clear tokens and notify session expired
          await this.tokenStore.clearTokens();
          if (this.onSessionExpiredCallback) {
            this.onSessionExpiredCallback();
          }
          return Promise.reject(this.sanitizeError(refreshErr));
        } finally {
          this.refreshPromise = null;
        }
      }
    );
  }

  /**
   * Executes token refresh against POST /api/v1/auth/refresh.
   * Uses clean isolated axios request to avoid interceptor recursion.
   */
  private async performTokenRefresh(): Promise<string> {
    const currentRefreshToken = await this.tokenStore.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const baseURL = this.instance.defaults.baseURL;
    const response = await axios.post<{
      access_token: string;
      refresh_token: string;
      token_type?: string;
      expires_in?: number;
    }>(
      `${baseURL}/api/v1/auth/refresh`,
      { refresh_token: currentRefreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    const { access_token, refresh_token } = response.data;
    if (!access_token || !refresh_token) {
      throw new Error('Invalid refresh response from auth server');
    }

    // Save newly rotated tokens
    await this.tokenStore.setTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    return access_token;
  }

  /**
   * Strips sensitive headers (Authorization) and credentials from error logs.
   */
  private sanitizeError(error: any): any {
    if (!error) return error;
    if (error.config?.headers?.Authorization) {
      error.config.headers.Authorization = '[REDACTED]';
    }
    return error;
  }
}

// Global default instance
export const defaultApiClientManager = new ApiClientManager();
export const apiClient = defaultApiClientManager.getInstance();
