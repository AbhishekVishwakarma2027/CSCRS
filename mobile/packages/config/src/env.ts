import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface AppEnvironment {
  ENV: EnvironmentType;
  API_URL: string;
  API_TIMEOUT: number;
  IS_DEV: boolean;
  IS_STAGING: boolean;
  IS_PROD: boolean;
  PLATFORM: string;
}

export const resolveEnvType = (raw?: string): EnvironmentType => {
  if (raw === 'production') return 'production';
  if (raw === 'staging') return 'staging';
  return 'development';
};

export const resolveApiPort = (raw?: string): number => {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return !isNaN(parsed) && parsed > 0 ? parsed : 8000;
};

/**
 * Resolves the backend API URL dynamically based on environment, platform,
 * and developer configuration:
 * 1. Production -> https://api.cscrs.in
 * 2. Staging -> https://staging-api.cscrs.in
 * 3. Development:
 *    a. Explicit custom EXPO_PUBLIC_API_URL (if not generic localhost)
 *    b. Explicit developer LAN host via EXPO_PUBLIC_DEV_HOST / EXPO_PUBLIC_LAN_HOST
 *    c. Auto-detected LAN IP from Expo Metro hostUri (for physical devices)
 *    d. Android Emulator -> http://10.0.2.2:8000
 *    e. iOS Simulator / Web -> http://127.0.0.1:8000
 */
export const PRODUCTION_API_URL = 'https://api.cscrs.in';
export const STAGING_API_URL = 'https://staging-api.cscrs.in';

export const resolveApiUrl = (
  envType: EnvironmentType = resolveEnvType(process.env['EXPO_PUBLIC_ENV'])
): string => {
  const explicitUrl = process.env['EXPO_PUBLIC_API_URL']?.trim();

  // Production: MUST strictly resolve to https://api.cscrs.in.
  // Local .env.local development URLs (e.g. Cloudflare tunnels or localhost)
  // must never silently override production builds.
  if (envType === 'production') {
    return PRODUCTION_API_URL;
  }

  // Staging
  if (envType === 'staging') {
    return explicitUrl && explicitUrl.length > 0
      ? explicitUrl.replace(/\/+$/, '')
      : 'https://staging-api.cscrs.in';
  }

  // Development: If explicitly provided and not default 127.0.0.1, honor it
  if (
    explicitUrl &&
    explicitUrl.length > 0 &&
    !explicitUrl.includes('127.0.0.1') &&
    !explicitUrl.includes('localhost')
  ) {
    return explicitUrl.replace(/\/+$/, '');
  }

  const port = resolveApiPort(process.env['EXPO_PUBLIC_API_PORT']);

  // Developer-configured LAN host (e.g. 192.168.1.50)
  const configuredHost =
    process.env['EXPO_PUBLIC_DEV_HOST']?.trim() ||
    process.env['EXPO_PUBLIC_LAN_HOST']?.trim();

  if (configuredHost) {
    return `http://${configuredHost}:${port}`;
  }

  // Auto-detect LAN IP from Metro when running on physical device
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${port}`;
    }
  }

  // Platform-specific emulator / simulator defaults
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  return `http://127.0.0.1:${port}`;
};

export const resolveTimeout = (raw?: string): number => {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return !isNaN(parsed) && parsed > 0 ? parsed : 15000;
};

const currentEnvType = resolveEnvType(process.env['EXPO_PUBLIC_ENV']);

export const ENV: AppEnvironment = {
  ENV: currentEnvType,
  API_URL: resolveApiUrl(currentEnvType),
  API_TIMEOUT: resolveTimeout(process.env['EXPO_PUBLIC_API_TIMEOUT']),
  IS_DEV: currentEnvType === 'development',
  IS_STAGING: currentEnvType === 'staging',
  IS_PROD: currentEnvType === 'production',
  PLATFORM: Platform.OS,
};
