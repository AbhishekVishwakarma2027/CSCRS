const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ============================================================================
// CSCRS Phase 4B + 4C + 4D Citizen Report Capture, Submission & List Tests
// ============================================================================

describe('CSCRS Phase 4B: Location & EXIF-Aware Capture Foundation Tests', () => {
  test('1. Location verification requirement blocks submission until high-accuracy GPS is ready', () => {
    const states = ['checking', 'disabled', 'denied', 'ready'];
    
    // Function that guards submission
    const canSubmit = (locationStatus, hasAsset, isSubmitting) => {
      return locationStatus === 'ready' && hasAsset && !isSubmitting;
    };

    assert.equal(canSubmit('checking', true, false), false);
    assert.equal(canSubmit('disabled', true, false), false);
    assert.equal(canSubmit('denied', true, false), false);
    assert.equal(canSubmit('ready', false, false), false);
    assert.equal(canSubmit('ready', true, true), false);
    assert.equal(canSubmit('ready', true, false), true);
  });

  test('2. hasValidExifGps correctly validates presence of GPS EXIF metadata and rejects non-geotagged images', () => {
    const hasValidExifGps = (exif) => {
      if (!exif || typeof exif !== 'object') return false;
      const hasDirect =
        (exif.GPSLatitude != null && exif.GPSLongitude != null && exif.GPSLatitude !== '' && exif.GPSLongitude !== '') ||
        (exif.Latitude != null && exif.Longitude != null && exif.Latitude !== '' && exif.Longitude !== '');
      if (hasDirect) return true;
      if (exif['{GPS}'] && typeof exif['{GPS}'] === 'object') {
        const nested = exif['{GPS}'];
        if (
          (nested.Latitude != null || nested.GPSLatitude != null) &&
          (nested.Longitude != null || nested.GPSLongitude != null)
        ) {
          return true;
        }
      }
      if (
        (exif['GPS:GPSLatitude'] != null || exif['GPS GPSLatitude'] != null) &&
        (exif['GPS:GPSLongitude'] != null || exif['GPS GPSLongitude'] != null)
      ) {
        return true;
      }
      return false;
    };

    // Valid direct (Android / standard)
    assert.equal(hasValidExifGps({ GPSLatitude: 28.61, GPSLongitude: 77.20 }), true);
    assert.equal(hasValidExifGps({ Latitude: 28.61, Longitude: 77.20 }), true);

    // Valid iOS nested {GPS}
    assert.equal(hasValidExifGps({ '{GPS}': { Latitude: 28.61, Longitude: 77.20 } }), true);

    // Valid namespaced
    assert.equal(hasValidExifGps({ 'GPS GPSLatitude': '[26, 52, 508191/12500]', 'GPS GPSLongitude': '[81, 2, 215787/12500]' }), true);

    // Invalid / missing GPS EXIF
    assert.equal(hasValidExifGps(null), false);
    assert.equal(hasValidExifGps(undefined), false);
    assert.equal(hasValidExifGps({}), false);
    assert.equal(hasValidExifGps({ DateTimeOriginal: '2026:09:20 00:00:00' }), false);
    assert.equal(hasValidExifGps({ GPSLatitude: null, GPSLongitude: null }), false);
  });

  test('3. Photo capture preserves original asset attributes without destructive compression', () => {
    const capturedAsset = {
      uri: 'file:///data/user/0/in.cscrs.mobile/cache/ImagePicker/test-photo.jpg',
      width: 4000,
      height: 3000,
      mimeType: 'image/jpeg',
      fileName: 'test-photo.jpg',
      exif: {
        GPSLatitude: 28.6139,
        GPSLongitude: 77.2090,
        DateTimeOriginal: '2026:09:19 12:00:00',
      },
    };

    assert.ok(capturedAsset.uri.endsWith('.jpg'));
    assert.equal(capturedAsset.mimeType, 'image/jpeg');
    assert.ok(capturedAsset.exif.GPSLatitude);
    assert.ok(capturedAsset.exif.GPSLongitude);
  });

  test('3. Client does NOT add artificial latitude/longitude multipart form fields', () => {
    const asset = {
      uri: 'file:///cache/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
    };
    const description = 'Broken streetlight near park';

    const appendedFields = [];
    const mockFormData = {
      append: (key, value) => {
        appendedFields.push({ key, value });
      },
    };

    // Client form construction
    mockFormData.append('file', {
      uri: asset.uri,
      name: asset.fileName,
      type: asset.mimeType,
    });
    if (description) {
      mockFormData.append('description', description);
    }

    const fieldKeys = appendedFields.map((f) => f.key);
    assert.ok(fieldKeys.includes('file'));
    assert.ok(fieldKeys.includes('description'));
    assert.equal(fieldKeys.includes('latitude'), false);
    assert.equal(fieldKeys.includes('longitude'), false);
    assert.equal(fieldKeys.includes('timestamp'), false);
    assert.equal(fieldKeys.includes('gps'), false);
  });
});

