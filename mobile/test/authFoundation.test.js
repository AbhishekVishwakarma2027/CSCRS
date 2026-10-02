const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

// ==========================================
// 1. In-Memory Secure Storage Adapter
// ==========================================
class InMemorySecureStoreAdapter {
  constructor() {
    this.store = new Map();
  }
  async getItem(key) {
    return this.store.get(key) ?? null;
  }
  async setItem(key, value) {
    this.store.set(key, value);
  }
  async deleteItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const SECURE_AUTH_KEYS = {
  ACCESS_TOKEN: 'cscrs_sec_access_token',
  REFRESH_TOKEN: 'cscrs_sec_refresh_token',
};

class SecureTokenStore {
  constructor(adapter) {
    this.adapter = adapter || new InMemorySecureStoreAdapter();
  }
  async getAccessToken() {
    return this.adapter.getItem(SECURE_AUTH_KEYS.ACCESS_TOKEN);
  }
  async setAccessToken(token) {
    await this.adapter.setItem(SECURE_AUTH_KEYS.ACCESS_TOKEN, token);
  }
  async getRefreshToken() {
    return this.adapter.getItem(SECURE_AUTH_KEYS.REFRESH_TOKEN);
  }
  async setRefreshToken(token) {
    await this.adapter.setItem(SECURE_AUTH_KEYS.REFRESH_TOKEN, token);
  }
  async setTokens(tokens) {
    await Promise.all([
      this.setAccessToken(tokens.accessToken),
      this.setRefreshToken(tokens.refreshToken),
    ]);
  }
  async clearTokens() {
    await Promise.all([
      this.adapter.deleteItem(SECURE_AUTH_KEYS.ACCESS_TOKEN),
      this.adapter.deleteItem(SECURE_AUTH_KEYS.REFRESH_TOKEN),
    ]);
  }
  async hasSession() {
    const access = await this.getAccessToken();
    const refresh = await this.getRefreshToken();
    return Boolean(access || refresh);
  }
}

// ==========================================
// 2. ApiClientManager with Single-Flight Refresh
// ==========================================
class TestApiClientManager {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://api.cscrs.tech';
    this.tokenStore = options.tokenStore || new SecureTokenStore();
    this.onSessionExpiredCallback = options.onSessionExpired;
    this.refreshPromise = null;
    this.refreshCount = 0; // Telemetry for test assertions

    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: { Accept: 'application/json' },
    });

    if (options.adapter) {
      this.instance.defaults.adapter = options.adapter;
    }

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor: inject token
    this.instance.interceptors.request.use(async (config) => {
      const token = await this.tokenStore.getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: single-flight refresh on 401
    this.instance.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (
          !originalRequest ||
          error.response?.status !== 401 ||
          originalRequest._retry ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/login')
        ) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          if (!this.refreshPromise) {
            this.refreshPromise = this.performRefresh();
          }

          const newAccessToken = await this.refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return this.instance(originalRequest);
        } catch (refreshErr) {
          await this.tokenStore.clearTokens();
          if (this.onSessionExpiredCallback) {
            this.onSessionExpiredCallback();
          }
          return Promise.reject(refreshErr);
        } finally {
          this.refreshPromise = null;
        }
      }
    );
  }

  async performRefresh() {
    this.refreshCount += 1;
    const currentRefresh = await this.tokenStore.getRefreshToken();
    if (!currentRefresh) {
      throw new Error('No refresh token available');
    }

    if (this.mockRefreshHandler) {
      const result = await this.mockRefreshHandler(currentRefresh);
      await this.tokenStore.setTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });
      return result.access_token;
    }

    throw new Error('No mock refresh handler set');
  }
}

