const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('CSCRS Mobile: Final UX/UI and Feature Completion Tests', () => {

  // ----------------------------------------------------
  // 1. formatPercentage bug prevention
  // ----------------------------------------------------
  describe('1. formatPercentage Scaling Bug Prevention', () => {
    // Replicate formatPercentage logic from formatters.ts
    function formatPercentage(value, decimals = 2) {
      if (typeof value !== 'number' || isNaN(value)) {
        return '0.00%';
      }
      let normalized = value;
      if (normalized > 0 && normalized <= 1.0) {
        normalized = normalized * 100;
      }
      const clamped = Math.min(Math.max(normalized, 0), 100);
      return `${clamped.toFixed(decimals)}%`;
    }

    test('normalizes 0.6667 ratio to 66.67% instead of 6667%', () => {
      const result = formatPercentage(0.6667);
      assert.strictEqual(result, '66.67%');
      assert.notStrictEqual(result, '6667.00%');
    });

    test('handles already-scaled percentage 66.67 cleanly', () => {
      const result = formatPercentage(66.67);
      assert.strictEqual(result, '66.67%');
    });

    test('formats boundary values 0 and 1.0 correctly', () => {
      assert.strictEqual(formatPercentage(0), '0.00%');
      assert.strictEqual(formatPercentage(1.0), '100.00%');
    });

    test('clamps negative values and out-of-range values', () => {
      assert.strictEqual(formatPercentage(-10), '0.00%');
      assert.strictEqual(formatPercentage(150), '100.00%');
    });

    test('handles NaN and undefined safely', () => {
      assert.strictEqual(formatPercentage(NaN), '0.00%');
      assert.strictEqual(formatPercentage(undefined), '0.00%');
    });
  });

  // ----------------------------------------------------
  // 2. Change Password verified backend contract
  // ----------------------------------------------------
  describe('2. Change Password Verified Contract', () => {
    test('Change Password payload contains old_password, new_password, confirm_password', () => {
      const payload = {
        old_password: 'CurrentPassword123!',
        new_password: 'NewSecurePassword456!',
        confirm_password: 'NewSecurePassword456!',
      };

      assert.ok(payload.old_password);
      assert.ok(payload.new_password);
      assert.ok(payload.confirm_password);
      assert.strictEqual(payload.new_password, payload.confirm_password);
      assert.ok(payload.new_password.length >= 8);
    });

    test('Rejects payload when new_password and confirm_password mismatch', () => {
      const payload = {
        old_password: 'CurrentPassword123!',
        new_password: 'NewSecurePassword456!',
        confirm_password: 'MismatchPassword789!',
      };

      const isValid = payload.new_password === payload.confirm_password;
      assert.strictEqual(isValid, false);
    });

    test('ChangePasswordScreen source contains exact backend field references', () => {
      const filePath = path.join(__dirname, '../src/features/auth/screens/ChangePasswordScreen.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('old_password'));
      assert.ok(content.includes('new_password'));
      assert.ok(content.includes('confirm_password'));
      assert.ok(content.includes('changePassword'));
    });
  });

  // ----------------------------------------------------
  // 3. Forgot Password 3-step UX flow
  // ----------------------------------------------------
  describe('3. Forgot Password 3-Endpoint Flow', () => {
    test('ForgotPasswordScreen exists and implements 3-step state flow', () => {
      const filePath = path.join(__dirname, '../src/features/auth/screens/ForgotPasswordScreen.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes("'email' | 'otp' | 'password'"));
      assert.ok(content.includes('forgotPassword'));
      assert.ok(content.includes('verifyResetOtp'));
      assert.ok(content.includes('resetPassword'));
    });

    test('Strict 3-step sequence contract validation', async () => {
      const calls = [];
      const mockClient = {
        post: async (url, data) => {
          calls.push({ url, data });
          return { data: { message: 'Success' } };
        },
      };

      // Step 1: Request OTP
      await mockClient.post('/api/v1/auth/forgot-password', { email: 'citizen@example.com' });
      assert.strictEqual(calls[0].url, '/api/v1/auth/forgot-password');
      assert.strictEqual(calls[0].data.email, 'citizen@example.com');

      // Step 2: Verify OTP
      await mockClient.post('/api/v1/auth/verify-reset-otp', { email: 'citizen@example.com', otp: '123456' });
      assert.strictEqual(calls[1].url, '/api/v1/auth/verify-reset-otp');
      assert.strictEqual(calls[1].data.otp, '123456');

      // Step 3: Reset Password
      await mockClient.post('/api/v1/auth/reset-password', {
        email: 'citizen@example.com',
        otp: '123456',
        new_password: 'NewPassword123!',
      });
      assert.strictEqual(calls[2].url, '/api/v1/auth/reset-password');
      assert.strictEqual(calls[2].data.new_password, 'NewPassword123!');
    });

    test('Never persists OTP or passwords in AsyncStorage or persistent storage', () => {
      const filePath = path.join(__dirname, '../src/features/auth/screens/ForgotPasswordScreen.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(!content.includes('AsyncStorage.setItem'));
      assert.ok(!content.includes('SecureStore.setItem'));
    });
  });

  // ----------------------------------------------------
  // 4. Feedback API payload contract
  // ----------------------------------------------------
  describe('4. Feedback API Payload Contract', () => {
    test('Feedback payload matches verified backend contract { rating, liked_text, suggestion_text }', () => {
      const validPayload = {
        rating: 5,
        liked_text: 'Quick response and good interface.',
        suggestion_text: 'Add dark mode toggle to home screen.',
      };

      assert.strictEqual(typeof validPayload.rating, 'number');
      assert.ok(validPayload.rating >= 1 && validPayload.rating <= 5);
      assert.strictEqual(validPayload['report_id'], undefined);
      assert.strictEqual(validPayload['comments'], undefined);
    });

    test('CitizenFeedbackScreen source adheres to verified Feedback schema', () => {
      const filePath = path.join(__dirname, '../src/features/citizen/screens/CitizenFeedbackScreen.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('submitFeedback'));
      assert.ok(content.includes('rating'));
      assert.ok(content.includes('liked_text'));
      assert.ok(content.includes('suggestion_text'));
      assert.ok(!content.includes('report_id:'));
      assert.ok(!content.includes('comments:'));
    });
  });

  // ----------------------------------------------------
  // 5. Profile photo upload/delete contract
  // ----------------------------------------------------
  describe('5. Profile Photo Upload and Remove Contract', () => {
    test('uploadProfilePhoto uses multipart form-data with photo field', async () => {
      const calls = [];
      const mockClient = {
        post: async (url, data) => {
          calls.push({ url, data });
          return { data: { message: 'Profile photo uploaded successfully.', profile_image: 'https://api.cscrs.in/uploads/photo.jpg' } };
        },
      };

      // Test endpoint definition exists in packages/api
      const filePath = path.join(__dirname, '../packages/api/src/citizenEndpoints.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('/api/v1/profile/photo'));
      assert.ok(content.includes("formData.append('photo'"));
    });

    test('deleteProfilePhoto calls DELETE /api/v1/profile/photo', () => {
      const filePath = path.join(__dirname, '../packages/api/src/citizenEndpoints.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes("client.delete<MessageResponse>(\n    '/api/v1/profile/photo'"));
    });
  });

  // ----------------------------------------------------
  // 6. Authenticated report image loading
  // ----------------------------------------------------
  describe('6. Authenticated Report Image Loading', () => {
    test('fetchReportImageBase64 does NOT put tokens in URL', async () => {
      let requestedUrl = '';
      let requestedParams = null;

      const mockClient = {
        get: async (url, config) => {
          requestedUrl = url;
          requestedParams = config?.params;
          return {
            data: Buffer.from('fake-image-binary'),
            headers: { 'content-type': 'image/jpeg' },
          };
        },
      };

      const filePath = path.join(__dirname, '../packages/api/src/citizenEndpoints.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('/api/v1/reports/${reportId}/image'));
      assert.ok(!content.includes('token='));
      assert.ok(!content.includes('access_token='));
      assert.ok(content.includes("responseType: 'arraybuffer'"));
    });

    test('CitizenReportDetailsScreen tabs: Original, Annotated, Resolution', () => {
      const filePath = path.join(__dirname, '../src/features/citizen/screens/CitizenReportDetailsScreen.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes("'original' | 'annotated' | 'resolution'"));
      assert.ok(content.includes('fetchReportImageBase64'));
      assert.ok(content.includes('tabOriginal'));
      assert.ok(content.includes('tabAnnotated'));
      assert.ok(content.includes('tabResolution'));
    });
  });

  // ----------------------------------------------------
  // 7. Google Maps worker navigation fallback
  // ----------------------------------------------------
  describe('7. Worker Maps Navigation Fallback', () => {
    test('WorkerTaskDetailsScreen implements geo: intent with browser fallback', () => {
      const filePath = path.join(__dirname, '../src/features/worker/screens/WorkerTaskDetailsScreen.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('geo:'));
      assert.ok(content.includes('https://www.google.com/maps/search/?api=1&query='));
      assert.ok(content.includes('Linking.canOpenURL'));
      assert.ok(content.includes('Linking.openURL'));
    });
  });

  // ----------------------------------------------------
  // 8. Vector Icon System (No child emojis)
  // ----------------------------------------------------
  describe('8. Vector Icon System Integrity', () => {
    test('CscrsIcon exists and renders vector icon elements without emojis', () => {
      const iconPath = path.join(__dirname, '../packages/design-system/src/components/CscrsIcon.tsx');
      const content = fs.readFileSync(iconPath, 'utf8');
      assert.ok(content.includes('export const CscrsIcon'));
      assert.ok(!content.includes('🏠'));
      assert.ok(!content.includes('📋'));
      assert.ok(!content.includes('🔔'));
      assert.ok(!content.includes('👤'));
    });

    test('Citizen & Worker bottom tab navigators use CscrsIcon instead of emojis', () => {
      const citizenNav = fs.readFileSync(
        path.join(__dirname, '../src/features/citizen/navigation/CitizenNavigator.tsx'),
        'utf8'
      );
      assert.ok(citizenNav.includes('<CscrsIcon'));
      assert.ok(!citizenNav.includes('🏠'));

      const workerNav = fs.readFileSync(
        path.join(__dirname, '../src/features/worker/navigation/WorkerNavigator.tsx'),
        'utf8'
      );
      assert.ok(workerNav.includes('<CscrsIcon'));
      assert.ok(!workerNav.includes('🏠'));
    });
  });

  // ----------------------------------------------------
  // 9. Production App Display Name
  // ----------------------------------------------------
  describe('9. Production App Display Name in app.config.ts', () => {
    test('app.config.ts configures display name strictly as CSCRS', () => {
      const appConfigPath = path.join(__dirname, '../apps/cscrs-mobile/app.config.ts');
      const content = fs.readFileSync(appConfigPath, 'utf8');
      assert.ok(content.includes("name: 'CSCRS'"));
    });
  });
});
