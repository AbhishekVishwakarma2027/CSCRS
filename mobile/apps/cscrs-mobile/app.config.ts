import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env['EXPO_PUBLIC_ENV'] || 'development';
  const explicitApiUrl = process.env['EXPO_PUBLIC_API_URL']?.trim();
  const devHost =
    process.env['EXPO_PUBLIC_DEV_HOST']?.trim() ||
    process.env['EXPO_PUBLIC_LAN_HOST']?.trim();
  const apiPort = process.env['EXPO_PUBLIC_API_PORT'] || '8000';

  // Environment-driven API URL resolution for config metadata
  let resolvedApiUrl: string;
  if (appEnv === 'production') {
    // Deterministic safeguard: reject build if a development tunnel or non-production URL is actively provided
    if (explicitApiUrl && explicitApiUrl !== 'https://api.cscrs.in') {
      throw new Error(
        `[PRODUCTION BUILD SAFEGUARD] Production environment (EXPO_PUBLIC_ENV=production) cannot use non-production API URL: "${explicitApiUrl}". ` +
        `Production builds must strictly target https://api.cscrs.in. Please check .env.local or build flags.`
      );
    }
    resolvedApiUrl = 'https://api.cscrs.in';
  } else if (appEnv === 'staging') {
    resolvedApiUrl = explicitApiUrl || 'https://staging-api.cscrs.in';
  } else if (explicitApiUrl && !explicitApiUrl.includes('127.0.0.1')) {
    resolvedApiUrl = explicitApiUrl;
  } else if (devHost) {
    resolvedApiUrl = `http://${devHost}:${apiPort}`;
  } else {
    // Dynamic runtime will select between 10.0.2.2 (Android) and 127.0.0.1 (iOS)
    resolvedApiUrl = `http://10.0.2.2:${apiPort}`;
  }

  return {
    ...config,
    name: 'CSCRS',
    slug: 'cscrs-mobile',
    scheme: 'cscrs',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/app-icon/icon.png',
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'in.cscrs.mobile',
      supportsTablet: false,
    },
    android: {
      package: 'in.cscrs.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/app-icon/adaptive-foreground.png',
        backgroundColor: '#FFFFFF',
      },
    },
    extra: {
      appEnv,
      apiUrl: resolvedApiUrl,
      isPlaceholderAssets: false,
      assetsNotice: 'Production branding assets integrated.',
      storeIcon: './assets/app-icon/play-store-512.png',
      eas: {
        projectId: 'cscrs-mobile-project-id',
      },
    },
    plugins: [
      'expo-status-bar',
      [
        'expo-image-picker',
        {
          photosPermission: 'CSCRS requires photo access to attach civic issue photos.',
          cameraPermission: 'CSCRS requires camera access to capture civic issue photos with location verification.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'CSCRS requires foreground location access to verify civic issue coordinates.',
        },
      ],
    ],
  };
};
