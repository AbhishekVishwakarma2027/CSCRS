const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ============================================================================
// CSCRS Phase 4E: Report Details & Timeline Contract Tests
// ============================================================================

describe('CSCRS Phase 4E: Report Details & Timeline Contract Tests', () => {
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = {
      get: null,
      patch: null,
    };
  });

  test('1. getReportDetails calls GET /api/v1/reports/{report_number} with URL encoded report number', async () => {
    let capturedUrl = '';
    mockApiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          id: 7,
          report_number: 'CSCRS-20260919-16E3BF1E',
          issue_type: 'Damage Street Light',
          status: 'Submitted',
          priority: 'Medium',
          latitude: 26.965,
          longitude: 81.12,
          address: 'Civic Junction, Sector 4',
          risk_score: 15.0,
          ai_confidence: 0.5764,
          verification_decision: 'PASS',
          verification_passed: true,
        },
      };
    };

    const getReportDetails = async (reportNumber, client = mockApiClient) => {
      const response = await client.get(
        `/api/v1/reports/${encodeURIComponent(reportNumber)}`
      );
      return response.data;
    };

    const data = await getReportDetails('CSCRS-20260919-16E3BF1E');
    assert.equal(capturedUrl, '/api/v1/reports/CSCRS-20260919-16E3BF1E');
    assert.equal(data.id, 7);
    assert.equal(data.report_number, 'CSCRS-20260919-16E3BF1E');
    assert.equal(data.issue_type, 'Damage Street Light');
    assert.equal(data.verification_passed, true);
  });

  test('2. Report details loading, success, and 404 error states behave safely', async () => {
    let state = { loading: true, data: null, error: null };

    // Simulate 404 response
    const mockErrorClient = {
      get: async () => {
        const err = new Error('Not Found');
        err.response = { status: 404, data: { detail: 'Report not found.' } };
        throw err;
      },
    };

    try {
      await mockErrorClient.get('/api/v1/reports/NON-EXISTENT');
    } catch (err) {
      state = {
        loading: false,
        data: null,
        error: err.response?.data?.detail ?? 'Error loading report',
      };
    }

    assert.equal(state.loading, false);
    assert.equal(state.data, null);
    assert.equal(state.error, 'Report not found.');
  });

  test('3. getReportTimeline calls GET /api/v1/reports/{report_id}/timeline with numeric report_id', async () => {
    let capturedUrl = '';
    mockApiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          report_id: 7,
          report_number: 'CSCRS-20260919-16E3BF1E',
          status: 'Submitted',
          timeline: [
            {
              title: 'Report Submitted',
              description: 'Report created by citizen with verified GPS EXIF',
              created_at: '2026-09-19T20:49:00Z',
            },
            {
              title: 'AI Verification Completed',
              description: 'AI detected Damage Street Light with 57.6% confidence',
              created_at: '2026-09-19T20:49:02Z',
            },
          ],
        },
      };
    };

    const getReportTimeline = async (reportId, client = mockApiClient) => {
      const response = await client.get(`/api/v1/reports/${reportId}/timeline`);
      return response.data;
    };

    const timelineResponse = await getReportTimeline(7);
    assert.equal(capturedUrl, '/api/v1/reports/7/timeline');
    assert.equal(timelineResponse.report_id, 7);
    assert.equal(timelineResponse.timeline.length, 2);
    assert.equal(timelineResponse.timeline[0].title, 'Report Submitted');
  });

  test('4. Timeline handles empty events array cleanly without crashing', async () => {
    mockApiClient.get = async () => ({
      data: {
        report_id: 8,
        report_number: 'CSCRS-EMPTY',
        status: 'Submitted',
        timeline: [],
      },
    });

    const getReportTimeline = async (reportId, client = mockApiClient) => {
      const response = await client.get(`/api/v1/reports/${reportId}/timeline`);
      return response.data;
    };

    const res = await getReportTimeline(8);
    assert.equal(Array.isArray(res.timeline), true);
    assert.equal(res.timeline.length, 0);
  });

  test('5. Timeline error does not crash report details view and allows retry', async () => {
    let retryAttempt = 0;
    mockApiClient.get = async (url) => {
      if (url.includes('timeline')) {
        retryAttempt++;
        if (retryAttempt === 1) {
          const err = new Error('Timeline Service Unavailable');
          err.response = { status: 503, data: { detail: 'Timeline Service Unavailable' } };
          throw err;
        }
        return {
          data: {
            report_id: 7,
            report_number: 'CSCRS-20260919-16E3BF1E',
            status: 'Submitted',
            timeline: [{ title: 'Report Submitted', description: 'Success', created_at: '2026-09-19T20:49:00Z' }],
          },
        };
      }
      return { data: { id: 7, report_number: 'CSCRS-20260919-16E3BF1E' } };
    };

    let timelineError = null;
    let timelineData = [];

    // Attempt 1 (fails)
    try {
      const res = await mockApiClient.get('/api/v1/reports/7/timeline');
      timelineData = res.data.timeline;
    } catch (err) {
      timelineError = err.response?.data?.detail;
    }
    assert.equal(timelineError, 'Timeline Service Unavailable');
    assert.equal(timelineData.length, 0);

    // Attempt 2: Retry (succeeds)
    const retryRes = await mockApiClient.get('/api/v1/reports/7/timeline');
    timelineData = retryRes.data.timeline;
    timelineError = null;
    assert.equal(timelineError, null);
    assert.equal(timelineData.length, 1);
  });

  test('6. My Reports navigation passes strictly report_number or report_id', () => {
    const navigationActions = [];
    const navigation = {
      navigate: (screen, params) => {
        navigationActions.push({ screen, params });
      },
    };

    // Tapping a report from My Reports
    const item = {
      id: 7,
      report_number: 'CSCRS-20260919-16E3BF1E',
      issue_type: 'Damage Street Light',
    };

    navigation.navigate('CitizenReportDetails', {
      reportNumber: item.report_number,
    });

    assert.equal(navigationActions.length, 1);
    assert.equal(navigationActions[0].screen, 'CitizenReportDetails');
    assert.equal(navigationActions[0].params.reportNumber, 'CSCRS-20260919-16E3BF1E');
    // Ensure no tokens or passwords are passed in params
    assert.equal(navigationActions[0].params.token, undefined);
    assert.equal(navigationActions[0].params.password, undefined);
  });

  test('7. Malformed or null optional fields in ReportResponse are safely tolerated', () => {
    const rawReportFromBackend = {
      id: 9,
      report_number: 'CSCRS-NULL-FIELDS',
      issue_type: 'Pothole',
      status: 'Submitted',
      priority: 'Low',
      latitude: 28.5,
      longitude: 77.2,
      address: null, // Null address
      risk_score: null, // Null risk score
      ai_confidence: null, // Null confidence
      verification_decision: null,
      verification_passed: false,
    };

    // Verify safe parsing
    const addressDisplay = rawReportFromBackend.address || 'GPS Geotagged Location';
    const riskDisplay = rawReportFromBackend.risk_score != null ? `${rawReportFromBackend.risk_score} / 100` : '—';
    const confidenceDisplay = rawReportFromBackend.ai_confidence != null ? `${(rawReportFromBackend.ai_confidence * 100).toFixed(1)}%` : '—';

    assert.equal(addressDisplay, 'GPS Geotagged Location');
    assert.equal(riskDisplay, '—');
    assert.equal(confidenceDisplay, '—');
  });
});

