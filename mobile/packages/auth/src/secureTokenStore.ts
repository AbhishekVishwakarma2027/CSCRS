import { requireOptionalNativeModule } from 'expo-modules-core';
import { AuthTokens, SECURE_AUTH_KEYS, SecureStorageAdapter } from './types';

function getSecureStoreModule(): typeof import('expo-secure-store') | null {
  try {
    const hasNative = requireOptionalNativeModule('ExpoSecureStore');
    if (!hasNative) return null;
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

/**
 * Native adapter using Android Keystore / iOS Keychain via expo-secure-store.
 * Falls back defensively to memory if native module is unavailable (e.g. before native re-linking or in tests).
 */
declare const __DEV__: boolean;

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
}

/**
 * Native adapter using Android Keystore / iOS Keychain via expo-secure-store.
 * In development (__DEV__), if the native module has not yet been compiled into the
 * development client, it provides an isolated in-memory fallback with dev warnings.
 * In production builds, it strictly NEVER falls back to memory and fails safely by throwing
 * an error to prevent insecure token persistence.
 */
export class ExpoSecureStoreAdapter implements SecureStorageAdapter {
  private devMemFallback: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    try {
      const mod = getSecureStoreModule();
      if (mod && (await mod.isAvailableAsync())) {
        return await mod.getItemAsync(key);
      }
    } catch (err) {
      if (!isDev()) {
        throw new Error(
          `[CRITICAL_SECURITY] Native secure storage error reading key "${key}". Operation blocked in production: ${String(err)}`
        );
      }
    }

    if (!isDev()) {
      throw new Error(
        `[CRITICAL_SECURITY] Native secure storage (ExpoSecureStore) is unavailable. In-memory fallback is strictly blocked in production.`
      );
    }

    // Development-only fallback when native module is unlinked during local iterative development
    return this.devMemFallback.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const mod = getSecureStoreModule();
      if (mod && (await mod.isAvailableAsync())) {
        await mod.setItemAsync(key, value, {
          keychainAccessible: mod.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        return;
      }
    } catch (err) {
      if (!isDev()) {
        throw new Error(
          `[CRITICAL_SECURITY] Native secure storage error persisting key "${key}". In-memory fallback is strictly blocked in production: ${String(err)}`
        );
      }
    }

    if (!isDev()) {
      throw new Error(
        `[CRITICAL_SECURITY] Native secure storage (ExpoSecureStore) is unavailable. Authentication token persistence is strictly blocked in production builds.`
      );
    }

    // Development-only fallback when native module is unlinked during local iterative development
    this.devMemFallback.set(key, value);
  }

  async deleteItem(key: string): Promise<void> {
    try {
      const mod = getSecureStoreModule();
      if (mod && (await mod.isAvailableAsync())) {
        await mod.deleteItemAsync(key);
        return;
      }
    } catch (err) {
      if (!isDev()) {
        throw new Error(
          `[CRITICAL_SECURITY] Native secure storage error deleting key "${key}". Operation blocked in production: ${String(err)}`
        );
      }
    }

    if (!isDev()) {
      // In production, if secure store is unavailable, nothing exists to delete
      return;
    }

    this.devMemFallback.delete(key);
  }
}

/**
 * In-memory adapter specifically for unit testing and headless test environments.
 */
export class InMemorySecureStoreAdapter implements SecureStorageAdapter {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async deleteItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Central Secure Token Store.
 * Strictly stores ONLY access tokens and refresh tokens in encrypted device storage.
 * Never stores passwords, OTPs, or user credentials.
 * Never logs tokens to console or remote monitoring.
 */
export class SecureTokenStore {
  private adapter: SecureStorageAdapter;

  constructor(adapter?: SecureStorageAdapter) {
    this.adapter = adapter ?? new ExpoSecureStoreAdapter();
  }

  setAdapter(adapter: SecureStorageAdapter): void {
    this.adapter = adapter;
  }

  getAdapter(): SecureStorageAdapter {
    return this.adapter;
  }

  async getAccessToken(): Promise<string | null> {
    return this.adapter.getItem(SECURE_AUTH_KEYS.ACCESS_TOKEN);
  }

  async setAccessToken(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new Error('SecureTokenStore: Invalid access token provided.');
    }
    await this.adapter.setItem(SECURE_AUTH_KEYS.ACCESS_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.adapter.getItem(SECURE_AUTH_KEYS.REFRESH_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new Error('SecureTokenStore: Invalid refresh token provided.');
    }
    await this.adapter.setItem(SECURE_AUTH_KEYS.REFRESH_TOKEN, token);
  }

  async setTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await Promise.all([
      this.setAccessToken(tokens.accessToken),
      this.setRefreshToken(tokens.refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      this.adapter.deleteItem(SECURE_AUTH_KEYS.ACCESS_TOKEN),
      this.adapter.deleteItem(SECURE_AUTH_KEYS.REFRESH_TOKEN),
    ]);
  }

  async hasSession(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return Boolean(accessToken || refreshToken);
  }
}

export const defaultSecureTokenStore = new SecureTokenStore();