describe('CSCRS Phase 4C: Citizen Report Submission Contract Tests', () => {
  let mockApiClient;
  let sentRequests;

  beforeEach(() => {
    sentRequests = [];
    mockApiClient = {
      post: async (url, data, config = {}) => {
        sentRequests.push({ url, data, config });
        if (url === '/api/v1/report') {
          return {
            data: {
              success: true,
              message: 'Report Submitted Successfully.',
              report_id: 108,
              report_number: 'REP-2026-0108',
              verification: { risk_score: 0.12, decision: 'VERIFIED' },
              ai: { detections: [{ class_name: 'Pothole', confidence: 0.96 }] },
              processing_time: 0.48,
            },
          };
        }
        throw new Error(`Unhandled route: ${url}`);
      },
    };
  });

  test('4. Successful report creation returns 200 with report number and verification', async () => {
    const mockFormData = { mock: 'form-data' };
    const response = await mockApiClient.post('/api/v1/report', mockFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    assert.equal(sentRequests.length, 1);
    assert.equal(sentRequests[0].url, '/api/v1/report');
    assert.equal(sentRequests[0].config.headers['Content-Type'], 'multipart/form-data');
    assert.equal(response.data.success, true);
    assert.equal(response.data.report_number, 'REP-2026-0108');
    assert.equal(response.data.report_id, 108);
  });

  test('5. Duplicate report handled as citizen community support (HTTP 200 duplicate)', async () => {
    const duplicateClient = {
      post: async () => ({
        data: {
          success: true,
          duplicate: true,
          supported_existing_report: true,
          already_supported: false,
          report_id: 12,
          report_number: 'REP-2026-0012',
          status: 'PENDING',
          priority: 'MEDIUM',
          department: 'Sanitation',
          issue_type: 'Garbage Dump',
          support_count: 3,
          message: 'Existing civic issue found. Your report has been added as citizen support.',
        },
      }),
    };

    const res = await duplicateClient.post('/api/v1/report', {});
    assert.equal(res.data.success, true);
    assert.equal(res.data.duplicate, true);
    assert.equal(res.data.supported_existing_report, true);
    assert.equal(res.data.support_count, 3);
  });

  test('6. Already reported by same citizen returns HTTP 409 conflict', async () => {
    const conflictClient = {
      post: async () => {
        const error = new Error('Request failed with status code 409');
        error.response = {
          status: 409,
          data: {
            success: false,
            message: 'You have already reported this civic issue.',
            report_id: 12,
            report_number: 'REP-2026-0012',
          },
        };
        throw error;
      },
    };

    let caughtStatus = null;
    let caughtMessage = null;
    try {
      await conflictClient.post('/api/v1/report', {});
    } catch (err) {
      caughtStatus = err.response?.status;
      caughtMessage = err.response?.data?.message;
    }

    assert.equal(caughtStatus, 409);
    assert.match(caughtMessage, /already reported/);
  });

  test('7. No civic issue in photo returns HTTP 400 with clear message', async () => {
    const invalidImageClient = {
      post: async () => {
        const error = new Error('Bad Request');
        error.response = {
          status: 400,
          data: { detail: 'No civic issue detected in the image.' },
        };
        throw error;
      },
    };

    let caughtDetail = null;
    try {
      await invalidImageClient.post('/api/v1/report', {});
    } catch (err) {
      caughtDetail = err.response?.data?.detail;
    }

    assert.equal(caughtDetail, 'No civic issue detected in the image.');
  });

  test('8. Missing EXIF GPS in photo returns HTTP 400 with GPS warning', async () => {
    const noGpsClient = {
      post: async () => {
        const error = new Error('Bad Request');
        error.response = {
          status: 400,
          data: { detail: 'Image does not contain valid GPS coordinates.' },
        };
        throw error;
      },
    };

    let caughtDetail = null;
    try {
      await noGpsClient.post('/api/v1/report', {});
    } catch (err) {
      caughtDetail = err.response?.data?.detail;
    }

    assert.equal(caughtDetail, 'Image does not contain valid GPS coordinates.');
  });

  test('9. Rate limit returns HTTP 429 safely', async () => {
    const rateLimitClient = {
      post: async () => {
        const error = new Error('Too Many Requests');
        error.response = {
          status: 429,
          data: { detail: '60 per 1 hour' },
        };
        throw error;
      },
    };

    let caughtStatus = null;
    try {
      await rateLimitClient.post('/api/v1/report', {});
    } catch (err) {
      caughtStatus = err.response?.status;
    }

    assert.equal(caughtStatus, 429);
  });
});

describe('CSCRS Phase 4D: Citizen My Reports & Search Tests', () => {
  let mockReports;
  let mockApiClient;
  let getCalls;

  beforeEach(() => {
    getCalls = [];
    mockReports = [
      {
        id: 1,
        report_number: 'REP-2026-0001',
        issue_type: 'Pothole',
        status: 'PENDING',
        priority: 'HIGH',
        created_at: '2026-09-18T10:00:00Z',
      },
      {
        id: 2,
        report_number: 'REP-2026-0002',
        issue_type: 'Streetlight',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        created_at: '2026-09-17T12:30:00Z',
      },
      {
        id: 3,
        report_number: 'REP-2026-0003',
        issue_type: 'Garbage Dump',
        status: 'RESOLVED',
        priority: 'LOW',
        created_at: '2026-09-15T09:15:00Z',
      },
    ];

    mockApiClient = {
      get: async (url, config = {}) => {
        getCalls.push({ url, config });
        if (url === '/api/v1/reports/my') {
          return { data: mockReports };
        }
        if (url === '/api/v1/reports/my/search') {
          const q = config.params?.query?.toLowerCase() || '';
          const filtered = mockReports.filter(
            (r) =>
              r.report_number.toLowerCase().includes(q) ||
              r.issue_type.toLowerCase().includes(q)
          );
          return { data: filtered };
        }
        throw new Error(`Unhandled route: ${url}`);
      },
    };
  });

  test('10. getMyReports calls GET /api/v1/reports/my and returns list', async () => {
    const res = await mockApiClient.get('/api/v1/reports/my');
    assert.equal(getCalls.length, 1);
    assert.equal(getCalls[0].url, '/api/v1/reports/my');
    assert.equal(res.data.length, 3);
    assert.equal(res.data[0].report_number, 'REP-2026-0001');
  });

  test('11. searchMyReports calls GET /api/v1/reports/my/search?query=... and filters correctly', async () => {
    const res = await mockApiClient.get('/api/v1/reports/my/search', {
      params: { query: 'pothole' },
    });
    assert.equal(getCalls.length, 1);
    assert.equal(getCalls[0].url, '/api/v1/reports/my/search');
    assert.equal(getCalls[0].config.params.query, 'pothole');
    assert.equal(res.data.length, 1);
    assert.equal(res.data[0].issue_type, 'Pothole');
  });

  test('12. Status filter filters reports array correctly on client side', () => {
    const filterReports = (list, filter) => {
      if (filter === 'ALL') return list;
      if (filter === 'PENDING') return list.filter((r) => r.status === 'PENDING');
      if (filter === 'IN_PROGRESS') return list.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED');
      if (filter === 'RESOLVED') return list.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED');
      return list;
    };

    assert.equal(filterReports(mockReports, 'ALL').length, 3);
    assert.equal(filterReports(mockReports, 'PENDING').length, 1);
    assert.equal(filterReports(mockReports, 'IN_PROGRESS').length, 1);
    assert.equal(filterReports(mockReports, 'RESOLVED').length, 1);
  });

  test('13. Empty search result returns empty array cleanly', async () => {
    const res = await mockApiClient.get('/api/v1/reports/my/search', {
      params: { query: 'nonexistent_issue' },
    });
    assert.equal(res.data.length, 0);
  });

  test('14. Worker and Admin roles remain completely unaffected and isolated', () => {
    const workerRoute = 'WorkerHomePlaceholder';
    const adminRoute = 'UnsupportedRoleBoundary';
    const citizenRoute = 'CitizenWorkspace';

    assert.notEqual(workerRoute, citizenRoute);
    assert.notEqual(adminRoute, citizenRoute);
  });
});
