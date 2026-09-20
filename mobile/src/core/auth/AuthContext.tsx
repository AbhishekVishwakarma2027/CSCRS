import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  AuthSessionStatus,
  AuthTokens,
  AuthUser,
  BackendUserRole,
  defaultSecureTokenStore,
  SecureTokenStore,
} from '@cscrs/auth';
import {
  getCurrentUser,
  logoutApi,
  defaultApiClientManager,
} from '@cscrs/api';
import { getStoredRole } from '@cscrs/storage';

export interface InitSessionResult {
  status: AuthSessionStatus;
  role?: BackendUserRole;
}

export interface AuthContextType {
  status: AuthSessionStatus;
  user: AuthUser | null;
  unsupportedRole: BackendUserRole | null;
  roleMismatchNotice: string | null;
  initializeSession: () => Promise<InitSessionResult>;
  loginWithTokens: (tokens: AuthTokens) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  tokenStore?: SecureTokenStore;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  tokenStore = defaultSecureTokenStore,
}) => {
  const [status, setStatus] = useState<AuthSessionStatus>('idle');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unsupportedRole, setUnsupportedRole] = useState<BackendUserRole | null>(null);
  const [roleMismatchNotice, setRoleMismatchNotice] = useState<string | null>(null);

  const tokenStoreRef = useRef(tokenStore);
  tokenStoreRef.current = tokenStore;

  // Listen for refresh expiration from central API client
  useEffect(() => {
    defaultApiClientManager.setOnSessionExpired(() => {
      setUser(null);
      setUnsupportedRole(null);
      setStatus('unauthenticated');
    });
  }, []);

  /**
   * Initializes authentication session.
   * STRICT CONSTRAINT: Called ONLY when onboarding is confirmed complete.
   * If no tokens exist, immediately marks unauthenticated without network calls.
   */
  const initializeSession = useCallback(async (): Promise<InitSessionResult> => {
    try {
      const hasTokens = await tokenStoreRef.current.hasSession();
      if (!hasTokens) {
        setUser(null);
        setUnsupportedRole(null);
        setRoleMismatchNotice(null);
        setStatus('unauthenticated');
        return { status: 'unauthenticated' };
      }

      setStatus('bootstrapping');

      // Call GET /api/v1/auth/me (Axios interceptor will inject Bearer and auto-refresh if 401)
      const userData = await getCurrentUser();

      // Enforce backend role authority
      if (userData.role === 'Citizen' || userData.role === 'Worker') {
        setUser(userData);
        setUnsupportedRole(null);
        setStatus('authenticated');

        // Check for role preference mismatch
        const preferredRole = await getStoredRole();
        if (preferredRole && preferredRole !== userData.role) {
          setRoleMismatchNotice(
            `Authenticated as official ${userData.role}. Local preference was ${preferredRole}.`
          );
        } else {
          setRoleMismatchNotice(null);
        }

        return { status: 'authenticated', role: userData.role };
      }

      // Administrative roles outside mobile personas (DepartmentAdmin, CityAdmin, SuperAdmin)
      setUser(userData);
      setUnsupportedRole(userData.role);
      setStatus('unsupported_role');
      return { status: 'unsupported_role', role: userData.role };
    } catch {
      // Session invalid or refresh failed: clear tokens and set unauthenticated
      await tokenStoreRef.current.clearTokens();
      setUser(null);
      setUnsupportedRole(null);
      setRoleMismatchNotice(null);
      setStatus('unauthenticated');
      return { status: 'unauthenticated' };
    }
  }, []);

  /**
   * Completes login flow once tokens are received from POST /api/v1/auth/login.
   * 1. Stores access & refresh tokens in SecureTokenStore.
   * 2. Calls GET /api/v1/auth/me to verify user identity & role authoritatively.
   * 3. If /me fails or token storage fails, performs strict rollback:
   *    clears tokens, remains unauthenticated, and throws the error.
   * 4. If /me returns admin role (DepartmentAdmin, CityAdmin, SuperAdmin),
   *    sets status to 'unsupported_role' (NEVER downcasts to Citizen).
   */
  const loginWithTokens = useCallback(
    async (tokens: AuthTokens): Promise<AuthUser> => {
      // Step 1: Secure token persistence
      try {
        await tokenStoreRef.current.setTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      } catch (storeErr) {
        // Storage failed: cleanup any partial state, remain unauthenticated, rethrow
        await tokenStoreRef.current.clearTokens().catch(() => {});
        setUser(null);
        setUnsupportedRole(null);
        setStatus('unauthenticated');
        throw new Error(
          'Failed to securely store authentication session. Please try again.'
        );
      }

      // Step 2: Authoritative identity & role resolution via GET /api/v1/auth/me
      let userData: AuthUser;
      try {
        userData = await getCurrentUser();
      } catch (meErr) {
        // Rollback safety: if /me fails after tokens were stored,
        // clear newly stored tokens immediately, reset state, and rethrow
        await tokenStoreRef.current.clearTokens().catch(() => {});
        setUser(null);
        setUnsupportedRole(null);
        setStatus('unauthenticated');
        throw meErr;
      }

      // Step 3: Role safety & session activation
      if (userData.role === 'Citizen' || userData.role === 'Worker') {
        setUser(userData);
        setUnsupportedRole(null);
        setStatus('authenticated');

        const preferredRole = await getStoredRole();
        if (preferredRole && preferredRole !== userData.role) {
          setRoleMismatchNotice(
            `Authenticated as official ${userData.role}. Local preference was ${preferredRole}.`
          );
        } else {
          setRoleMismatchNotice(null);
        }
      } else {
        // Administrative roles: never downcast to Citizen
        setUser(userData);
        setUnsupportedRole(userData.role);
        setStatus('unsupported_role');
      }

      return userData;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await tokenStoreRef.current.getRefreshToken();
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch {
      // Best-effort logout
    } finally {
      await tokenStoreRef.current.clearTokens();
      setUser(null);
      setUnsupportedRole(null);
      setRoleMismatchNotice(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        unsupportedRole,
        roleMismatchNotice,
        initializeSession,
        loginWithTokens,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthSession = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within an AuthProvider');
  }
  return context;
};
