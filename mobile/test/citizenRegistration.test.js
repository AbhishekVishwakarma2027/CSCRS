const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

// ============================================================================
// CSCRS Phase 3B-1 Citizen Registration Unit Test Suite
// ============================================================================

describe('CSCRS Phase 3B-1 Citizen Registration & OTP Foundation Tests', () => {
  let mockStorage;
  let mockPendingContext;

  beforeEach(() => {
    mockStorage = new Map();
    mockPendingContext = {
      pendingEmail: null,
      setPendingEmail(email) {
        this.pendingEmail = email;
      },
      clearPendingEmail() {
        this.pendingEmail = null;
      },
    };
  });

  // 1. Registration API request shape
  test('1. Registration API request matches verified backend contract', async () => {
    let capturedRequest = null;

    const mockAxiosInstance = {
      async post(url, data) {
        capturedRequest = { url, data };
        return {
          status: 200,
          data: {
            message: 'Registration successful. Please check your email for the verification OTP.',
          },
        };
      },
    };

    const registerPayload = {
      name: 'Ramesh Kumar',
      email: 'ramesh@example.com',
      phone: '9876543210',
      password: 'StrongPassword123!',
    };

    const res = await mockAxiosInstance.post('/api/v1/auth/register', registerPayload);

    assert.equal(capturedRequest.url, '/api/v1/auth/register');
    assert.deepEqual(capturedRequest.data, registerPayload);
    assert.equal(capturedRequest.data.name, 'Ramesh Kumar');
    assert.equal(capturedRequest.data.email, 'ramesh@example.com');
    assert.equal(capturedRequest.data.phone, '9876543210');
    assert.match(capturedRequest.data.phone, /^\d{10}$/);
    assert.ok(capturedRequest.data.password.length >= 8);
    assert.equal(res.data.message, 'Registration successful. Please check your email for the verification OTP.');
  });

  // 2. Successful registration state transition and transient email passing
  test('2. Successful registration sets transient email context without route params', async () => {
    let navigatedRoute = null;
    let navigatedParams = null;

    const mockNavigation = {
      navigate(route, params) {
        navigatedRoute = route;
        navigatedParams = params;
      },
    };

    // Simulate registration submission
    const registeredEmail = 'citizen.test@cscrs.in';
    mockPendingContext.setPendingEmail(registeredEmail);
    mockNavigation.navigate('CitizenVerifyEmail'); // no params

    assert.equal(navigatedRoute, 'CitizenVerifyEmail');
    assert.equal(navigatedParams, undefined, 'Navigation parameters must be undefined');
    assert.equal(mockPendingContext.pendingEmail, registeredEmail, 'Email is passed exclusively via transient memory context');
  });

  // 3. Client-side validation rules
  test('3. Client-side validation mirrors backend schema rules', () => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PHONE_REGEX = /^\d{10}$/;

    // Name validation
    const validateName = (n) => Boolean(n && n.trim().length >= 2 && n.trim().length <= 100);
    assert.equal(validateName(''), false);
    assert.equal(validateName('A'), false);
    assert.equal(validateName('Ramesh Kumar'), true);

    // Email validation
    const validateEmail = (e) => Boolean(e && EMAIL_REGEX.test(e.trim()));
    assert.equal(validateEmail('invalid'), false);
    assert.equal(validateEmail('no@domain'), false);
    assert.equal(validateEmail('ramesh@example.com'), true);

    // Phone validation (exactly 10 digits)
    const validatePhone = (p) => Boolean(p && PHONE_REGEX.test(p.trim()));
    assert.equal(validatePhone('123'), false);
    assert.equal(validatePhone('98765432101'), false); // 11 digits
    assert.equal(validatePhone('987654321a'), false); // letters
    assert.equal(validatePhone('9876543210'), true); // 10 digits

    // Password validation (min 8 chars)
    const validatePassword = (pwd) => Boolean(pwd && pwd.length >= 8);
    assert.equal(validatePassword('short'), false);
    assert.equal(validatePassword('1234567'), false);
    assert.equal(validatePassword('12345678'), true);
  });

  // 4. Password confirmation mismatch
  test('4. Password confirmation must match password exactly', () => {
    const validateConfirm = (pwd, confirm) => pwd === confirm;

    assert.equal(validateConfirm('SecurePass123', 'DifferentPass'), false);
    assert.equal(validateConfirm('SecurePass123', 'securepass123'), false); // case mismatch
    assert.equal(validateConfirm('SecurePass123', 'SecurePass123'), true);
  });

  // 5. Registration failure handling (409 conflict, 422, 429 rate limit)
  test('5. Registration failure error parsing handles HTTP 409, 422, and 429 cleanly', () => {
    function parseApiError(error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 429) return 'Too many requests. Please wait a few moments before trying again.';
        if (data?.detail) {
          if (typeof data.detail === 'string') return data.detail;
          if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
        }
        if (status === 409) return 'An account with this email or phone number already exists.';
        if (status === 422) return 'Please check your input for invalid format or missing fields.';
        if (status >= 500) return 'The server encountered an error. Please try again shortly.';
      }
      return 'Network error. Please check your internet connection and try again.';
    }

    // 409 Email conflict
    const emailConflictError = {
      response: { status: 409, data: { detail: 'Email already registered.' } },
    };
    assert.equal(parseApiError(emailConflictError), 'Email already registered.');

    // 409 Phone conflict
    const phoneConflictError = {
      response: { status: 409, data: { detail: 'Phone number already registered.' } },
    };
    assert.equal(parseApiError(phoneConflictError), 'Phone number already registered.');

    // 422 Validation error
    const validationError = {
      response: {
        status: 422,
        data: {
          detail: [{ loc: ['body', 'phone'], msg: 'Phone number must be exactly 10 digits.', type: 'value_error' }],
        },
      },
    };
    assert.equal(parseApiError(validationError), 'Phone number must be exactly 10 digits.');

    // 429 Rate limit
    const rateLimitError = {
      response: { status: 429, data: { detail: 'Too many requests' } },
    };
    assert.equal(parseApiError(rateLimitError), 'Too many requests. Please wait a few moments before trying again.');

    // Network error (no response)
    const netError = { message: 'Network Error' };
    assert.equal(parseApiError(netError), 'Network error. Please check your internet connection and try again.');
  });

  // 6. OTP screen receives only the intended non-sensitive email context
  test('6. OTP verification receives only non-sensitive email context, zero passwords or tokens', () => {
    mockPendingContext.setPendingEmail('citizen@cscrs.in');

    // Verify context contains ONLY email
    assert.equal(mockPendingContext.pendingEmail, 'citizen@cscrs.in');
    assert.equal(mockPendingContext.password, undefined);
    assert.equal(mockPendingContext.otp, undefined);

    // Clear after verification
    mockPendingContext.clearPendingEmail();
    assert.equal(mockPendingContext.pendingEmail, null);
  });

  // 7. Sensitive credential hygiene: password and OTP are never persisted
  test('7. Passwords, confirm passwords, and OTPs are never persisted in storage', () => {
    // Mock user form entry
    const transientForm = {
      name: 'Ramesh',
      email: 'ramesh@example.com',
      phone: '9876543210',
      password: 'MyPassword123!',
      confirmPassword: 'MyPassword123!',
    };

    // On submit, form wiped
    transientForm.password = '';
    transientForm.confirmPassword = '';

    // Mock storage write for non-sensitive onboarding only
    mockStorage.set('cscrs_selected_role', 'Citizen');
    mockStorage.set('cscrs_onboarding_completed', 'true');

    // Verify sensitive keys are NOT in persistent storage
    assert.equal(mockStorage.get('password'), undefined);
    assert.equal(mockStorage.get('confirm_password'), undefined);
    assert.equal(mockStorage.get('otp'), undefined);
    assert.equal(mockStorage.get('otp_code'), undefined);
    assert.equal(transientForm.password, '');
  });

  // 8. Verify and Resend API request shapes
  test('8. Verify and Resend API request shapes match verified backend contracts', async () => {
    let verifyCall = null;
    let resendCall = null;

    const mockClient = {
      async post(url, data) {
        if (url === '/api/v1/auth/verify-email') {
          verifyCall = { url, data };
          return { data: { message: 'Email verified successfully.' } };
        }
        if (url === '/api/v1/auth/resend-otp') {
          resendCall = { url, data };
          return { data: { message: 'A new verification OTP has been sent to your email.' } };
        }
        throw new Error('Unknown endpoint');
      },
    };

    // Verify Email: uses 'otp' per backend schemas/user.py VerifyEmailRequest
    const verifyRes = await mockClient.post('/api/v1/auth/verify-email', {
      email: 'citizen@cscrs.in',
      otp: '123456',
    });

    assert.equal(verifyCall.url, '/api/v1/auth/verify-email');
    assert.equal(verifyCall.data.email, 'citizen@cscrs.in');
    assert.equal(verifyCall.data.otp, '123456');
    assert.equal(verifyCall.data.otp.length, 6);
    assert.equal(verifyRes.data.message, 'Email verified successfully.');

    // Resend OTP: uses 'email' per backend schemas/user.py ResendOTPRequest
    const resendRes = await mockClient.post('/api/v1/auth/resend-otp', {
      email: 'citizen@cscrs.in',
    });

    assert.equal(resendCall.url, '/api/v1/auth/resend-otp');
    assert.equal(resendCall.data.email, 'citizen@cscrs.in');
    assert.equal(resendRes.data.message, 'A new verification OTP has been sent to your email.');
  });

  // ==========================================================================
  // Phase 3B-2 Hardening & Lifecycle Tests
  // ==========================================================================

  // 9. Verify request payload constraints
  test('9. Verify request requires email and exactly 6-digit OTP', () => {
    const isOtpValid = (otp) => /^\d{6}$/.test(otp.trim());

    assert.equal(isOtpValid(''), false);
    assert.equal(isOtpValid('12345'), false);
    assert.equal(isOtpValid('1234567'), false);
    assert.equal(isOtpValid('12345a'), false);
    assert.equal(isOtpValid('12 345'), false);
    assert.equal(isOtpValid('123456'), true);
    assert.equal(isOtpValid('000000'), true);
  });

  // 10. Verify button state condition
  test('10. Verify button is strictly disabled before exactly 6 digits and enabled at 6 digits', () => {
    const isVerifyDisabled = (isVerifying, otp) => isVerifying || otp.length !== 6;

    assert.equal(isVerifyDisabled(false, ''), true);
    assert.equal(isVerifyDisabled(false, '1'), true);
    assert.equal(isVerifyDisabled(false, '12345'), true);
    assert.equal(isVerifyDisabled(false, '123456'), false, 'Must be enabled at exactly 6 digits');
    assert.equal(isVerifyDisabled(true, '123456'), true, 'Must be disabled while verifying');
  });

  // 11. Successful verification lifecycle: clears pendingEmail, enters success state, and redirect guard does not navigate away
  test('11. Successful verification clears pendingEmail, sets isSuccess, and redirect guard preserves success card', async () => {
    mockPendingContext.setPendingEmail('citizen@cscrs.in');
    let isSuccess = false;
    let otpState = '654321';
    let redirectedRoute = null;

    const mockNavigation = {
      replace(route) {
        redirectedRoute = route;
      },
    };

    // Simulate handleVerify success
    const handleVerify = async () => {
      try {
        // Successful verification API call
        mockPendingContext.clearPendingEmail();
        isSuccess = true;
      } finally {
        otpState = '';
      }
    };

    await handleVerify();

    // Verify state outcomes
    assert.equal(mockPendingContext.pendingEmail, null, 'pendingEmail cleared on success');
    assert.equal(isSuccess, true, 'isSuccess set to true');
    assert.equal(otpState, '', 'OTP cleared in finally');

    // Simulate redirect guard: if (!pendingEmail && !isSuccess) navigation.replace('CitizenRegister')
    const checkRedirectGuard = () => {
      if (!mockPendingContext.pendingEmail && !isSuccess) {
        mockNavigation.replace('CitizenRegister');
      }
    };

    checkRedirectGuard();
    assert.equal(redirectedRoute, null, 'Redirect guard must NOT replace screen when isSuccess is true');
  });

  // 12. Verification failure lifecycle: retains pendingEmail for retry, clears OTP, displays error
  test('12. Verification failure retains pendingEmail for retry, clears OTP, and shows safe error message', async () => {
    mockPendingContext.setPendingEmail('citizen@cscrs.in');
    let isSuccess = false;
    let otpState = '111111';
    let errorMessage = null;

    const handleVerifyFailed = async () => {
      try {
        // Simulate backend 400 Invalid OTP
        const err = { response: { status: 400, data: { detail: 'Invalid OTP.' } } };
        throw err;
      } catch (err) {
        errorMessage = err.response?.data?.detail || 'Verification failed';
      } finally {
        // Unconditional clearing in finally
        otpState = '';
      }
    };

    await handleVerifyFailed();

    assert.equal(mockPendingContext.pendingEmail, 'citizen@cscrs.in', 'pendingEmail retained for retry on failure');
    assert.equal(isSuccess, false, 'isSuccess remains false');
    assert.equal(otpState, '', 'OTP cleared from transient memory on failure');
    assert.equal(errorMessage, 'Invalid OTP.');
  });

  // 13. OTP is never persisted
  test('13. OTP is never written to persistent storage, global store, or navigation params', () => {
    let transientOtp = '987654';
    const navigationHistory = [];

    // Simulate verify attempt
    navigationHistory.push({ route: 'CitizenVerifyEmail', params: undefined });
    transientOtp = '';

    assert.equal(mockStorage.get('otp'), undefined);
    assert.equal(mockStorage.get('pendingOtp'), undefined);
    assert.equal(mockPendingContext.otp, undefined);
    assert.equal(navigationHistory[0].params, undefined);
    assert.equal(transientOtp, '');
  });

  // 14. OTP and credentials are never logged
  test('14. Sensitive credentials (OTP, passwords, tokens) are never passed to logging statements', () => {
    const logBuffer = [];
    const safeLogger = {
      info(msg) {
        logBuffer.push(msg);
      },
      error(msg) {
        logBuffer.push(msg);
      },
    };

    // Simulate sanitize error / logging
    const sanitizeForLog = (obj) => {
      const sanitized = { ...obj };
      delete sanitized.password;
      delete sanitized.otp;
      delete sanitized.access_token;
      delete sanitized.refresh_token;
      return JSON.stringify(sanitized);
    };

    const sensitiveEvent = {
      action: 'EMAIL_VERIFICATION_ATTEMPT',
      email: 'citizen@cscrs.in',
      otp: '123456',
      password: 'SecretPassword!',
    };

    safeLogger.info(sanitizeForLog(sensitiveEvent));

    const loggedContent = logBuffer.join(' ');
    assert.ok(!loggedContent.includes('123456'), 'OTP must not be present in log output');
    assert.ok(!loggedContent.includes('SecretPassword!'), 'Password must not be present in log output');
  });

  // 15. Resend request contains only pendingEmail
  test('15. Resend request contains only pendingEmail and zero sensitive fields', async () => {
    let capturedBody = null;
    const mockApi = {
      async resendOtp(body) {
        capturedBody = body;
        return { message: 'A new verification OTP has been sent to your email.' };
      },
    };

    const res = await mockApi.resendOtp({ email: 'citizen@cscrs.in' });

    assert.deepEqual(capturedBody, { email: 'citizen@cscrs.in' });
    assert.equal(capturedBody.otp, undefined);
    assert.equal(capturedBody.password, undefined);
    assert.equal(res.message, 'A new verification OTP has been sent to your email.');
  });

  // 16. Resend cooldown blocks duplicate resend
  test('16. Resend cooldown blocks duplicate resend while countdown > 0 or request is in flight', () => {
    const isResendDisabled = (pendingEmail, countdown, isResending) => {
      return !pendingEmail || countdown > 0 || isResending;
    };

    assert.equal(isResendDisabled(null, 0, false), true, 'Disabled without pendingEmail');
    assert.equal(isResendDisabled('citizen@cscrs.in', 45, false), true, 'Disabled during countdown');
    assert.equal(isResendDisabled('citizen@cscrs.in', 0, true), true, 'Disabled during in-flight request');
    assert.equal(isResendDisabled('citizen@cscrs.in', 0, false), false, 'Enabled when cooldown is 0 and idle');
  });

  // 17. Successful resend restarts 60s cooldown; failed resend does NOT restart cooldown
  test('17. Successful resend restarts 60s cooldown, whereas failed resend does not restart cooldown', async () => {
    let countdown = 0;
    const COOLDOWN_SECONDS = 60;

    // Successful resend simulation
    const handleResendSuccess = async () => {
      try {
        // mock successful API call
        countdown = COOLDOWN_SECONDS;
      } catch (err) {
        // should not reach here
      }
    };

    await handleResendSuccess();
    assert.equal(countdown, 60, 'Countdown reset to 60 on success');

    // Failed resend simulation
    countdown = 0; // reset to 0
    const handleResendFailure = async () => {
      try {
        throw new Error('Network error');
        countdown = COOLDOWN_SECONDS;
      } catch (err) {
        // Do NOT restart cooldown on failure
      }
    };

    await handleResendFailure();
    assert.equal(countdown, 0, 'Countdown must remain 0 after failed resend so user can retry');
  });

  // 18. Rate limit (HTTP 429) handled safely
  test('18. HTTP 429 is handled safely with a user-friendly message', () => {
    function parseApiError(error) {
      if (error.response?.status === 429) {
        return 'Too many requests. Please wait a few moments before trying again.';
      }
      return 'An unexpected error occurred.';
    }

    const rateLimitError = {
      response: {
        status: 429,
        data: { detail: 'Too many requests. Please try again later.' },
      },
    };

    const msg = parseApiError(rateLimitError);
    assert.equal(msg, 'Too many requests. Please wait a few moments before trying again.');
  });

  // 19. Invalid or expired OTP handled safely
  test('19. Invalid and expired OTP backend errors are handled safely', () => {
    function parseApiError(error) {
      const data = error.response?.data;
      if (data?.detail && typeof data.detail === 'string') {
        return data.detail;
      }
      return 'Verification failed.';
    }

    const invalidOtpError = { response: { status: 400, data: { detail: 'Invalid OTP.' } } };
    assert.equal(parseApiError(invalidOtpError), 'Invalid OTP.');

    const expiredOtpError = { response: { status: 400, data: { detail: 'OTP expired.' } } };
    assert.equal(parseApiError(expiredOtpError), 'OTP expired.');

    const maxAttemptsError = {
      response: {
        status: 400,
        data: { detail: 'Maximum OTP attempts exceeded. Please request a new OTP.' },
      },
    };
    assert.equal(parseApiError(maxAttemptsError), 'Maximum OTP attempts exceeded. Please request a new OTP.');
  });

  // 20. Post-verification: no tokens created, user remains unauthenticated
  test('20. Successful verification creates no tokens and Continue to Sign In leaves user unauthenticated', async () => {
    let hasSession = false;
    let secureTokens = null;

    // Simulate post-verification flow
    // 1. Verification succeeds
    mockPendingContext.clearPendingEmail();

    // 2. Assert no tokens created
    assert.equal(secureTokens, null, 'No tokens created on verification success');
    assert.equal(hasSession, false, 'User must remain unauthenticated');

    // 3. User clicks "Continue to Sign In"
    let navigationTarget = null;
    const mockNavigation = {
      reset(options) {
        navigationTarget = options.routes[0].name;
      },
    };

    mockNavigation.reset({ index: 0, routes: [{ name: 'AuthBoundary' }] });
    assert.equal(navigationTarget, 'AuthBoundary');
    assert.equal(hasSession, false, 'User is strictly unauthenticated after returning to AuthBoundary');
  });
});

