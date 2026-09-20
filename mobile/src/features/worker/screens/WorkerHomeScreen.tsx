import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, CscrsIcon, ThemeToggle } from '@cscrs/design-system';
import {
  getWorkerDashboard,
  getMyProfile,
  WorkerDashboardResponse,
  ProfileData,
} from '@cscrs/api';
import { useAuthSession } from '../../../core/auth';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

export const WorkerHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const { user } = useAuthSession();

  const [dashboardData, setDashboardData] = useState<WorkerDashboardResponse | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkerData = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [dash, prof] = await Promise.all([
        getWorkerDashboard(),
        getMyProfile().catch(() => null),
      ]);
      setDashboardData(dash);
      if (prof) {
        setProfileData(prof);
      }
    } catch (err: any) {
      const safeMessage =
        err?.response?.data?.detail ??
        err?.message ??
        t('workerHome', 'errorTitle');
      setError(typeof safeMessage === 'string' ? safeMessage : JSON.stringify(safeMessage));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWorkerData();
  }, [fetchWorkerData]);

  const activeTaskCount =
    (dashboardData?.assigned_reports ?? 0) + (dashboardData?.in_progress_reports ?? 0);
  const isAssigned = activeTaskCount > 0;
  const totalReportsToday =
    (dashboardData?.today_completed_reports ?? 0) + activeTaskCount;
  const progressPercent =
    totalReportsToday > 0
      ? Math.round(
          ((dashboardData?.today_completed_reports ?? 0) / totalReportsToday) * 100
        )
      : 100;

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
            onRefresh={() => fetchWorkerData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
              {t('workerHome', 'title')}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {user?.name || profileData?.name || 'Field Officer'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {profileData?.department_name || t('workerHome', 'subtitle')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Status Badge */}
            <View
              style={[
                styles.availabilityBadge,
                {
                  backgroundColor: isAssigned
                    ? colors.warning + '20'
                    : colors.success + '20',
                  borderColor: isAssigned ? colors.warning : colors.success,
                  borderRadius: radii.full,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isAssigned ? colors.warning : colors.success },
                ]}
              />
              <Text
                style={[
                  styles.availabilityText,
                  { color: isAssigned ? colors.warning : colors.success },
                ]}
              >
                {isAssigned
                  ? t('workerHome', 'assignedReports')
                  : t('workerHome', 'available')}
              </Text>
            </View>

            <ThemeToggle />
          </View>
        </View>

        {/* Loading State */}
        {loading && !refreshing && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                styles.statusNoticeText,
                { color: colors.mutedForeground, marginTop: spacing[3] },
              ]}
            >
              {t('workerHome', 'loading')}
            </Text>
          </View>
        )}

        {/* Error Banner */}
        {error && !loading && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.destructive + '15',
                borderColor: colors.destructive,
                borderRadius: radii.lg,
              },
            ]}
          >
            <CscrsIcon name="alert-circle" size={20} color={colors.destructive} />
            <Text style={[styles.errorTitle, { color: colors.destructive }]}>
              {t('workerHome', 'errorTitle')}
            </Text>
            <Text
              style={[
                styles.errorMessage,
                { color: colors.foreground, marginVertical: spacing[2] },
              ]}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryBtn,
                {
                  backgroundColor: colors.destructive,
                  borderRadius: radii.md,
                },
              ]}
              onPress={() => fetchWorkerData(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryBtnText, { color: '#ffffff' }]}>
                {t('workerHome', 'retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Metrics Grid */}
        {!loading && dashboardData && (
          <View style={styles.metricsContainer}>
            {/* Real Progress Bar */}
            <View
              style={[
                styles.progressCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                  Daily Resolution Progress
                </Text>
                <Text style={[styles.progressValue, { color: colors.primary }]}>
                  {progressPercent}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: colors.secondary, borderRadius: radii.full },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: colors.primary,
                      borderRadius: radii.full,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressSubtext, { color: colors.mutedForeground }]}>
                {dashboardData.today_completed_reports} completed today • {activeTaskCount} active
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('workerHome', 'summaryTitle')}
            </Text>

            {/* Top 2 Primary Cards: Assigned & In Progress */}
            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    borderWidth: 1.5,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.primary }]}>
                  {dashboardData.assigned_reports}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {t('workerHome', 'assignedReports')}
                </Text>
              </View>

              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.warning,
                    borderWidth: 1.5,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.warning }]}>
                  {dashboardData.in_progress_reports}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {t('workerHome', 'inProgressReports')}
                </Text>
              </View>
            </View>

            {/* Secondary 2 Cards: Pending Review & Completed Today */}
            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                  {dashboardData.pending_review_reports}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {t('workerHome', 'pendingReviewReports')}
                </Text>
              </View>

              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.success }]}>
                  {dashboardData.today_completed_reports}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {t('workerHome', 'todayCompletedReports')}
                </Text>
              </View>
            </View>

            {/* Tertiary 2 Cards: Total Completed & Avg Resolution Time */}
            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                  {dashboardData.completed_reports}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {t('workerHome', 'completedReports')}
                </Text>
              </View>

              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                <Text style={[styles.metricNumber, { color: colors.primary }]}>
                  {dashboardData.average_resolution_time_hours != null
                    ? `${Number(dashboardData.average_resolution_time_hours).toFixed(1)} ${t('workerHome', 'hoursUnit')}`
                    : `0.0 ${t('workerHome', 'hoursUnit')}`}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {t('workerHome', 'avgResolutionTime')}
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  marginTop: spacing[4],
                },
              ]}
              onPress={() => {
                (navigation as any).navigate('WorkerTasksTab');
              }}
              activeOpacity={0.8}
            >
              <CscrsIcon name="check-square" size={18} color={colors.primaryForeground} />
              <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                {t('workerHome', 'viewTasksAction')}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusNoticeText: {
    fontSize: 13,
  },
  errorCard: {
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressCard: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressSubtext: {
    fontSize: 12,
  },
  metricsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