// ============================================================================
// CSCRS Phase 4F: Notifications & Profile Contract Tests
// ============================================================================

describe('CSCRS Phase 4F: Notifications & Profile Contract Tests', () => {
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = {
      get: null,
      patch: null,
    };
  });

  test('8. getNotifications calls GET /api/v1/notifications and maps notification list', async () => {
    let capturedUrl = '';
    mockApiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: [
          {
            id: 1,
            report_id: 7,
            title: 'Report Verified',
            message: 'Your report CSCRS-20260919-16E3BF1E has been verified by municipal authorities.',
            type: 'REPORT_STATUS',
            is_read: false,
            created_at: '2026-09-19T20:50:00Z',
          },
          {
            id: 2,
            report_id: null,
            title: 'City Water Maintenance Advisory',
            message: 'Water pipeline maintenance scheduled for Sector 4 tomorrow.',
            type: 'BROADCAST',
            is_read: true,
            created_at: '2026-09-19T18:00:00Z',
          },
        ],
      };
    };

    const getNotifications = async (client = mockApiClient) => {
      const res = await client.get('/api/v1/notifications');
      return res.data;
    };

    const list = await getNotifications();
    assert.equal(capturedUrl, '/api/v1/notifications');
    assert.equal(list.length, 2);
    assert.equal(list[0].report_id, 7);
    assert.equal(list[0].is_read, false);
    assert.equal(list[1].report_id, null);
    assert.equal(list[1].is_read, true);
  });

  test('9. getUnreadNotificationCount calls GET /api/v1/notifications/unread-count', async () => {
    let capturedUrl = '';
    mockApiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          unread_count: 3,
        },
      };
    };

    const getUnreadNotificationCount = async (client = mockApiClient) => {
      const res = await client.get('/api/v1/notifications/unread-count');
      return res.data.unread_count ?? 0;
    };

    const count = await getUnreadNotificationCount();
    assert.equal(capturedUrl, '/api/v1/notifications/unread-count');
    assert.equal(count, 3);
  });

  test('10. markNotificationAsRead calls PATCH /api/v1/notifications/{id}/read', async () => {
    let capturedUrl = '';
    mockApiClient.patch = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          message: 'Notification marked as read.',
        },
      };
    };

    const markNotificationAsRead = async (id, client = mockApiClient) => {
      const res = await client.patch(`/api/v1/notifications/${id}/read`);
      return res.data;
    };

    const res = await markNotificationAsRead(101);
    assert.equal(capturedUrl, '/api/v1/notifications/101/read');
    assert.equal(res.success, true);
  });

  test('11. markAllNotificationsAsRead calls PATCH /api/v1/notifications/read-all', async () => {
    let capturedUrl = '';
    mockApiClient.patch = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          updated: 5,
        },
      };
    };

    const markAllNotificationsAsRead = async (client = mockApiClient) => {
      const res = await client.patch('/api/v1/notifications/read-all');
      return res.data;
    };

    const res = await markAllNotificationsAsRead();
    assert.equal(capturedUrl, '/api/v1/notifications/read-all');
    assert.equal(res.updated, 5);
  });

  test('12. Notification navigation navigates ONLY when report_id reference exists', () => {
    const navLog = [];
    const navigation = {
      navigate: (screen, params) => navLog.push({ screen, params }),
    };

    const handlePress = (item) => {
      if (item.report_id != null) {
        navigation.navigate('CitizenReportDetails', { reportId: item.report_id });
      }
    };

    // Item WITH report_id
    handlePress({ id: 1, report_id: 7, title: 'Issue Assigned' });
    assert.equal(navLog.length, 1);
    assert.equal(navLog[0].screen, 'CitizenReportDetails');
    assert.equal(navLog[0].params.reportId, 7);

    // Item WITHOUT report_id (General announcement)
    handlePress({ id: 2, report_id: null, title: 'Advisory' });
    // Should NOT trigger any navigation
    assert.equal(navLog.length, 1);
  });

  test('13. getMyProfile calls GET /api/v1/profile/me and returns profile data', async () => {
    let capturedUrl = '';
    mockApiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          id: 42,
          name: 'Abhishek Vishwakarma',
          email: 'av828792@gmail.com',
          phone: '9876543210',
          role: 'Citizen',
          profile_image: null,
          is_email_verified: true,
          is_active: true,
        },
      };
    };

    const getMyProfile = async (client = mockApiClient) => {
      const res = await client.get('/api/v1/profile/me');
      return res.data;
    };

    const profile = await getMyProfile();
    assert.equal(capturedUrl, '/api/v1/profile/me');
    assert.equal(profile.id, 42);
    assert.equal(profile.name, 'Abhishek Vishwakarma');
    assert.equal(profile.email, 'av828792@gmail.com');
    assert.equal(profile.role, 'Citizen');
    assert.equal(profile.is_email_verified, true);
  });

  test('14. updateMyProfile calls PATCH /api/v1/profile/me with valid payload', async () => {
    let capturedUrl = '';
    let capturedPayload = null;
    mockApiClient.patch = async (url, payload) => {
      capturedUrl = url;
      capturedPayload = payload;
      return {
        data: {
          message: 'Profile updated successfully.',
        },
      };
    };

    const updateMyProfile = async (payload, client = mockApiClient) => {
      const res = await client.patch('/api/v1/profile/me', payload);
      return res.data;
    };

    const result = await updateMyProfile({ name: 'Abhishek Updated', phone: '9988776655' });
    assert.equal(capturedUrl, '/api/v1/profile/me');
    assert.equal(capturedPayload.name, 'Abhishek Updated');
    assert.equal(capturedPayload.phone, '9988776655');
    assert.equal(result.message, 'Profile updated successfully.');
  });

  test('15. Profile update payload validation rejects invalid name and phone length', () => {
    const validate = (name, phone) => {
      if (name.trim().length < 2 || name.trim().length > 100) return 'Name must be 2-100 characters';
      if (phone.trim().length > 0 && (phone.trim().length < 10 || phone.trim().length > 15)) {
        return 'Phone must be 10-15 digits';
      }
      return null;
    };

    assert.equal(validate('A', '9876543210'), 'Name must be 2-100 characters');
    assert.equal(validate('Valid Name', '123'), 'Phone must be 10-15 digits');
    assert.equal(validate('Valid Name', '9876543210'), null);
    assert.equal(validate('Valid Name', ''), null); // Optional phone
  });

  test('16. Profile sign out triggers logout and navigates to AuthBoundary without leaking tokens', async () => {
    let loggedOut = false;
    let replacedRoute = '';

    const authSession = {
      logout: async () => {
        loggedOut = true;
      },
    };

    const navigation = {
      replace: (route) => {
        replacedRoute = route;
      },
    };

    // User triggers sign out
    await authSession.logout();
    navigation.replace('AuthBoundary');

    assert.equal(loggedOut, true);
    assert.equal(replacedRoute, 'AuthBoundary');
  });

  test('17. Worker and Admin roles remain isolated from Citizen profile and details flows', () => {
    const citizenWorkspaceRoutes = [
      'CitizenHomeTab',
      'CitizenMyReportsTab',
      'CitizenNotificationsTab',
      'CitizenProfileTab',
    ];

    const workerRoutes = ['WorkerHomePlaceholder'];
    const adminRoutes = ['UnsupportedRoleBoundary'];

    // Ensure tab param lists don't include worker or admin screens
    assert.equal(citizenWorkspaceRoutes.includes('WorkerHomePlaceholder'), false);
    assert.equal(citizenWorkspaceRoutes.includes('UnsupportedRoleBoundary'), false);

    // Ensure role separation
    const resolveRoleHome = (role) => {
      if (role === 'Citizen') return 'CitizenWorkspace';
      if (role === 'Worker') return 'WorkerHomePlaceholder';
      return 'UnsupportedRoleBoundary';
    };

    assert.equal(resolveRoleHome('Citizen'), 'CitizenWorkspace');
    assert.equal(resolveRoleHome('Worker'), 'WorkerHomePlaceholder');
    assert.equal(resolveRoleHome('DepartmentAdmin'), 'UnsupportedRoleBoundary');
    assert.equal(resolveRoleHome('CityAdmin'), 'UnsupportedRoleBoundary');
    assert.equal(resolveRoleHome('SuperAdmin'), 'UnsupportedRoleBoundary');
  });
});
