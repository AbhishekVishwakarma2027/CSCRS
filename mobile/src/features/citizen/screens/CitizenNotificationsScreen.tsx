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
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from '@cscrs/api';
import { RootStackParamList } from '../../../app/navigation/types';
import { useI18n } from '../../../core/i18n';

type NotificationsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const CitizenNotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NotificationsNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [items, count] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);
        setNotifications(items || []);
        setUnreadCount(count || 0);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ??
            t('citizenNotifications', 'error')
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

  const handleNotificationPress = async (item: NotificationItem) => {
    // If unread, mark as read on backend
    if (!item.is_read) {
      try {
        await markNotificationAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silent failure for read tracking
      }
    }

    // Navigate to report details ONLY if a valid report reference exists
    if (item.report_id != null) {
      navigation.navigate('CitizenReportDetails', {
        reportId: item.report_id,
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore transient error
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
      case 'FORWARD':
        return '📋';
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
            paddingTop: spacing[3],
            paddingBottom: spacing[3],
          },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('citizenNotifications', 'title')}
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadPill,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.unreadPillText,
                  { color: colors.primaryForeground },
                ]}
              >
                {unreadCount} {t('citizenNotifications', 'unreadBadge')}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('citizenNotifications', 'subtitle')}
        </Text>

        {/* Mark All Read Action */}
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { borderColor: colors.border }]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.markAllBtnText, { color: colors.primary }]}>
              {markingAll ? '...' : t('citizenNotifications', 'markAllRead')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Indicator */}
      {loading && !refreshing && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.mutedForeground, marginTop: spacing[3] },
            ]}
          >
            {t('citizenNotifications', 'loading')}
          </Text>
        </View>
      )}

      {/* Error View */}
      {!loading && error && (
        <View style={[styles.errorBox, { paddingHorizontal: spacing[5] }]}>
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.destructive + '15',
                borderColor: colors.destructive + '40',
                borderRadius: radii.lg,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: colors.destructive }]}>
              {t('citizenNotifications', 'error')}
            </Text>
            <Text style={[styles.errorDetail, { color: colors.foreground }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryBtn,
                { backgroundColor: colors.destructive, borderRadius: radii.md },
              ]}
              onPress={() => fetchData(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.retryBtnText,
                  { color: colors.destructiveForeground },
                ]}
              >
                {t('citizenNotifications', 'retry')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <View style={[styles.emptyContainer, { padding: spacing[6] }]}>
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
              {t('citizenNotifications', 'emptyTitle')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {t('citizenNotifications', 'emptyDesc')}
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
            paddingBottom: spacing[8],
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

                {/* Report Reference Link */}
                {hasReportRef && (
                  <View
                    style={[
                      styles.reportLinkRow,
                      {
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.reportLinkText, { color: colors.primary }]}
                    >
                      {t('citizenNotifications', 'viewReport')} →
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  markAllBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 4,
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
  },
  errorCard: {
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
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
    letterSpacing: 0.5,
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
    fontWeight: '500',
  },
  notificationTitle: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  reportLinkRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  reportLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
