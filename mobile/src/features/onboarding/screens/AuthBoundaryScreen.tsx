import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import {
  getOnboardingPreferences,
  resetOnboardingPreferences,
} from '@cscrs/storage';
import { AppLanguage, MobilePersona } from '@cscrs/models';
import { useI18n } from '../../../core/i18n';
import { useAuthSession } from '../../../core/auth';
import { RootStackParamList } from '../../../app/navigation/types';

type AuthBoundaryNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'AuthBoundary'
>;

export const AuthBoundaryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AuthBoundaryNavProp>();
  const { theme, toggleTheme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { language, t } = useI18n();
  const { status, user } = useAuthSession();

  const [activeRole, setActiveRole] = useState<MobilePersona | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<AppLanguage>(language);

  // Authoritative session reaction: if authenticated or unsupported role, transition to appropriate destination
  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (user.role === 'Worker') {
        navigation.replace('WorkerWorkspace');
      } else {
        navigation.replace('CitizenWorkspace');
      }
    } else if (status === 'unsupported_role') {
      navigation.replace('UnsupportedRoleBoundary');
    }
  }, [status, user, navigation]);

  useEffect(() => {
    getOnboardingPreferences().then((prefs) => {
      if (prefs.role) setActiveRole(prefs.role);
      if (prefs.language) setActiveLanguage(prefs.language);
    });
  }, [language]);

  const handleReset = async () => {
    await resetOnboardingPreferences();
    navigation.replace('LanguageSelection');
  };

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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.success + '20' },
              ]}
            >
              <View
                style={[styles.dot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {t('authBoundary', 'phase3Ready')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.themeBtn,
                { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Text style={[styles.themeBtnText, { color: colors.foreground }]}>
                {theme.isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('authBoundary', 'title')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('authBoundary', 'subtitle')}
          </Text>
        </View>

        {/* Selected Persona & Language Summary */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Configured User Session
          </Text>

          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>
              {t('authBoundary', 'configuredRole')}:
            </Text>
            <View style={[styles.roleChip, { backgroundColor: colors.primary }]}>
              <Text
                style={[styles.roleChipText, { color: colors.primaryForeground }]}
              >
                {activeRole ? activeRole.toUpperCase() : 'CITIZEN'}
              </Text>
            </View>
          </View>

          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>
              {t('authBoundary', 'configuredLanguage')}:
            </Text>
            <Text style={[styles.kvValue, { color: colors.foreground }]}>
              {activeLanguage === 'hi' ? 'Hindi (हिन्दी)' : 'English (EN)'}
            </Text>
          </View>

          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>
              Onboarding State:
            </Text>
            <Text style={[styles.kvValue, { color: colors.success }]}>
              Persisted & Completed
            </Text>
          </View>
        </View>

        {/* Persistence Notice */}
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            {t('authBoundary', 'persistenceNotice')}
          </Text>
          <Text style={[styles.subNotice, { color: colors.mutedForeground }]}>
            {t('authBoundary', 'relaunchNotice')}
          </Text>
        </View>

        {/* Citizen Authentication Flow Entry */}
        {activeRole === 'Citizen' && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Citizen Authentication
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in to your account or register to report civic issues, track resolutions, and engage with municipal authorities.
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={() => navigation.navigate('CitizenLogin')}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryActionBtnText, { color: colors.primaryForeground }]}>
                Sign In as Citizen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={() => navigation.navigate('CitizenRegister')}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryActionBtnText, { color: colors.foreground }]}>
                Create New Citizen Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Worker Authentication Flow Entry */}
        {activeRole === 'Worker' && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Municipal Worker Portal
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in with your official municipal worker credentials to view assigned complaints, update task resolutions, and manage civic field operations.
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={() => navigation.navigate('WorkerLogin')}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryActionBtnText, { color: colors.primaryForeground }]}>
                Sign In as Worker
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reset / Testing Actions (Development Only) */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={[styles.devSectionTitle, { color: colors.mutedForeground }]}>
              DEVELOPMENT TESTING ACTIONS
            </Text>

            <View style={styles.devBtnRow}>
              <TouchableOpacity
                style={[
                  styles.devBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
                ]}
                onPress={async () => {
                  navigation.replace('CitizenWorkspace');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.devBtnText, { color: colors.foreground }]}>
                  Test Citizen Boundary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.devBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
                ]}
                onPress={async () => {
                  navigation.replace('WorkerWorkspace');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.devBtnText, { color: colors.foreground }]}>
                  Test Worker Boundary
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.devBtn,
                { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
              ]}
              onPress={async () => {
                navigation.replace('UnsupportedRoleBoundary');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.devBtnText, { color: colors.foreground }]}>
                Test Unsupported Role Boundary
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resetButton,
                {
                  borderColor: colors.destructive,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Text style={[styles.resetButtonText, { color: colors.destructive }]}>
                {t('authBoundary', 'resetButton')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
  },
  card: {
    padding: 22,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kvKey: {
    fontSize: 13,
  },
  kvValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noticeBox: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  subNotice: {
    fontSize: 12,
    lineHeight: 16,
  },
  resetButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  devSection: {
    marginTop: 10,
    gap: 10,
  },
  devSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  devBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  devBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
