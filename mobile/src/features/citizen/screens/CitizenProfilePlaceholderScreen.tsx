import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { useAuthSession } from '../../../core/auth';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList>;

export const CitizenProfilePlaceholderScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();
  const { theme, toggleTheme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const { user, logout } = useAuthSession();

  const handleLogout = async () => {
    await logout();
    navigation.replace('AuthBoundary');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingHorizontal: spacing[5],
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radii.xl,
            marginTop: spacing[4],
          },
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.name ?? 'Citizen User'}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>
          {user?.email ?? 'citizen@example.com'}
        </Text>

        <View
          style={[
            styles.badge,
            { backgroundColor: colors.success + '20' },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.badgeText, { color: colors.success }]}>
            {user?.role ? user.role.toUpperCase() : 'CITIZEN'}
          </Text>
        </View>

        {/* Phase 4F Notice */}
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
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            {t('citizenHome', 'placeholderProfileDesc')}
          </Text>
        </View>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          style={[
            styles.themeBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={[styles.themeBtnText, { color: colors.foreground }]}>
            {theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              borderColor: colors.destructive,
              borderRadius: radii.lg,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutBtnText, { color: colors.destructive }]}>
            {t('citizenHome', 'signOut')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
  },
  email: {
    fontSize: 13,
    marginTop: -4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
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
  noticeBox: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  themeBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
