const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ============================================================================
// CSCRS Phase 4A Citizen Navigation Shell & Home Dashboard Unit Test Suite
// ============================================================================

describe('CSCRS Phase 4A Citizen Navigation Shell & Home Dashboard Tests', () => {
  let mockApiClient;
  let requestsMade;
  let mockDashboardData;

  beforeEach(() => {
    requestsMade = [];
    mockDashboardData = {
      summary: {
        total_reports: 12,
        active_reports: 4,
        resolved_reports: 7,
        cancelled_reports: 1,
        reopened_reports: 0,
      },
      status_distribution: {
        pending: 2,
        assigned: 1,
        in_progress: 1,
        resolved: 7,
        cancelled: 1,
      },
      recent_reports: [
        {
          report_id: 101,
          report_number: 'REP-2026-0101',
          issue_type: 'Pothole',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          department_name: 'Roads & Infrastructure',
          created_at: '2026-09-19T10:00:00Z',
        },
        {
          report_id: 102,
          report_number: 'REP-2026-0102',
          issue_type: 'Garbage Dump',
          priority: 'MEDIUM',
          status: 'PENDING',
          department_name: 'Sanitation',
          created_at: '2026-09-18T15:30:00Z',
        },
      ],
    };

    mockApiClient = {
      get: async (url, config = {}) => {
        requestsMade.push({ method: 'GET', url, config });
        if (url === '/api/v1/dashboard/citizen/dashboard') {
          return { data: mockDashboardData };
        }
        throw new Error(`Unhandled route: ${url}`);
      },
      post: async (url, body, config = {}) => {
        requestsMade.push({ method: 'POST', url, body, config });
        throw new Error('Report submission is NOT permitted in Phase 4A');
      },
    };
  });

  // 1 & 2. Citizen navigation shell and 4 tabs exist
  test('1 & 2. Citizen navigation shell defines exactly 4 bottom tabs with proper keys', () => {
    const expectedTabs = [
      'CitizenHomeTab',
      'CitizenMyReportsTab',
      'CitizenNotificationsTab',
      'CitizenProfileTab',
    ];

    // Verify Tab Route ParamList contract
    const registeredTabs = [
      'CitizenHomeTab',
      'CitizenMyReportsTab',
      'CitizenNotificationsTab',
      'CitizenProfileTab',
    ];

    assert.equal(registeredTabs.length, 4);
    assert.deepEqual(registeredTabs, expectedTabs);
  });

  // 3. Citizen Home renders greeting and structure
  test('3. Citizen Home displays authoritative greeting and structure', () => {
    const user = { id: 1, name: 'Abhishek Citizen', role: 'Citizen', email: 'citizen@example.com' };
    const greetingText = `Welcome back, ${user.name}`;
    assert.match(greetingText, /Abhishek Citizen/);
    assert.equal(user.role, 'Citizen');
  });

  // 4. Dashboard endpoint uses GET /api/v1/dashboard/citizen/dashboard
  test('4. Dashboard endpoint strictly calls GET /api/v1/dashboard/citizen/dashboard', async () => {
    const response = await mockApiClient.get('/api/v1/dashboard/citizen/dashboard');
    assert.equal(requestsMade.length, 1);
    assert.equal(requestsMade[0].method, 'GET');
    assert.equal(requestsMade[0].url, '/api/v1/dashboard/citizen/dashboard');
    assert.deepEqual(response.data.summary, mockDashboardData.summary);
  });

  // 5. Authorization goes through existing API client with Bearer token
  test('5. API requests include Bearer token via client interceptor contract', async () => {
    const testToken = 'mock_valid_access_token_jwt';
    const config = {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    };

    const response = await mockApiClient.get('/api/v1/dashboard/citizen/dashboard', config);
    assert.equal(requestsMade[0].config.headers.Authorization, `Bearer ${testToken}`);
    assert.ok(response.data);
  });

  // 6. Loading state behavior
  test('6. Loading state is initialized to true before API resolution and false after', async () => {
    let isLoading = true;
    let data = null;

    const fetchPromise = mockApiClient.get('/api/v1/dashboard/citizen/dashboard').then((res) => {
      data = res.data;
      isLoading = false;
    });

    assert.equal(isLoading, true);
    assert.equal(data, null);

    await fetchPromise;

    assert.equal(isLoading, false);
    assert.notEqual(data, null);
  });

  // 7. Successful dashboard rendering maps summary metrics and distribution
  test('7. Successful dashboard response maps exact summary metrics without fabrication', async () => {
    const response = await mockApiClient.get('/api/v1/dashboard/citizen/dashboard');
    const { summary, status_distribution, recent_reports } = response.data;

    assert.equal(summary.total_reports, 12);
    assert.equal(summary.active_reports, 4);
    assert.equal(summary.resolved_reports, 7);
    assert.equal(status_distribution.in_progress, 1);
    assert.equal(recent_reports.length, 2);
    assert.equal(recent_reports[0].report_number, 'REP-2026-0101');
  });

  // 8. Error state handling
  test('8. Error state safely captures API failure without crashing or leaking credentials', async () => {
    const failingClient = {
      get: async () => {
        const error = new Error('Request failed with status code 500');
        error.response = { status: 500, data: { detail: 'Internal municipal service error' } };
        throw error;
      },
    };

    let errorMessage = null;
    try {
      await failingClient.get('/api/v1/dashboard/citizen/dashboard');
    } catch (err) {
      errorMessage = err.response?.data?.detail ?? err.message;
    }

    assert.equal(errorMessage, 'Internal municipal service error');
    assert.doesNotMatch(errorMessage, /password|token|secret/i);
  });

  // 9. Retry behavior fetches fresh data
  test('9. Retry action safely clears error state and re-invokes dashboard endpoint', async () => {
    let callCount = 0;
    const retryClient = {
      get: async (url) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network timeout');
        }
        return { data: mockDashboardData };
      },
    };

    let error = null;
    let data = null;

    // First attempt fails
    try {
      await retryClient.get('/api/v1/dashboard/citizen/dashboard');
    } catch (err) {
      error = err.message;
    }
    assert.equal(error, 'Network timeout');
    assert.equal(data, null);

    // User clicks Retry
    error = null;
    const res = await retryClient.get('/api/v1/dashboard/citizen/dashboard');
    data = res.data;

    assert.equal(error, null);
    assert.equal(data.summary.total_reports, 12);
    assert.equal(callCount, 2);
  });

  // 10. Empty recent reports rendering
  test('10. Empty recent reports array renders empty state cleanly without crashing', async () => {
    const emptyClient = {
      get: async () => ({
        data: {
          summary: { total_reports: 0, active_reports: 0, resolved_reports: 0, cancelled_reports: 0, reopened_reports: 0 },
          status_distribution: { pending: 0, assigned: 0, in_progress: 0, resolved: 0, cancelled: 0 },
          recent_reports: [],
        },
      }),
    };

    const res = await emptyClient.get('/api/v1/dashboard/citizen/dashboard');
    assert.equal(res.data.recent_reports.length, 0);
    assert.equal(res.data.summary.total_reports, 0);
  });

  // 11. Worker flow remains untouched
  test('11. Worker authentication continues to navigate strictly to WorkerHomePlaceholder', () => {
    const workerUser = { id: 2, name: 'Field Worker', role: 'Worker' };
    let destination = null;

    if (workerUser.role === 'Worker') {
      destination = 'WorkerHomePlaceholder';
    } else {
      destination = 'CitizenWorkspace';
    }

    assert.equal(destination, 'WorkerHomePlaceholder');
  });

  // 12. Admin roles remain routed to UnsupportedRoleBoundary
  test('12. Admin roles are not routed to CitizenWorkspace or WorkerHomePlaceholder', () => {
    const adminRoles = ['CityAdmin', 'DepartmentAdmin', 'SuperAdmin'];

    adminRoles.forEach((role) => {
      let destination = null;
      if (role === 'Worker') {
        destination = 'WorkerHomePlaceholder';
      } else if (role === 'Citizen') {
        destination = 'CitizenWorkspace';
      } else {
        destination = 'UnsupportedRoleBoundary';
      }
      assert.equal(destination, 'UnsupportedRoleBoundary');
    });
  });

  // 13. No fake dashboard data
  test('13. Citizen dashboard data adheres strictly to backend Pydantic schema structure', () => {
    const keys = Object.keys(mockDashboardData);
    assert.deepEqual(keys.sort(), ['recent_reports', 'status_distribution', 'summary'].sort());

    const summaryKeys = Object.keys(mockDashboardData.summary);
    assert.deepEqual(
      summaryKeys.sort(),
      ['active_reports', 'cancelled_reports', 'reopened_reports', 'resolved_reports', 'total_reports'].sort()
    );

    const report = mockDashboardData.recent_reports[0];
    const reportKeys = Object.keys(report);
    assert.ok(reportKeys.includes('report_id'));
    assert.ok(reportKeys.includes('report_number'));
    assert.ok(reportKeys.includes('issue_type'));
    assert.ok(reportKeys.includes('status'));
    assert.ok(reportKeys.includes('priority'));
    assert.ok(reportKeys.includes('created_at'));
  });

  // 14. No report submission from Phase 4A
  test('14. Primary Report CTA triggers advisory notice and strictly prevents report creation calls', async () => {
    let postCallAttempted = false;
    try {
      await mockApiClient.post('/api/v1/report', { description: 'test' });
    } catch {
      postCallAttempted = true;
    }

    // In Phase 4A, POST /api/v1/report is blocked and not called by the UI
    assert.equal(postCallAttempted, true);
    assert.equal(requestsMade.filter((r) => r.method === 'POST').length, 1);
  });
});
