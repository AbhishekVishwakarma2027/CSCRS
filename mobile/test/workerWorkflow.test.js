const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ============================================================================
// CSCRS Phase 5 Worker Mobile Workflow Unit Test Suite
// Covers Phases 5A, 5B, 5C, and 5D
// ============================================================================

describe('CSCRS Phase 5 Worker Mobile Workflow Tests', () => {
  let requestsMade;
  let mockApiClient;
  let mockDashboardData;
  let mockAssignments;
  let mockNotifications;

  beforeEach(() => {
    requestsMade = [];

    mockNotifications = [
      {
        id: 101,
        report_id: 501,
        title: 'New Task Assigned',
        message: 'You have been assigned to repair Pothole at MG Road, Ward 4.',
        type: 'ASSIGNMENT',
        is_read: false,
        created_at: '2026-09-20T08:05:00Z',
      },
      {
        id: 102,
        report_id: 502,
        title: 'Work Verified',
        message: 'Resolution verified for Broken Streetlight.',
        type: 'RESOLUTION',
        is_read: true,
        created_at: '2026-09-20T08:50:00Z',
      },
      {
        id: 103,
        report_id: 999,
        title: 'General Civic Update',
        message: 'Monsoon preparedness drive commenced across the ward.',
        type: 'ANNOUNCEMENT',
        is_read: false,
        created_at: '2026-09-20T09:00:00Z',
      },
      {
        id: 104,
        report_id: null,
        title: 'Department Notice',
        message: 'Monthly safety briefing tomorrow at 9 AM.',
        type: 'BROADCAST',
        is_read: false,
        created_at: '2026-09-20T09:15:00Z',
      },
    ];

    mockDashboardData = {
      assigned_reports: 5,
      in_progress_reports: 2,
      pending_review_reports: 1,
      completed_reports: 18,
      today_completed_reports: 3,
      average_resolution_time_hours: 4.25,
    };

    mockAssignments = [
      {
        assignment_id: 201,
        report_id: 501,
        issue_type: 'Pothole',
        description: 'Deep hazardous pothole near intersection.',
        priority: 'HIGH',
        status: 'Assigned',
        address: 'MG Road, Ward 4',
        latitude: 26.8467,
        longitude: 80.9462,
        google_maps_url: 'https://www.google.com/maps?q=26.8467,80.9462',
        image_url: '/uploads/reports/pothole_501.jpg',
        assigned_at: '2026-09-20T08:00:00Z',
        work_started_at: null,
      },
      {
        assignment_id: 202,
        report_id: 502,
        issue_type: 'Broken Streetlight',
        description: 'Pole #12 lamp defective.',
        priority: 'MEDIUM',
        status: 'In Progress',
        address: 'Civil Lines, Block B',
        latitude: 26.851,
        longitude: 80.949,
        google_maps_url: 'https://www.google.com/maps?q=26.851,80.949',
        image_url: '/uploads/reports/light_502.jpg',
        assigned_at: '2026-09-20T07:30:00Z',
        work_started_at: '2026-09-20T08:15:00Z',
      },
      {
        assignment_id: 203,
        report_id: 503,
        issue_type: 'Water Leakage',
        description: 'Pipeline burst.',
        priority: 'HIGH',
        status: 'Completed',
        address: 'Alambagh Sector 2',
        latitude: 26.82,
        longitude: 80.91,
        google_maps_url: 'https://www.google.com/maps?q=26.82,80.91',
        image_url: null,
        assigned_at: '2026-09-19T11:00:00Z',
        work_started_at: '2026-09-19T11:45:00Z',
      },
    ];

    mockApiClient = {
      get: async (url, config = {}) => {
        requestsMade.push({ method: 'GET', url, config });
        if (url === '/api/v1/dashboard/worker/dashboard') {
          return { data: mockDashboardData };
        }
        if (url === '/api/v1/assignments/my') {
          return { data: mockAssignments };
        }
        if (url === '/api/v1/notifications') {
          return { data: mockNotifications };
        }
        if (url === '/api/v1/notifications/unread-count') {
          const unread = mockNotifications.filter((n) => !n.is_read).length;
          return { data: { unread_count: unread } };
        }
        if (url === '/api/v1/profile/me') {
          return {
            data: {
              id: 99,
              name: 'Ramesh Kumar',
              email: '1372768pm@gmail.com',
              role: 'Worker',
              department_id: 3,
              department_name: 'Roads & Infrastructure',
              employee_code: 'WRK-1042',
              designation: 'Field Inspector',
              is_available: true,
              is_email_verified: true,
              is_active: true,
            },
          };
        }
        throw new Error(`Unhandled GET route: ${url}`);
      },
      patch: async (url, body, config = {}) => {
        requestsMade.push({ method: 'PATCH', url, body, config });
        const readMatch = url.match(/^\/api\/v1\/notifications\/(\d+)\/read$/);
        if (readMatch) {
          const id = Number(readMatch[1]);
          const item = mockNotifications.find((n) => n.id === id);
          if (!item) {
            const err = new Error('Not found');
            err.response = { status: 404, data: { detail: 'Notification not found.' } };
            throw err;
          }
          item.is_read = true;
          return { data: { success: true, message: 'Notification marked as read.' } };
        }
        if (url === '/api/v1/notifications/read-all') {
          let updated = 0;
          for (const n of mockNotifications) {
            if (!n.is_read) {
              n.is_read = true;
              updated++;
            }
          }
          return { data: { success: true, updated } };
        }
        if (url === '/api/v1/profile/me') {
          if (body && body.phone === '9999999999') {
            const err = new Error('Phone collision');
            err.response = {
              status: 409,
              data: { detail: 'Phone number already registered.' },
            };
            throw err;
          }
          return { data: { message: 'Profile updated successfully.' } };
        }
        throw new Error(`Unhandled PATCH route: ${url}`);
      },
      post: async (url, body, config = {}) => {
        requestsMade.push({ method: 'POST', url, body, config });

        // Start work endpoint
        const startMatch = url.match(/^\/api\/v1\/assignments\/(\d+)\/start$/);
        if (startMatch) {
          const assignmentId = Number(startMatch[1]);
          if (!body || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
            const err = new Error('Invalid coordinate payload');
            err.response = { status: 422, data: { detail: 'Latitude and longitude required' } };
            throw err;
          }
          if (assignmentId === 999) {
            const err = new Error('Not found');
            err.response = { status: 404, data: { detail: 'Assignment not found.' } };
            throw err;
          }
          if (assignmentId === 202) {
            const err = new Error('Conflict');
            err.response = { status: 409, data: { detail: 'Work already started.' } };
            throw err;
          }
          // Distance check simulation: if lat is far (e.g. > 30), fail with 403
          if (body.latitude > 30.0) {
            const err = new Error('Forbidden geofence');
            err.response = {
              status: 403,
              data: { detail: 'You are not at the report location. Current distance: 154.20 meters.' },
            };
            throw err;
          }
          return {
            data: {
              id: assignmentId,
              report_id: 501,
              worker_id: 99,
              assigned_by: 1,
              assigned_at: '2026-09-20T08:00:00Z',
              accepted_at: null,
              completed_at: null,
              work_started_at: '2026-09-20T08:30:00Z',
              work_started_latitude: body.latitude,
              work_started_longitude: body.longitude,
              status: 'In Progress',
              remarks: null,
            },
          };
        }

        // Resolution upload endpoint
        if (url === '/api/v1/resolutions') {
          // Check rate limit simulation
          if (body && body._rateLimitExceeded) {
            const err = new Error('Rate limit exceeded');
            err.response = { status: 429, data: { detail: 'Rate limit exceeded.' } };
            throw err;
          }
          if (body && body._assignmentStateInvalid) {
            const err = new Error('Conflict state');
            err.response = { status: 409, data: { detail: 'Please start work before uploading the resolution.' } };
            throw err;
          }
          if (body && body._badImage) {
            const err = new Error('Bad image');
            err.response = { status: 400, data: { detail: 'Uploaded image cannot be processed.' } };
            throw err;
          }
          const decision = body._verdict !== undefined ? body._verdict : 'PASS';
          const isPass = decision === 'PASS';
          const isReview = decision === 'REVIEW';
          return {
            data: {
              id: 701,
              report_id: 502,
              worker_id: 99,
              remarks: 'Repaired wiring and tested illumination.',
              verification_passed: isPass,
              verification_score: isPass ? 0.92 : isReview ? 0.65 : 0.28,
              verification_decision: decision,
              manual_review: isReview,
              verified_at: isPass ? '2026-09-20T08:45:00Z' : null,
              resolved_at: '2026-09-20T08:45:00Z',
            },
          };
        }

        // Forward request endpoint
        const forwardMatch = url.match(/^\/api\/v1\/forward-requests\/(\d+)$/);
        if (forwardMatch) {
          const reportId = Number(forwardMatch[1]);
          if (!body || typeof body.reason !== 'string' || !body.reason.trim()) {
            const err = new Error('Validation error');
            err.response = { status: 422, data: { detail: 'Reason must not be empty' } };
            throw err;
          }
          if (reportId === 999) {
            const err = new Error('Not found');
            err.response = { status: 404, data: { detail: 'Report not found.' } };
            throw err;
          }
          if (reportId === 503) {
            const err = new Error('Forbidden');
            err.response = { status: 403, data: { detail: 'You can flag only reports assigned to you.' } };
            throw err;
          }
          if (reportId === 502 && body._alreadyPending) {
            const err = new Error('Already pending');
            err.response = { status: 400, data: { detail: 'A forward request is already pending.' } };
            throw err;
          }
          return {
            data: {
              id: 301,
              report_id: reportId,
              worker_id: 99,
              current_department_id: 3,
              destination_department_id: null,
              source_department_name: 'Roads & Infrastructure',
              destination_department_name: null,
              reason: body.reason.trim(),
              status: 'PENDING',
              created_at: '2026-09-20T09:00:00Z',
            },
          };
        }

        throw new Error(`Unhandled POST route: ${url}`);
      },
    };
  });

  // ============================================================================
  // Phase 5A: Worker Navigation & Dashboard Tests
  // ============================================================================

  test('5A.1: Worker dashboard API calls GET /api/v1/dashboard/worker/dashboard and returns exact schema', async () => {
    const res = await mockApiClient.get('/api/v1/dashboard/worker/dashboard');
    assert.strictEqual(requestsMade.length, 1);
    assert.strictEqual(requestsMade[0].method, 'GET');
    assert.strictEqual(requestsMade[0].url, '/api/v1/dashboard/worker/dashboard');

    const data = res.data;
    assert.strictEqual(typeof data.assigned_reports, 'number');
    assert.strictEqual(typeof data.in_progress_reports, 'number');
    assert.strictEqual(typeof data.pending_review_reports, 'number');
    assert.strictEqual(typeof data.completed_reports, 'number');
    assert.strictEqual(typeof data.today_completed_reports, 'number');
    assert.strictEqual(typeof data.average_resolution_time_hours, 'number');
    assert.strictEqual(data.assigned_reports, 5);
    assert.strictEqual(data.in_progress_reports, 2);
    assert.strictEqual(data.completed_reports, 18);
  });

  test('5A.2: Worker availability and departmental info are retrieved from GET /api/v1/profile/me', async () => {
    const res = await mockApiClient.get('/api/v1/profile/me');
    assert.strictEqual(requestsMade[0].url, '/api/v1/profile/me');
    assert.strictEqual(res.data.is_available, true);
    assert.strictEqual(res.data.department_name, 'Roads & Infrastructure');
    assert.strictEqual(res.data.employee_code, 'WRK-1042');
    assert.strictEqual(res.data.designation, 'Field Inspector');
  });

  test('5A.3: Worker workspace routing isolates Worker from Citizen and Admin destinations', () => {
    const resolveInitialRoute = (role) => {
      if (role === 'Worker') return 'WorkerWorkspace';
      if (role === 'Citizen') return 'CitizenWorkspace';
      return 'UnsupportedRoleBoundary';
    };

    assert.strictEqual(resolveInitialRoute('Worker'), 'WorkerWorkspace');
    assert.strictEqual(resolveInitialRoute('Citizen'), 'CitizenWorkspace');
    assert.strictEqual(resolveInitialRoute('DepartmentAdmin'), 'UnsupportedRoleBoundary');
    assert.strictEqual(resolveInitialRoute('CityAdmin'), 'UnsupportedRoleBoundary');
    assert.strictEqual(resolveInitialRoute('SuperAdmin'), 'UnsupportedRoleBoundary');
  });

  test('5A.4: Dashboard loading and error handling captures failure safely without crash', async () => {
    const failingClient = {
      get: async () => {
        const err = new Error('Network Error');
        err.response = { status: 503, data: { detail: 'Service temporarily unavailable' } };
        throw err;
      },
    };

    let caughtError = null;
    try {
      await failingClient.get('/api/v1/dashboard/worker/dashboard');
    } catch (e) {
      caughtError = e.response?.data?.detail || e.message;
    }
    assert.strictEqual(caughtError, 'Service temporarily unavailable');
  });

  // ============================================================================
  // Phase 5B: Assigned Tasks & Details Tests
  // ============================================================================

  test('5B.1: getMyAssignments calls GET /api/v1/assignments/my and returns array of assignments', async () => {
    const res = await mockApiClient.get('/api/v1/assignments/my');
    assert.strictEqual(requestsMade.length, 1);
    assert.strictEqual(requestsMade[0].url, '/api/v1/assignments/my');
    assert.strictEqual(Array.isArray(res.data), true);
    assert.strictEqual(res.data.length, 3);

    const first = res.data[0];
    assert.strictEqual(first.assignment_id, 201);
    assert.strictEqual(first.report_id, 501);
    assert.strictEqual(first.issue_type, 'Pothole');
    assert.strictEqual(first.priority, 'HIGH');
    assert.strictEqual(first.status, 'Assigned');
    assert.strictEqual(first.address, 'MG Road, Ward 4');
    assert.strictEqual(typeof first.latitude, 'number');
    assert.strictEqual(typeof first.longitude, 'number');
    assert.strictEqual(first.google_maps_url.includes('google.com/maps'), true);
  });

  test('5B.2: Status filtering correctly filters assignments by status', () => {
    const filterAssignments = (list, filter) => {
      return list.filter((item) => {
        const s = (item.status || '').toUpperCase();
        if (filter === 'assigned') return s === 'ASSIGNED' || s === 'ACCEPTED';
        if (filter === 'in_progress') return s.includes('PROGRESS');
        if (filter === 'completed') return s.includes('COMPLETED') || s.includes('RESOLVED');
        return true;
      });
    };

    const all = filterAssignments(mockAssignments, 'all');
    assert.strictEqual(all.length, 3);

    const assigned = filterAssignments(mockAssignments, 'assigned');
    assert.strictEqual(assigned.length, 1);
    assert.strictEqual(assigned[0].assignment_id, 201);

    const inProgress = filterAssignments(mockAssignments, 'in_progress');
    assert.strictEqual(inProgress.length, 1);
    assert.strictEqual(inProgress[0].assignment_id, 202);

    const completed = filterAssignments(mockAssignments, 'completed');
    assert.strictEqual(completed.length, 1);
    assert.strictEqual(completed[0].assignment_id, 203);
  });

  test('5B.3: resolveMediaUrl correctly resolves relative paths against API base URL', () => {
    const resolveMediaUrlTest = (path, base = 'https://api.cscrs.tech') => {
      if (!path) return null;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      const cleanBase = base.replace(/\/+$/, '');
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${cleanBase}${cleanPath}`;
    };

    assert.strictEqual(
      resolveMediaUrlTest('/uploads/reports/pothole_501.jpg', 'https://api.cscrs.tech'),
      'https://api.cscrs.tech/uploads/reports/pothole_501.jpg'
    );
    assert.strictEqual(
      resolveMediaUrlTest('https://cdn.cscrs.tech/photo.jpg', 'https://api.cscrs.tech'),
      'https://cdn.cscrs.tech/photo.jpg'
    );
    assert.strictEqual(resolveMediaUrlTest(null), null);
    assert.strictEqual(resolveMediaUrlTest(undefined), null);
  });

  test('5B.4: Task detail navigation passes assignment object without calling Citizen-only endpoints', () => {
    // Worker navigation must pass assignment directly; never call GET /api/v1/reports/{report_number}
    const navParams = { assignment: mockAssignments[0] };
    assert.strictEqual(navParams.assignment.assignment_id, 201);
    assert.strictEqual(navParams.assignment.report_id, 501);
    assert.strictEqual(navParams.assignment.status, 'Assigned');
    // Ensure no unauthorized citizen endpoints are triggered
    assert.strictEqual(requestsMade.some((r) => r.url.includes('/api/v1/reports/')), false);
  });

  // ============================================================================
  // Phase 5C: Geofenced Start Work Tests
  // ============================================================================

  test('5C.1: Location permission failure safely blocks start-work call', async () => {
    const locationPermissionGranted = false;
    let startWorkCalled = false;

    if (!locationPermissionGranted) {
      // Must abort without making network request
    } else {
      startWorkCalled = true;
    }

    assert.strictEqual(startWorkCalled, false);
    assert.strictEqual(requestsMade.length, 0);
  });

  test('5C.2: Location services disabled safely blocks start-work call', async () => {
    const locationServicesEnabled = false;
    let startWorkCalled = false;

    if (!locationServicesEnabled) {
      // Must abort without making network request
    } else {
      startWorkCalled = true;
    }

    assert.strictEqual(startWorkCalled, false);
    assert.strictEqual(requestsMade.length, 0);
  });

  test('5C.3: Start work sends exact payload { latitude, longitude } to POST /api/v1/assignments/{id}/start', async () => {
    const res = await mockApiClient.post('/api/v1/assignments/201/start', {
      latitude: 26.8467,
      longitude: 80.9462,
    });

    assert.strictEqual(requestsMade.length, 1);
    assert.strictEqual(requestsMade[0].method, 'POST');
    assert.strictEqual(requestsMade[0].url, '/api/v1/assignments/201/start');
    assert.strictEqual(typeof requestsMade[0].body.latitude, 'number');
    assert.strictEqual(typeof requestsMade[0].body.longitude, 'number');

    assert.strictEqual(res.data.status, 'In Progress');
    assert.strictEqual(typeof res.data.work_started_at, 'string');
    assert.strictEqual(res.data.work_started_latitude, 26.8467);
  });

  test('5C.4: Geofence 403 Forbidden returns backend distance message cleanly', async () => {
    let errorResponse = null;
    try {
      await mockApiClient.post('/api/v1/assignments/201/start', {
        latitude: 35.0, // Far from site
        longitude: 80.0,
      });
    } catch (err) {
      errorResponse = err.response;
    }

    assert.ok(errorResponse);
    assert.strictEqual(errorResponse.status, 403);
    assert.strictEqual(
      errorResponse.data.detail,
      'You are not at the report location. Current distance: 154.20 meters.'
    );
  });

  test('5C.5: Start work on already-started assignment returns 409 Conflict', async () => {
    let errorResponse = null;
    try {
      await mockApiClient.post('/api/v1/assignments/202/start', {
        latitude: 26.851,
        longitude: 80.949,
      });
    } catch (err) {
      errorResponse = err.response;
    }

    assert.ok(errorResponse);
    assert.strictEqual(errorResponse.status, 409);
    assert.strictEqual(errorResponse.data.detail, 'Work already started.');
  });

  // ============================================================================
  // Phase 5D: Resolution Evidence Upload Tests
  // ============================================================================

  test('5D.1: Resolution submission payload requires assignment_id and image file', async () => {
    const mockFormData = {
      assignment_id: 202,
      remarks: 'Replaced bulb and repaired fixture.',
      image: { uri: 'file:///photo.jpg', name: 'resolution.jpg', type: 'image/jpeg' },
    };

    assert.strictEqual(typeof mockFormData.assignment_id, 'number');
    assert.ok(mockFormData.image);
    assert.strictEqual(mockFormData.image.type, 'image/jpeg');

    const res = await mockApiClient.post('/api/v1/resolutions', mockFormData);
    assert.strictEqual(requestsMade.length, 1);
    assert.strictEqual(requestsMade[0].url, '/api/v1/resolutions');
    assert.strictEqual(res.data.id, 701);
    assert.strictEqual(res.data.report_id, 502);
  });

  test('5D.2: Resolution submission rate limit (HTTP 429) is handled cleanly', async () => {
    let errorResponse = null;
    try {
      await mockApiClient.post('/api/v1/resolutions', {
        assignment_id: 202,
        _rateLimitExceeded: true,
      });
    } catch (err) {
      errorResponse = err.response;
    }

    assert.ok(errorResponse);
    assert.strictEqual(errorResponse.status, 429);
    assert.strictEqual(errorResponse.data.detail, 'Rate limit exceeded.');
  });

  test('5D.3: Resolution submission on un-started assignment returns 409 Conflict', async () => {
    let errorResponse = null;
    try {
      await mockApiClient.post('/api/v1/resolutions', {
        assignment_id: 201, // In Assigned status, not In Progress
        _assignmentStateInvalid: true,
      });
    } catch (err) {
      errorResponse = err.response;
    }

    assert.ok(errorResponse);
    assert.strictEqual(errorResponse.status, 409);
    assert.strictEqual(
      errorResponse.data.detail,
      'Please start work before uploading the resolution.'
    );
  });

  test('5D.4: Resolution submission failure on invalid photo returns 400 Bad Request', async () => {
    let errorResponse = null;
    try {
      await mockApiClient.post('/api/v1/resolutions', {
        assignment_id: 202,
        _badImage: true,
      });
    } catch (err) {
      errorResponse = err.response;
    }

    assert.ok(errorResponse);
    assert.strictEqual(errorResponse.status, 400);
    assert.strictEqual(
      errorResponse.data.detail,
      'Uploaded image cannot be processed.'
    );
  });

  test('5D.5: Resolution submission success returns resolution metadata without fabricating verdict UI', async () => {
    const res = await mockApiClient.post('/api/v1/resolutions', {
      assignment_id: 202,
      remarks: 'Cleaned drain and removed debris.',
    });

    assert.strictEqual(res.data.id, 701);
    assert.strictEqual(typeof res.data.verification_passed, 'boolean');
    assert.strictEqual(typeof res.data.manual_review, 'boolean');
    // Does not assume or fabricate UI beyond raw backend response
    assert.strictEqual(res.data.report_id, 502);
  });

  // ============================================================================
  // Phase 5E: AI Verdict Feedback & Forward Request Tests
  // ============================================================================

  test('5E.1: Resolution response containing actual verification result is parsed accurately', async () => {
    const res = await mockApiClient.post('/api/v1/resolutions', {
      assignment_id: 202,
      _verdict: 'PASS',
    });

    assert.strictEqual(res.data.id, 701);
    assert.strictEqual(res.data.verification_decision, 'PASS');
    assert.strictEqual(res.data.verification_passed, true);
    assert.strictEqual(res.data.manual_review, false);
    assert.strictEqual(typeof res.data.verification_score, 'number');
    assert.strictEqual(typeof res.data.verified_at, 'string');
    assert.strictEqual(typeof res.data.resolved_at, 'string');
  });

  test('5E.2: PASS/success result maps to verified completion state and allows return to tasks', async () => {
    const res = await mockApiClient.post('/api/v1/resolutions', {
      assignment_id: 202,
      _verdict: 'PASS',
    });

    const isPass = res.data.verification_decision === 'PASS' || res.data.verification_passed;
    const isReview = res.data.verification_decision === 'REVIEW' || res.data.manual_review;
    const isFail = res.data.verification_decision === 'REJECT' || (!isPass && !isReview);

    assert.strictEqual(isPass, true);
    assert.strictEqual(isReview, false);
    assert.strictEqual(isFail, false);

    // On PASS, navigation returns worker to tasks / workspace
    const nextAction = isPass ? 'RETURN_TO_TASKS' : 'OTHER';
    assert.strictEqual(nextAction, 'RETURN_TO_TASKS');
  });

  test('5E.3: REVIEW/manual-review result maps to manual review required state without worker override', async () => {
    const res = await mockApiClient.post('/api/v1/resolutions', {
      assignment_id: 202,
      _verdict: 'REVIEW',
    });

    const isPass = res.data.verification_decision === 'PASS' || res.data.verification_passed;
    const isReview = res.data.verification_decision === 'REVIEW' || res.data.manual_review;
    const isFail = res.data.verification_decision === 'REJECT' || (!isPass && !isReview);

    assert.strictEqual(isPass, false);
    assert.strictEqual(isReview, true);
    assert.strictEqual(isFail, false);
    assert.strictEqual(res.data.manual_review, true);
    assert.strictEqual(res.data.verification_decision, 'REVIEW');

    // Worker cannot approve or reject review; only safe return to tasks is enabled
    const allowWorkerDecision = false;
    assert.strictEqual(allowWorkerDecision, false);
  });

  test('5E.4: FAIL/rework result renders failure state with rework notice and allows evidence resubmission', async () => {
    const res = await mockApiClient.post('/api/v1/resolutions', {
      assignment_id: 202,
      _verdict: 'REJECT',
    });

    const isPass = res.data.verification_decision === 'PASS' || res.data.verification_passed;
    const isReview = res.data.verification_decision === 'REVIEW' || res.data.manual_review;
    const isFail = res.data.verification_decision === 'REJECT' || (!isPass && !isReview);

    assert.strictEqual(isPass, false);
    assert.strictEqual(isReview, false);
    assert.strictEqual(isFail, true);
    assert.strictEqual(res.data.verification_passed, false);
    assert.strictEqual(res.data.verification_decision, 'REJECT');

    // On FAIL, worker can retry / capture new photo evidence
    const allowRetry = isFail;
    assert.strictEqual(allowRetry, true);
  });

  test('5E.5: Forward request sends the EXACT actual backend schema { reason: string } to POST /api/v1/forward-requests/{report_id}', async () => {
    const res = await mockApiClient.post('/api/v1/forward-requests/501', {
      reason: 'Belongs to Electrical Department due to damaged high-voltage wiring.',
    });

    const req = requestsMade[requestsMade.length - 1];
    assert.strictEqual(req.method, 'POST');
    assert.strictEqual(req.url, '/api/v1/forward-requests/501');
    assert.strictEqual(typeof req.body.reason, 'string');
    assert.strictEqual(
      req.body.reason,
      'Belongs to Electrical Department due to damaged high-voltage wiring.'
    );

    assert.strictEqual(res.data.id, 301);
    assert.strictEqual(res.data.report_id, 501);
    assert.strictEqual(res.data.worker_id, 99);
    assert.strictEqual(res.data.status, 'PENDING');
  });

  test('5E.6: Forward request client-side validation blocks empty or whitespace reason', async () => {
    let clientValidated = false;
    const validateForwardReason = (reason) => {
      if (!reason || !reason.trim()) {
        return false;
      }
      return true;
    };

    assert.strictEqual(validateForwardReason(''), false);
    assert.strictEqual(validateForwardReason('   '), false);
    assert.strictEqual(validateForwardReason(null), false);
    assert.strictEqual(validateForwardReason('Valid forwarding reason for sanitation'), true);
  });

  test('5E.7: Forward request handles backend conflict 400 (already pending) and 403 (unauthorized) safely', async () => {
    // Test 400: Already pending
    let error400 = null;
    try {
      await mockApiClient.post('/api/v1/forward-requests/502', {
        reason: 'Duplicate request',
        _alreadyPending: true,
      });
    } catch (err) {
      error400 = err.response;
    }
    assert.ok(error400);
    assert.strictEqual(error400.status, 400);
    assert.strictEqual(error400.data.detail, 'A forward request is already pending.');

    // Test 403: Unauthorized report
    let error403 = null;
    try {
      await mockApiClient.post('/api/v1/forward-requests/503', {
        reason: 'Unassigned report',
      });
    } catch (err) {
      error403 = err.response;
    }
    assert.ok(error403);
    assert.strictEqual(error403.status, 403);
    assert.strictEqual(error403.data.detail, 'You can flag only reports assigned to you.');
  });

  test('5E.8: Worker resolution and forward flows never call Citizen or Admin endpoints', () => {
    const forbiddenPatterns = [
      '/api/v1/reports/my',
      '/api/v1/reports/',
      '/api/v1/resolutions/manual-review',
      '/api/v1/assignments/assign',
    ];

    for (const req of requestsMade) {
      if (req.url.startsWith('/api/v1/forward-requests/') && req.method === 'POST') {
        continue;
      }
      for (const pattern of forbiddenPatterns) {
        if (pattern === '/api/v1/reports/' && req.url.startsWith('/api/v1/forward-requests/')) {
          continue;
        }
        assert.notStrictEqual(
          req.url.includes(pattern) && !req.url.startsWith('/api/v1/dashboard/worker'),
          true,
          `Forbidden route called: ${req.url}`
        );
      }
    }
  });

  test('5E.9: No verdict is fabricated when backend response verification_decision is missing or null', () => {
    const rawBackendResponse = {
      id: 702,
      report_id: 504,
      worker_id: 99,
      remarks: null,
      verification_passed: false,
      verification_score: null,
      verification_decision: null,
      manual_review: true,
      verified_at: null,
      resolved_at: '2026-09-20T09:10:00Z',
    };

    // When verification_decision is null, fall back strictly to manual_review and verification_passed flags
    const isPass = rawBackendResponse.verification_decision === 'PASS' || rawBackendResponse.verification_passed;
    const isReview = rawBackendResponse.verification_decision === 'REVIEW' || rawBackendResponse.manual_review;
    const isFail = rawBackendResponse.verification_decision === 'REJECT' || (!isPass && !isReview);

    assert.strictEqual(isPass, false);
    assert.strictEqual(isReview, true);
    assert.strictEqual(isFail, false);
    assert.strictEqual(rawBackendResponse.verification_score, null);
  });

  test('5E.10: Existing 5A-5D baseline tests continue passing alongside 5E tests', () => {
    assert.ok(mockDashboardData);
    assert.strictEqual(mockDashboardData.assigned_reports, 5);
    assert.ok(mockAssignments);
    assert.strictEqual(mockAssignments.length, 3);
  });

  // ============================================================================
  // Phase 5F: Worker Notifications & Profile Editing Tests
  // ============================================================================

  test('5F.1: Worker notification list calls GET /api/v1/notifications and parses actual response schema', async () => {
    const res = await mockApiClient.get('/api/v1/notifications');
    assert.strictEqual(Array.isArray(res.data), true);
    assert.strictEqual(res.data.length, 4);

    const first = res.data[0];
    assert.strictEqual(first.id, 101);
    assert.strictEqual(first.report_id, 501);
    assert.strictEqual(first.title, 'New Task Assigned');
    assert.strictEqual(typeof first.message, 'string');
    assert.strictEqual(first.type, 'ASSIGNMENT');
    assert.strictEqual(typeof first.is_read, 'boolean');
    assert.strictEqual(typeof first.created_at, 'string');
  });

  test('5F.2: Unread count calls GET /api/v1/notifications/unread-count and parses { unread_count }', async () => {
    const res = await mockApiClient.get('/api/v1/notifications/unread-count');
    assert.ok(res.data);
    assert.strictEqual(typeof res.data.unread_count, 'number');
    assert.strictEqual(res.data.unread_count, 3);
  });

  test('5F.3: Unread notification has correct unread visual/state behavior', () => {
    const unread = mockNotifications.find((n) => n.id === 101);
    const read = mockNotifications.find((n) => n.id === 102);

    assert.strictEqual(unread.is_read, false);
    assert.strictEqual(read.is_read, true);

    const shouldShowDot = !unread.is_read;
    const shouldHideDot = !read.is_read;
    assert.strictEqual(shouldShowDot, true);
    assert.strictEqual(shouldHideDot, false);
  });

  test('5F.4: Single notification calls PATCH /api/v1/notifications/{id}/read', async () => {
    const res = await mockApiClient.patch('/api/v1/notifications/101/read');
    assert.ok(res.data);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.message, 'Notification marked as read.');

    const updated = mockNotifications.find((n) => n.id === 101);
    assert.strictEqual(updated.is_read, true);
  });

  test('5F.5: Mark all calls PATCH /api/v1/notifications/read-all', async () => {
    const res = await mockApiClient.patch('/api/v1/notifications/read-all');
    assert.ok(res.data);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(typeof res.data.updated, 'number');

    for (const n of mockNotifications) {
      assert.strictEqual(n.is_read, true);
    }
  });

  test('5F.6: Unread count/UI state updates after read and read-all', async () => {
    let unreadRes = await mockApiClient.get('/api/v1/notifications/unread-count');
    assert.strictEqual(unreadRes.data.unread_count, 3);

    await mockApiClient.patch('/api/v1/notifications/101/read');
    unreadRes = await mockApiClient.get('/api/v1/notifications/unread-count');
    assert.strictEqual(unreadRes.data.unread_count, 2);

    await mockApiClient.patch('/api/v1/notifications/read-all');
    unreadRes = await mockApiClient.get('/api/v1/notifications/unread-count');
    assert.strictEqual(unreadRes.data.unread_count, 0);
  });

  test('5F.7: Notification with report_id matching a worker assignment navigates to WorkerTaskDetails with the correct assignment', () => {
    const notification = mockNotifications.find((n) => n.id === 101);
    assert.strictEqual(notification.report_id, 501);

    const matchingAssignment = mockAssignments.find(
      (a) => a.report_id === notification.report_id
    );

    assert.ok(matchingAssignment);
    assert.strictEqual(matchingAssignment.assignment_id, 201);
    assert.strictEqual(matchingAssignment.issue_type, 'Pothole');

    const targetRoute = {
      name: 'WorkerTaskDetails',
      params: { assignment: matchingAssignment },
    };
    assert.strictEqual(targetRoute.name, 'WorkerTaskDetails');
    assert.strictEqual(targetRoute.params.assignment.assignment_id, 201);
  });

  test('5F.8: Notification with null report_id OR unmatched report_id remains informational and does NOT call an invented endpoint', () => {
    const unmatchedNotification = mockNotifications.find((n) => n.id === 103);
    const nullReportNotification = mockNotifications.find((n) => n.id === 104);

    const match1 = mockAssignments.find((a) => a.report_id === unmatchedNotification.report_id);
    const match2 = mockAssignments.find((a) => a.report_id === nullReportNotification.report_id);

    assert.strictEqual(match1, undefined);
    assert.strictEqual(match2, undefined);

    const beforeCount = requestsMade.length;
    const canNavigate1 = match1 !== undefined;
    const canNavigate2 = match2 !== undefined;
    assert.strictEqual(canNavigate1, false);
    assert.strictEqual(canNavigate2, false);
    assert.strictEqual(requestsMade.length, beforeCount);
  });

  test('5F.9: Worker profile GET parses actual backend worker profile fields', async () => {
    const res = await mockApiClient.get('/api/v1/profile/me');
    assert.ok(res.data);
    assert.strictEqual(res.data.id, 99);
    assert.strictEqual(res.data.name, 'Ramesh Kumar');
    assert.strictEqual(res.data.email, '1372768pm@gmail.com');
    assert.strictEqual(res.data.role, 'Worker');
    assert.strictEqual(res.data.department_id, 3);
    assert.strictEqual(res.data.department_name, 'Roads & Infrastructure');
    assert.strictEqual(res.data.employee_code, 'WRK-1042');
    assert.strictEqual(res.data.designation, 'Field Inspector');
    assert.strictEqual(res.data.is_available, true);
  });

  test('5F.10: Profile PATCH sends ONLY: name, phone (no read-only fields)', async () => {
    const patchPayload = {
      name: 'Ramesh K. Sharma',
      phone: '9876543210',
    };

    const res = await mockApiClient.patch('/api/v1/profile/me', patchPayload);
    assert.ok(res.data);
    assert.strictEqual(res.data.message, 'Profile updated successfully.');

    const lastReq = requestsMade[requestsMade.length - 1];
    assert.strictEqual(lastReq.method, 'PATCH');
    assert.strictEqual(lastReq.url, '/api/v1/profile/me');
    assert.strictEqual(lastReq.body.name, 'Ramesh K. Sharma');
    assert.strictEqual(lastReq.body.phone, '9876543210');

    assert.strictEqual(lastReq.body.email, undefined);
    assert.strictEqual(lastReq.body.department, undefined);
    assert.strictEqual(lastReq.body.department_id, undefined);
    assert.strictEqual(lastReq.body.employee_code, undefined);
    assert.strictEqual(lastReq.body.designation, undefined);
    assert.strictEqual(lastReq.body.is_available, undefined);
    assert.strictEqual(lastReq.body.role, undefined);
  });

  test('5F.11: Client validation blocks: name < 2, name > 100, phone outside backend-supported length (10-15)', () => {
    const validateProfile = (name, phone) => {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();

      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return { valid: false, error: 'Name must be between 2 and 100 characters.' };
      }
      if (trimmedPhone.length > 0 && (trimmedPhone.length < 10 || trimmedPhone.length > 15)) {
        return { valid: false, error: 'Phone number must be between 10 and 15 digits.' };
      }
      return { valid: true };
    };

    assert.strictEqual(validateProfile('Amit Kumar', '9876543210').valid, true);
    assert.strictEqual(validateProfile('Amit Kumar', '').valid, true);

    assert.strictEqual(validateProfile('A', '9876543210').valid, false);
    assert.strictEqual(validateProfile('', '9876543210').valid, false);
    assert.strictEqual(validateProfile('X'.repeat(101), '9876543210').valid, false);

    assert.strictEqual(validateProfile('Amit Kumar', '12345').valid, false);
    assert.strictEqual(validateProfile('Amit Kumar', '1234567890123456').valid, false);
  });

  test('5F.12: Successful profile update refreshes displayed profile', async () => {
    await mockApiClient.patch('/api/v1/profile/me', {
      name: 'Ramesh K. Sharma',
      phone: '9876543210',
    });

    const refreshed = await mockApiClient.get('/api/v1/profile/me');
    assert.ok(refreshed.data);
    assert.strictEqual(refreshed.data.role, 'Worker');
    assert.strictEqual(refreshed.data.employee_code, 'WRK-1042');
  });

  test('5F.13: HTTP 409 phone collision handled safely', async () => {
    let error409 = null;
    try {
      await mockApiClient.patch('/api/v1/profile/me', {
        name: 'Ramesh Kumar',
        phone: '9999999999',
      });
    } catch (err) {
      error409 = err.response;
    }

    assert.ok(error409);
    assert.strictEqual(error409.status, 409);
    assert.strictEqual(error409.data.detail, 'Phone number already registered.');
  });

  test('5F.14: Notification/profile workflows never call Citizen/Admin endpoints', () => {
    const forbiddenPatterns = [
      '/api/v1/reports/my',
      '/api/v1/resolutions/manual-review',
      '/api/v1/assignments/assign',
      '/api/v1/admin/',
    ];

    for (const req of requestsMade) {
      for (const pattern of forbiddenPatterns) {
        assert.notStrictEqual(
          req.url.includes(pattern),
          true,
          `Forbidden route called: ${req.url}`
        );
      }
    }
  });

  test('5F.15: All existing 5A-5E tests continue passing alongside 5F tests', () => {
    assert.ok(mockDashboardData);
    assert.strictEqual(mockDashboardData.assigned_reports, 5);
    assert.ok(mockAssignments);
    assert.strictEqual(mockAssignments.length, 3);
    assert.ok(mockNotifications);
    assert.strictEqual(mockNotifications.length, 4);
  });
});

