import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { getOnboardingPreferences } from '@cscrs/storage';
import { useI18n } from '../../../core/i18n';
import { useAuthSession } from '../../../core/auth';
import { RootStackParamList } from '../../../app/navigation/types';

// The play-store-512 asset contains the official CSCRS civic logo on a clean white background,
// avoiding the black canvas edges present in icon.png to ensure a clean light splash screen.
const CSCRS_SPLASH_LOGO = require('../../../../apps/cscrs-mobile/assets/app-icon/play-store-512.png');

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SplashNavProp>();
  const { theme } = useTheme();
  const { colors, radii } = theme;
  const { setLanguage, t } = useI18n();
  const { initializeSession } = useAuthSession();
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setStatusMessage(t('splash', 'restoring'));

        // Retrieve stored preferences
        const prefs = await getOnboardingPreferences();

        // If language was saved, synchronize with i18n
        if (prefs.language) {
          await setLanguage(prefs.language);
        }

        // Delay slightly for smooth transition without visual flicker
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!isMounted) return;

        // Sequence check: If onboarding is NOT completed, remain in onboarding flow.
        // DO NOT call /auth/me or initialize auth during onboarding.
        if (!prefs.isCompleted || !prefs.role) {
          navigation.replace('LanguageSelection');
          return;
        }

        // Onboarding IS completed: initialize authentication session
        setStatusMessage('Checking authentication...');
        const initResult = await initializeSession();

        if (!isMounted) return;

        if (initResult.status === 'authenticated') {
          // Authoritative backend role routing
          if (initResult.role === 'Worker') {
            navigation.replace('WorkerWorkspace');
          } else {
            navigation.replace('CitizenWorkspace');
          }
        } else if (initResult.status === 'unsupported_role') {
          navigation.replace('UnsupportedRoleBoundary');
        } else {
          // Unauthenticated -> Phase 3 Auth Boundary
          navigation.replace('AuthBoundary');
        }
      } catch (error) {
        console.warn('Bootstrap error:', error);
        if (isMounted) {
          navigation.replace('LanguageSelection');
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.centerContent}>
        {/* Brand Civic Logo */}
        <Image
          source={CSCRS_SPLASH_LOGO}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="CSCRS Logo"
        />

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          CSCRS Mobile
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('splash', 'subtitle')}
        </Text>
      </View>

      {/* Footer / Loader */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
