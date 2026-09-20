export type BackendUserRole =
  | 'Citizen'
  | 'Worker'
  | 'DepartmentAdmin'
  | 'CityAdmin'
  | 'SuperAdmin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: BackendUserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

export type AuthSessionStatus =
  | 'idle'
  | 'bootstrapping'
  | 'unauthenticated'
  | 'authenticated'
  | 'refreshing'
  | 'unsupported_role'
  | 'error';

export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

export const SECURE_AUTH_KEYS = {
  ACCESS_TOKEN: 'cscrs_sec_access_token',
  REFRESH_TOKEN: 'cscrs_sec_refresh_token',
} as const;
