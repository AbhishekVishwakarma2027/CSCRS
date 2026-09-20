import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@cscrs/design-system';
import { useI18n } from '../../../core/i18n';

export const CitizenMyReportsPlaceholderScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

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
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📋</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {t('citizenHome', 'comingSoonTitle')} — PHASE 4D
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('citizenTabs', 'myReports')}
        </Text>

        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {t('citizenHome', 'placeholderMyReportsDesc')}
        </Text>
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconText: {
    fontSize: 32,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