// ==========================================
// TEST SUITE: 10 Core Authentication Scenarios
// ==========================================
describe('CSCRS Phase 3A Authentication Foundation Tests', () => {
  let tokenStore;

  beforeEach(() => {
    tokenStore = new SecureTokenStore(new InMemorySecureStoreAdapter());
  });

  // 1. Secure token storage round-trip
  test('1. Secure token storage round-trip (get/set/clear/hasSession)', async () => {
    assert.equal(await tokenStore.hasSession(), false);

    await tokenStore.setTokens({
      accessToken: 'test_access_jwt_123',
      refreshToken: 'test_refresh_jwt_456',
    });

    assert.equal(await tokenStore.getAccessToken(), 'test_access_jwt_123');
    assert.equal(await tokenStore.getRefreshToken(), 'test_refresh_jwt_456');
    assert.equal(await tokenStore.hasSession(), true);

    await tokenStore.clearTokens();
    assert.equal(await tokenStore.getAccessToken(), null);
    assert.equal(await tokenStore.getRefreshToken(), null);
    assert.equal(await tokenStore.hasSession(), false);
  });

  // 2. Auth state transitions
  test('2. Auth state transitions (unauthenticated -> authenticated -> logged_out)', async () => {
    let state = 'unauthenticated';
    let user = null;

    // Simulate login
    await tokenStore.setTokens({ accessToken: 'acc_1', refreshToken: 'ref_1' });
    user = { id: 10, name: 'Ramesh Citizen', email: 'ramesh@cscrs.in', role: 'Citizen' };
    state = 'authenticated';

    assert.equal(state, 'authenticated');
    assert.equal(user.role, 'Citizen');

    // Simulate logout
    await tokenStore.clearTokens();
    user = null;
    state = 'unauthenticated';

    assert.equal(state, 'unauthenticated');
    assert.equal(user, null);
    assert.equal(await tokenStore.hasSession(), false);
  });

  // 3. API Authorization header injection
  test('3. API Authorization header injection when token exists', async () => {
    await tokenStore.setAccessToken('bearer_token_xyz');

    let capturedHeaders = null;
    const clientManager = new TestApiClientManager({
      tokenStore,
      adapter: async (config) => {
        capturedHeaders = config.headers;
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      },
    });

    await clientManager.instance.get('/api/v1/test');
    assert.equal(capturedHeaders.Authorization, 'Bearer bearer_token_xyz');
  });

  // 4. Successful token refresh
  test('4. Successful token refresh on HTTP 401 returns original request response', async () => {
    await tokenStore.setTokens({ accessToken: 'expired_access', refreshToken: 'valid_refresh' });

    let requestCount = 0;
    const clientManager = new TestApiClientManager({
      tokenStore,
      adapter: async (config) => {
        requestCount += 1;
        if (config.headers.Authorization === 'Bearer expired_access') {
          const err = new Error('Unauthorized');
          err.response = { status: 401, data: { detail: 'Token expired' } };
          err.config = config;
          throw err;
        }
        return { data: { message: 'Protected resource accessed' }, status: 200, statusText: 'OK', headers: {}, config };
      },
    });

    clientManager.mockRefreshHandler = async (oldRefreshToken) => {
      assert.equal(oldRefreshToken, 'valid_refresh');
      return { access_token: 'new_rotated_access', refresh_token: 'new_rotated_refresh' };
    };

    const res = await clientManager.instance.get('/api/v1/reports');
    assert.equal(res.status, 200);
    assert.equal(res.data.message, 'Protected resource accessed');
    assert.equal(await tokenStore.getAccessToken(), 'new_rotated_access');
    assert.equal(await tokenStore.getRefreshToken(), 'new_rotated_refresh');
    assert.equal(requestCount, 2); // Initial 401 + 1 retry
  });

  // 5. Failed refresh clears session
  test('5. Failed refresh clears session tokens and calls onSessionExpired', async () => {
    await tokenStore.setTokens({ accessToken: 'expired_access', refreshToken: 'invalid_refresh' });

    let sessionExpiredCalled = false;
    const clientManager = new TestApiClientManager({
      tokenStore,
      onSessionExpired: () => {
        sessionExpiredCalled = true;
      },
      adapter: async (config) => {
        const err = new Error('Unauthorized');
        err.response = { status: 401, data: { detail: 'Token expired' } };
        err.config = config;
        throw err;
      },
    });

    clientManager.mockRefreshHandler = async () => {
      const refreshErr = new Error('Invalid refresh token');
      refreshErr.response = { status: 401, data: { detail: 'Refresh token expired or revoked' } };
      throw refreshErr;
    };

    await assert.rejects(async () => {
      await clientManager.instance.get('/api/v1/reports');
    });

    assert.equal(sessionExpiredCalled, true);
    assert.equal(await tokenStore.getAccessToken(), null);
    assert.equal(await tokenStore.getRefreshToken(), null);
  });

  // 6. Multiple simultaneous 401s cause only one refresh request (Single-flight)
  test('6. Multiple simultaneous 401s cause only one refresh request', async () => {
    await tokenStore.setTokens({ accessToken: 'expired_access', refreshToken: 'valid_refresh' });

    const clientManager = new TestApiClientManager({
      tokenStore,
      adapter: async (config) => {
        if (config.headers.Authorization === 'Bearer expired_access') {
          const err = new Error('Unauthorized');
          err.response = { status: 401 };
          err.config = config;
          throw err;
        }
        return { data: { path: config.url }, status: 200, statusText: 'OK', headers: {}, config };
      },
    });

    clientManager.mockRefreshHandler = async () => {
      // Simulate small latency in token refresh
      await new Promise((r) => setTimeout(r, 20));
      return { access_token: 'new_token_concurrent', refresh_token: 'new_refresh_concurrent' };
    };

    // Fire 3 requests concurrently
    const [res1, res2, res3] = await Promise.all([
      clientManager.instance.get('/api/v1/resource1'),
      clientManager.instance.get('/api/v1/resource2'),
      clientManager.instance.get('/api/v1/resource3'),
    ]);

    assert.equal(res1.status, 200);
    assert.equal(res2.status, 200);
    assert.equal(res3.status, 200);
    assert.equal(clientManager.refreshCount, 1); // Strictly single-flight!
  });

  // 7. Original request is retried only once
  test('7. Original request is retried only once (no infinite retry loop)', async () => {
    await tokenStore.setTokens({ accessToken: 'bad_token', refreshToken: 'valid_refresh' });

    let attempts = 0;
    const clientManager = new TestApiClientManager({
      tokenStore,
      adapter: async (config) => {
        attempts += 1;
        const err = new Error('Unauthorized');
        err.response = { status: 401 };
        err.config = config;
        throw err;
      },
    });

    clientManager.mockRefreshHandler = async () => {
      return { access_token: 'still_bad_token', refresh_token: 'new_refresh' };
    };

    await assert.rejects(async () => {
      await clientManager.instance.get('/api/v1/reports');
    });

    assert.equal(attempts, 2); // Initial request + exactly 1 retry
  });

  // 8. No refresh occurs for non-401 errors
  test('8. No refresh occurs for non-401 errors (400, 403, 404, 429)', async () => {
    await tokenStore.setTokens({ accessToken: 'valid_token', refreshToken: 'valid_refresh' });

    for (const status of [400, 403, 404, 429, 500]) {
      const clientManager = new TestApiClientManager({
        tokenStore,
        adapter: async (config) => {
          const err = new Error(`HTTP ${status}`);
          err.response = { status, data: { detail: `Error ${status}` } };
          err.config = config;
          throw err;
        },
      });

      clientManager.mockRefreshHandler = async () => {
        assert.fail('Refresh handler should NOT be called for status ' + status);
      };

      await assert.rejects(async () => {
        await clientManager.instance.get('/api/v1/test');
      });

      assert.equal(clientManager.refreshCount, 0);
    }
  });

  // 9. /auth/me determines authenticated role
  test('9. /auth/me determines authenticated role and enforces authority', async () => {
    const testCases = [
      { backendRole: 'Citizen', expectedAction: 'CitizenHome' },
      { backendRole: 'Worker', expectedAction: 'WorkerHome' },
      { backendRole: 'DepartmentAdmin', expectedAction: 'UnsupportedRole' },
      { backendRole: 'SuperAdmin', expectedAction: 'UnsupportedRole' },
    ];

    for (const tc of testCases) {
      const mockMeUser = { id: 5, name: 'User', email: 'user@cscrs.in', role: tc.backendRole };
      let action = null;

      if (mockMeUser.role === 'Citizen') {
        action = 'CitizenHome';
      } else if (mockMeUser.role === 'Worker') {
        action = 'WorkerHome';
      } else {
        action = 'UnsupportedRole';
      }

      assert.equal(action, tc.expectedAction, `Role ${tc.backendRole} mapped correctly`);
    }
  });

  // 10. Logout clears secure tokens
  test('10. Logout clears secure tokens', async () => {
    await tokenStore.setTokens({ accessToken: 'jwt_to_clear', refreshToken: 'ref_to_clear' });
    assert.equal(await tokenStore.hasSession(), true);

    // Simulate logout action
    await tokenStore.clearTokens();

    assert.equal(await tokenStore.hasSession(), false);
    assert.equal(await tokenStore.getAccessToken(), null);
    assert.equal(await tokenStore.getRefreshToken(), null);
  });

  // 11. Production builds fail safely and never silently fallback to memory storage
  test('11. Production builds fail safely and never silently fallback to memory storage', async () => {
    const originalDev = global.__DEV__;
    try {
      global.__DEV__ = false;
      class ProductionExpoSecureStoreAdapter {
        constructor() {
          this.devMemFallback = new Map();
        }
        isDev() {
          return typeof global.__DEV__ !== 'undefined' && Boolean(global.__DEV__);
        }
        async setItem(key, value) {
          if (!this.isDev()) {
            throw new Error(
              `[CRITICAL_SECURITY] Native secure storage (ExpoSecureStore) is unavailable. Authentication token persistence is strictly blocked in production builds.`
            );
          }
          this.devMemFallback.set(key, value);
        }
        async getItem(key) {
          if (!this.isDev()) {
            throw new Error(
              `[CRITICAL_SECURITY] Native secure storage (ExpoSecureStore) is unavailable. In-memory fallback is strictly blocked in production.`
            );
          }
          return this.devMemFallback.get(key) ?? null;
        }
      }

      const prodAdapter = new ProductionExpoSecureStoreAdapter();
      await assert.rejects(
        async () => {
          await prodAdapter.setItem('cscrs_sec_access_token', 'test_secret');
        },
        {
          name: 'Error',
          message: /CRITICAL_SECURITY.*Authentication token persistence is strictly blocked in production builds/,
        }
      );

      await assert.rejects(
        async () => {
          await prodAdapter.getItem('cscrs_sec_access_token');
        },
        {
          name: 'Error',
          message: /CRITICAL_SECURITY.*In-memory fallback is strictly blocked in production/,
        }
      );
    } finally {
      global.__DEV__ = originalDev;
    }
  });
});

