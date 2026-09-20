import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import {
  getWorkerNotifications,
  getWorkerUnreadNotificationCount,
  markWorkerNotificationRead,
  markAllWorkerNotificationsRead,
  getMyAssignments,
  WorkerNotificationItem,
  WorkerAssignmentResponse,
} from '@cscrs/api';
import { RootStackParamList } from '../../../app/navigation/types';
import { useI18n } from '../../../core/i18n';

type NotificationsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const WorkerNotificationsPlaceholderScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NotificationsNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [notifications, setNotifications] = useState<WorkerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [assignments, setAssignments] = useState<WorkerAssignmentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setNoticeMessage(null);

      try {
        const [items, count, myAssignments] = await Promise.all([
          getWorkerNotifications(),
          getWorkerUnreadNotificationCount(),
          getMyAssignments().catch(() => [] as WorkerAssignmentResponse[]),
        ]);
        setNotifications(items || []);
        setUnreadCount(count || 0);
        setAssignments(myAssignments || []);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ??
            t('workerNotifications', 'error')
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const handleNotificationPress = async (item: WorkerNotificationItem) => {
    // 1. Mark as read on backend if currently unread
    if (!item.is_read) {
      try {
        await markWorkerNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silent failure for read tracking; do not disrupt user flow
      }
    }

    // 2. Safe navigation to WorkerTaskDetails if report_id matches an active assignment
    if (item.report_id != null) {
      const matchingAssignment = assignments.find(
        (a) => a.report_id === item.report_id
      );

      if (matchingAssignment) {
        navigation.navigate('WorkerTaskDetails', {
          assignment: matchingAssignment,
        });
        return;
      }
    }

    // 3. If report_id is null or unassigned to this worker, show safe localized notice
    setNoticeMessage(t('workerNotifications', 'nonNavigableNotice'));
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setNoticeMessage(null);
    try {
      await markAllWorkerNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Safe tolerance of transient network error
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'URGENT':
      case 'EMERGENCY':
        return '🚨';
      case 'RESOLUTION':
      case 'RESOLVED':
        return '✅';
      case 'ASSIGNMENT':
      case 'TASK':
        return '📋';
      case 'FORWARD':
      case 'TRANSFER':
        return '↗️';
      case 'BROADCAST':
      case 'ANNOUNCEMENT':
        return '📢';
      default:
        return '🔔';
    }
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
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[3],
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('workerNotifications', 'title')}
            </Text>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.unreadBadge,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Text style={[styles.unreadBadgeText, { color: colors.primaryForeground }]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {unreadCount > 0
              ? `${unreadCount} ${t('workerNotifications', 'unreadBadge')}`
              : t('workerNotifications', 'allRead')}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[
              styles.markAllBtn,
              {
                borderColor: colors.border,
                borderRadius: radii.md,
                backgroundColor: colors.card,
              },
            ]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
            activeOpacity={0.7}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                {t('workerNotifications', 'markAllRead')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Informational Toast Notice */}
      {noticeMessage && (
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '40',
              borderRadius: radii.md,
              marginHorizontal: spacing[5],
              marginTop: spacing[3],
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>ℹ️</Text>
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            {noticeMessage}
          </Text>
          <TouchableOpacity onPress={() => setNoticeMessage(null)}>
            <Text style={[styles.noticeDismiss, { color: colors.primary }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.mutedForeground, marginTop: spacing[3] },
            ]}
          >
            {t('workerNotifications', 'loading')}
          </Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            {t('workerNotifications', 'error')}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                marginTop: spacing[4],
              },
            ]}
            onPress={() => fetchData(false)}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
              {t('workerNotifications', 'retry')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <View style={styles.centered}>
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('workerNotifications', 'emptyTitle')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {t('workerNotifications', 'emptyDesc')}
            </Text>
          </View>
        </View>
      )}

      {/* Notifications List */}
      {!loading && !error && notifications.length > 0 && (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[8] + insets.bottom,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {notifications.map((item) => {
            const hasReportRef = item.report_id != null;
            const hasActiveAssignment =
              hasReportRef &&
              assignments.some((a) => a.report_id === item.report_id);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: item.is_read
                      ? colors.card
                      : colors.primary + '08',
                    borderColor: item.is_read
                      ? colors.border
                      : colors.primary + '40',
                    borderRadius: radii.lg,
                    marginTop: spacing[3],
                  },
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
                    <Text
                      style={[styles.typeText, { color: colors.mutedForeground }]}
                    >
                      {item.type}
                    </Text>
                  </View>

                  <View style={styles.dateRow}>
                    {!item.is_read && (
                      <View
                        style={[
                          styles.unreadDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.dateText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.notificationTitle,
                    {
                      color: colors.foreground,
                      fontWeight: item.is_read ? '600' : '800',
                    },
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.notificationMessage,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.message}
                </Text>

                {/* Task Navigation Indicator */}
                {hasActiveAssignment && (
                  <View
                    style={[
                      styles.taskLinkRow,
                      {
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.taskLinkText, { color: colors.primary }]}
                    >
                      {t('workerNotifications', 'viewTask')} →
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export const WorkerNotificationsScreen = WorkerNotificationsPlaceholderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  noticeDismiss: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollList: {
    flex: 1,
  },
  notificationCard: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 11,
  },
  notificationTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  taskLinkRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  taskLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
