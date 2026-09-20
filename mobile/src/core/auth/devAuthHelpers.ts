import { defaultSecureTokenStore } from '@cscrs/auth';
import { resetOnboardingPreferences } from '@cscrs/storage';

/**
 * DEVELOPMENT-ONLY helpers for testing authentication transitions.
 * These utilities are strictly dead-code eliminated in production builds via __DEV__.
 */

export async function devSetMockTokens(
  mockRole: 'Citizen' | 'Worker' | 'SuperAdmin'
): Promise<void> {
  if (!__DEV__) return;

  // Set mock access and refresh tokens in SecureTokenStore
  await defaultSecureTokenStore.setTokens({
    accessToken: `mock_access_token_${mockRole.toLowerCase()}`,
    refreshToken: `mock_refresh_token_${mockRole.toLowerCase()}`,
  });
}

export async function devClearAuthAndStorage(): Promise<void> {
  if (!__DEV__) return;

  await defaultSecureTokenStore.clearTokens();
  await resetOnboardingPreferences();
}
