import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, CscrsIcon, ThemeToggle } from '@cscrs/design-system';
import { getCitizenDashboard, CitizenDashboardResponse } from '@cscrs/api';
import { useAuthSession } from '../../../core/auth';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

export const CitizenHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const { user } = useAuthSession();

  const [dashboardData, setDashboardData] = useState<CitizenDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getCitizenDashboard();
      setDashboardData(data);
    } catch (err: any) {
      const safeMessage =
        err?.response?.data?.detail ??
        err?.message ??
        'Failed to connect to municipal civic services. Please try again.';
      setError(typeof safeMessage === 'string' ? safeMessage : JSON.stringify(safeMessage));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleReportCtaPress = () => {
    navigation.navigate('CitizenReportCreate');
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('RESOLVED') || s.includes('CLOSED')) {
      return { bg: colors.success + '20', text: colors.success };
    }
    if (s.includes('PROGRESS') || s.includes('ASSIGNED')) {
      return { bg: colors.primary + '20', text: colors.primary };
    }
    if (s.includes('CANCELLED')) {
      return { bg: colors.destructive + '20', text: colors.destructive };
    }
    return { bg: colors.warning + '20', text: colors.warning };
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing[5],
            paddingTop: spacing[4],
            paddingBottom: spacing[8] + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboard(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
              {t('citizenHome', 'greeting')},
            </Text>
            <Text style={[styles.greetingName, { color: colors.foreground }]}>
              {user?.name ?? 'Citizen'}
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          {t('citizenHome', 'headerSubtitle')}
        </Text>

        {/* Primary CTA: Report Civic Issue */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.xl,
            },
          ]}
          onPress={handleReportCtaPress}
          activeOpacity={0.85}
          accessibilityLabel={t('citizenHome', 'reportIssueCta')}
          accessibilityRole="button"
        >
          <View style={styles.ctaContent}>
            <View
              style={[
                styles.ctaIconBadge,
                { backgroundColor: colors.primaryForeground + '22' },
              ]}
            >
              <CscrsIcon name="camera" size={24} color={colors.primaryForeground} />
            </View>
            <View style={styles.ctaTextGroup}>
              <Text style={[styles.ctaTitle, { color: colors.primaryForeground }]}>
                {t('citizenHome', 'reportIssueCta')}
              </Text>
              <Text style={[styles.ctaSubtitle, { color: colors.primaryForeground + 'CC' }]}>
                {t('citizenHome', 'reportCtaNotice')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Loading State */}
        {loading && !dashboardData && (
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.lg,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {t('citizenHome', 'loadingDashboard')}
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.destructive + '10',
                borderColor: colors.destructive + '40',
                borderRadius: radii.lg,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: colors.destructive }]}>
              {t('citizenHome', 'errorTitle')}
            </Text>
            <Text style={[styles.errorDetail, { color: colors.foreground }]}>{error}</Text>
            <TouchableOpacity
              style={[
                styles.retryBtn,
                {
                  backgroundColor: colors.destructive,
                  borderRadius: radii.md,
                },
              ]}
              onPress={() => fetchDashboard(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryBtnText, { color: colors.destructiveForeground }]}>
                {t('citizenHome', 'retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Metric Cards */}
        {dashboardData && (
          <View style={styles.metricsContainer}>
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                {dashboardData.summary.total_reports}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                {t('citizenHome', 'totalReports')}
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text style={[styles.metricNumber, { color: colors.warning }]}>
                {dashboardData.summary.active_reports}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                {t('citizenHome', 'activeReports')}
              </Text>
            </View>

            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text style={[styles.metricNumber, { color: colors.success }]}>
                {dashboardData.summary.resolved_reports}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                {t('citizenHome', 'resolvedReports')}
              </Text>
            </View>
          </View>
        )}

        {/* Recent Reports Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('citizenHome', 'recentReportsTitle')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
              {t('citizenHome', 'recentReportsSubtitle')}
            </Text>
          </View>

          {dashboardData && dashboardData.recent_reports.length === 0 && (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <CscrsIcon name="file-text" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('citizenHome', 'noRecentReports')}
              </Text>
            </View>
          )}

          {dashboardData &&
            dashboardData.recent_reports.length > 0 &&
            dashboardData.recent_reports.map((report) => {
              const badgeStyle = getStatusBadgeStyle(report.status);
              return (
                <TouchableOpacity
                  key={report.report_id}
                  style={[
                    styles.reportCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('CitizenReportDetails', {
                      reportNumber: report.report_number,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.reportCardHeader}>
                    <Text style={[styles.reportNumber, { color: colors.primary }]}>
                      {report.report_number}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                        {report.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reportIssueType, { color: colors.foreground }]}>
                    {report.issue_type}
                  </Text>

                  <View style={styles.reportFooter}>
                    <Text style={[styles.reportDept, { color: colors.mutedForeground }]}>
                      {report.department_name ?? 'Municipal Corp'}
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.mutedForeground }]}>
                      {new Date(report.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  citizenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  citizenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  ctaButton: {
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ctaIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIconText: {
    fontSize: 22,
  },
  ctaTextGroup: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  ctaSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  loadingCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorCard: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorDetail: {
    fontSize: 12,
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    gap: 12,
    marginTop: 4,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  reportCard: {
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportNumber: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reportIssueType: {
    fontSize: 15,
    fontWeight: '700',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportDept: {
    fontSize: 12,
  },
  reportDate: {
    fontSize: 11,
  },
});
