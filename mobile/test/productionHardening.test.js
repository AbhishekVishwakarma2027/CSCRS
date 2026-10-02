const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Replicate or directly test env resolution logic under various process.env states
const PRODUCTION_API_URL = 'https://api.cscrs.tech';
const STAGING_API_URL = 'https://staging-api.cscrs.in';

const resolveEnvType = (raw) => {
  if (raw === 'production') return 'production';
  if (raw === 'staging') return 'staging';
  return 'development';
};

const resolveApiPort = (raw) => {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return !isNaN(parsed) && parsed > 0 ? parsed : 8000;
};

const resolveApiUrl = (envType = resolveEnvType(process.env['EXPO_PUBLIC_ENV'])) => {
  const explicitUrl = process.env['EXPO_PUBLIC_API_URL']?.trim();

  // Production: MUST strictly resolve to https://api.cscrs.tech.
  // Local .env.local development URLs (e.g. Cloudflare tunnels or localhost)
  // must never silently override production builds.
  if (envType === 'production') {
    return PRODUCTION_API_URL;
  }

  // Staging
  if (envType === 'staging') {
    return explicitUrl && explicitUrl.length > 0
      ? explicitUrl.replace(/\/+$/, '')
      : STAGING_API_URL;
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
  const configuredHost =
    process.env['EXPO_PUBLIC_DEV_HOST']?.trim() ||
    process.env['EXPO_PUBLIC_LAN_HOST']?.trim();

  if (configuredHost) {
    return `http://${configuredHost}:${port}`;
  }

  return `http://10.0.2.2:${port}`;
};

// app.config.ts safeguard validation logic
const resolveAppConfigApiUrl = (appEnv, explicitApiUrl) => {
  let resolvedApiUrl;
  if (appEnv === 'production') {
    if (explicitApiUrl && explicitApiUrl !== 'https://api.cscrs.tech') {
      throw new Error(
        `[PRODUCTION BUILD SAFEGUARD] Production environment (EXPO_PUBLIC_ENV=production) cannot use non-production API URL: "${explicitApiUrl}". ` +
        `Production builds must strictly target https://api.cscrs.tech. Please check .env.local or build flags.`
      );
    }
    resolvedApiUrl = 'https://api.cscrs.tech';
  } else if (appEnv === 'staging') {
    resolvedApiUrl = explicitApiUrl || 'https://staging-api.cscrs.in';
  } else if (explicitApiUrl && !explicitApiUrl.includes('127.0.0.1')) {
    resolvedApiUrl = explicitApiUrl;
  } else {
    resolvedApiUrl = 'http://10.0.2.2:8000';
  }
  return resolvedApiUrl;
};

// Helper to inspect i18n translation source files
const readTranslationFile = (fileName) => {
  const filePath = path.resolve(__dirname, '../src/core/i18n/translations', fileName);
  return fs.readFileSync(filePath, 'utf8');
};

const enSource = readTranslationFile('en.ts');
const hiSource = readTranslationFile('hi.ts');
const typesSource = fs.readFileSync(path.resolve(__dirname, '../src/core/i18n/types.ts'), 'utf8');
const envSource = fs.readFileSync(path.resolve(__dirname, '../packages/config/src/env.ts'), 'utf8');
const appConfigSource = fs.readFileSync(path.resolve(__dirname, '../apps/cscrs-mobile/app.config.ts'), 'utf8');

describe('CSCRS Mobile: Production Hardening Patch Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // =========================================================================
  // 1. Production Environment Safety (P2-1)
  // =========================================================================
  test('1. Production environment resolves deterministically to https://api.cscrs.tech', () => {
    process.env['EXPO_PUBLIC_ENV'] = 'production';
    delete process.env['EXPO_PUBLIC_API_URL'];

    const resolved = resolveApiUrl('production');
    assert.equal(resolved, 'https://api.cscrs.tech');
  });

  test('2. Development environment still resolves to development API URL / tunnel', () => {
    process.env['EXPO_PUBLIC_ENV'] = 'development';
    const devTunnel = 'https://residential-notre-sites-recognised.trycloudflare.com';
    process.env['EXPO_PUBLIC_API_URL'] = devTunnel;

    const resolved = resolveApiUrl('development');
    assert.equal(resolved, devTunnel);
  });

  test('3. Production cannot silently resolve to development tunnel URL even if .env.local sets EXPO_PUBLIC_API_URL', () => {
    process.env['EXPO_PUBLIC_ENV'] = 'production';
    process.env['EXPO_PUBLIC_API_URL'] = 'https://residential-notre-sites-recognised.trycloudflare.com';

    const resolved = resolveApiUrl('production');
    // Must strictly be production URL, ignoring the dev tunnel
    assert.equal(resolved, 'https://api.cscrs.tech');
    assert.notEqual(resolved, 'https://residential-notre-sites-recognised.trycloudflare.com');
  });

  test('4. packages/config/src/env.ts exports PRODUCTION_API_URL and enforces strictly in resolveApiUrl', () => {
    assert.ok(envSource.includes("export const PRODUCTION_API_URL = 'https://api.cscrs.tech';"));
    assert.ok(envSource.includes("if (envType === 'production') {\n    return PRODUCTION_API_URL;\n  }"));
  });

  test('5. app.config.ts safeguard throws fatal error if production build detects non-production API URL', () => {
    const devTunnel = 'https://residential-notre-sites-recognised.trycloudflare.com';

    assert.throws(
      () => resolveAppConfigApiUrl('production', devTunnel),
      /PRODUCTION BUILD SAFEGUARD/
    );

    // Approved production URL passes without error
    const approved = resolveAppConfigApiUrl('production', 'https://api.cscrs.tech');
    assert.equal(approved, 'https://api.cscrs.tech');

    // Default with no explicit URL passes and resolves to production URL
    const defaultProd = resolveAppConfigApiUrl('production', undefined);
    assert.equal(defaultProd, 'https://api.cscrs.tech');
  });

  test('6. app.config.ts contains PRODUCTION BUILD SAFEGUARD in source', () => {
    assert.ok(appConfigSource.includes('[PRODUCTION BUILD SAFEGUARD]'));
    assert.ok(appConfigSource.includes("explicitApiUrl !== 'https://api.cscrs.tech'"));
    assert.ok(appConfigSource.includes("resolvedApiUrl = 'https://api.cscrs.tech'"));
  });

  // =========================================================================
  // 2. Worker i18n Translations Coverage (P3-1)
  // =========================================================================
  test('7. Worker i18n keys are declared in types.ts TranslationSchema', () => {
    const expectedKeys = [
      'geofenceNoticeTitle',
      'mapNoticeTitle',
      'cannotOpenMapMsg',
      'mapErrorTitle',
      'unableToLaunchMapsMsg',
      'errorTitle',
      'unableToLaunchCameraMsg',
      'unableToOpenPhotosMsg',
      'cameraPermissionMsg',
      'photoLibraryPermissionMsg',
      'readOnlyHeading',
      'namePlaceholder',
      'phonePlaceholder',
      'departmentInfoHeading',
    ];

    for (const key of expectedKeys) {
      assert.ok(typesSource.includes(`${key}: string;`), `types.ts missing ${key}: string;`);
    }
  });

  test('8. Worker task details alert and map strings exist in English and Hindi translations', () => {
    // English
    assert.ok(enSource.includes("geofenceNoticeTitle: 'Geofence Notice'"));
    assert.ok(enSource.includes("mapNoticeTitle: 'Notice'"));
    assert.ok(enSource.includes("cannotOpenMapMsg: 'Cannot open map URL on this device.'"));
    assert.ok(enSource.includes("mapErrorTitle: 'Error'"));
    assert.ok(enSource.includes("unableToLaunchMapsMsg: 'Unable to launch maps.'"));

    // Hindi
    assert.ok(hiSource.includes("geofenceNoticeTitle: 'जियोफेंस सूचना'"));
    assert.ok(hiSource.includes("mapNoticeTitle: 'सूचना'"));
    assert.ok(hiSource.includes("cannotOpenMapMsg: 'इस डिवाइस पर मानचित्र URL नहीं खोला जा सकता।'"));
    assert.ok(hiSource.includes("mapErrorTitle: 'त्रुटि'"));
    assert.ok(hiSource.includes("unableToLaunchMapsMsg: 'मानचित्र खोलने में असमर्थ।'"));
  });

  test('9. Worker resolution camera/photo permission and error strings exist in English and Hindi', () => {
    // English
    assert.ok(enSource.includes("errorTitle: 'Error'"));
    assert.ok(enSource.includes("unableToLaunchCameraMsg: 'Unable to launch camera. Please try again.'"));
    assert.ok(enSource.includes("unableToOpenPhotosMsg: 'Unable to open photos. Please try again.'"));
    assert.ok(enSource.includes("cameraPermissionMsg: 'Camera permission is required to capture resolution photos.'"));
    assert.ok(enSource.includes("photoLibraryPermissionMsg: 'Photo library permission is required to select resolution photos.'"));

    // Hindi
    assert.ok(hiSource.includes("errorTitle: 'त्रुटि'"));
    assert.ok(hiSource.includes("unableToLaunchCameraMsg: 'कैमरा खोलने में असमर्थ। कृपया पुनः प्रयास करें।'"));
    assert.ok(hiSource.includes("unableToOpenPhotosMsg: 'फ़ोटो खोलने में असमर्थ। कृपया पुनः प्रयास करें।'"));
    assert.ok(hiSource.includes("cameraPermissionMsg: 'समाधान फ़ोटो लेने के लिए कैमरा अनुमति आवश्यक है।'"));
    assert.ok(hiSource.includes("photoLibraryPermissionMsg: 'समाधान फ़ोटो चुनने के लिए फ़ोटो लाइब्रेरी अनुमति आवश्यक है।'"));
  });

  test('10. Worker profile read-only heading and placeholder strings exist in English and Hindi', () => {
    // English
    assert.ok(enSource.includes("readOnlyHeading: '🔒 Official Municipal Details (Read-Only)'"));
    assert.ok(enSource.includes("namePlaceholder: 'Enter full name'"));
    assert.ok(enSource.includes("phonePlaceholder: 'e.g. 9876543210'"));
    assert.ok(enSource.includes("departmentInfoHeading: 'Department Information'"));

    // Hindi
    assert.ok(hiSource.includes("readOnlyHeading: '🔒 आधिकारिक नगरपालिका विवरण (केवल पढ़ने के लिए)'"));
    assert.ok(hiSource.includes("namePlaceholder: 'पूरा नाम दर्ज करें'"));
    assert.ok(hiSource.includes("phonePlaceholder: 'उदा. 9876543210'"));
    assert.ok(hiSource.includes("departmentInfoHeading: 'विभागीय विवरण'"));
  });

  // =========================================================================
  // 3. Worker Screen Integration (P3-1)
  // =========================================================================
  test('11. Worker screens use localized keys instead of hardcoded English strings', () => {
    const taskDetailsSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/features/worker/screens/WorkerTaskDetailsScreen.tsx'),
      'utf8'
    );
    const resolutionSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/features/worker/screens/WorkerResolutionSubmitScreen.tsx'),
      'utf8'
    );
    const profileSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/features/worker/screens/WorkerProfileScreen.tsx'),
      'utf8'
    );

    // Verify task details
    assert.ok(!taskDetailsSrc.includes("Alert.alert('Geofence Notice',"));
    assert.ok(taskDetailsSrc.includes("t('workerTaskDetails', 'geofenceNoticeTitle')"));
    assert.ok(!taskDetailsSrc.includes("Alert.alert('Notice', 'Cannot open map URL on this device.');"));
    assert.ok(taskDetailsSrc.includes("t('workerTaskDetails', 'cannotOpenMapMsg')"));
    assert.ok(!taskDetailsSrc.includes("Alert.alert('Error', 'Unable to launch maps.');"));
    assert.ok(taskDetailsSrc.includes("t('workerTaskDetails', 'unableToLaunchMapsMsg')"));

    // Verify resolution submit
    assert.ok(!resolutionSrc.includes("'Camera permission is required to capture resolution photos.'"));
    assert.ok(resolutionSrc.includes("t('workerResolution', 'cameraPermissionMsg')"));
    assert.ok(!resolutionSrc.includes("Alert.alert('Error', 'Unable to launch camera. Please try again.');"));
    assert.ok(resolutionSrc.includes("t('workerResolution', 'unableToLaunchCameraMsg')"));
    assert.ok(!resolutionSrc.includes("Alert.alert('Error', 'Unable to open photos. Please try again.');"));
    assert.ok(resolutionSrc.includes("t('workerResolution', 'unableToOpenPhotosMsg')"));

    // Verify profile
    assert.ok(!profileSrc.includes('placeholder="Enter full name"'));
    assert.ok(profileSrc.includes("placeholder={t('workerProfile', 'namePlaceholder')}"));
    assert.ok(!profileSrc.includes('placeholder="e.g. 9876543210"'));
    assert.ok(profileSrc.includes("placeholder={t('workerProfile', 'phonePlaceholder')}"));
    assert.ok(!profileSrc.includes('🔒 Official Municipal Details (Read-Only)\n'));
    assert.ok(profileSrc.includes("{t('workerProfile', 'readOnlyHeading')}"));
    assert.ok(profileSrc.includes("{t('workerProfile', 'departmentInfoHeading')}"));
  });
});
