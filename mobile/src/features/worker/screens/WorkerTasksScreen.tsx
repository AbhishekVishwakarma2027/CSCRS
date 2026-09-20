import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import {
  getMyAssignments,
  WorkerAssignmentResponse,
  resolveMediaUrl,
} from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type FilterType = 'all' | 'assigned' | 'in_progress' | 'completed';

export const WorkerTasksScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [assignments, setAssignments] = useState<WorkerAssignmentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchAssignments = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getMyAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const safeMessage =
        err?.response?.data?.detail ??
        err?.message ??
        t('workerTasks', 'errorTitle');
      setError(typeof safeMessage === 'string' ? safeMessage : JSON.stringify(safeMessage));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Filter assignments locally
  const filteredAssignments = assignments.filter((item) => {
    const s = (item.status || '').toUpperCase();
    if (filter === 'assigned') {
      return s === 'ASSIGNED' || s === 'ACCEPTED';
    }
    if (filter === 'in_progress') {
      return s.includes('PROGRESS');
    }
    if (filter === 'completed') {
      return s.includes('COMPLETED') || s.includes('RESOLVED');
    }
    return true;
  });

  const getPriorityStyle = (priority: string) => {
    const p = priority.toUpperCase();
    if (p.includes('CRITICAL') || p.includes('HIGH')) {
      return { bg: colors.destructive + '20', text: colors.destructive };
    }
    if (p.includes('MEDIUM')) {
      return { bg: colors.warning + '20', text: colors.warning };
    }
    return { bg: colors.primary + '20', text: colors.primary };
  };

  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('COMPLETED') || s.includes('RESOLVED')) {
      return { bg: colors.success + '20', text: colors.success };
    }
    if (s.includes('PROGRESS')) {
      return { bg: colors.primary + '20', text: colors.primary };
    }
    if (s.includes('REJECTED') || s.includes('CANCELLED')) {
      return { bg: colors.destructive + '20', text: colors.destructive };
    }
    return { bg: colors.warning + '20', text: colors.warning };
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const renderTaskCard = ({ item }: { item: WorkerAssignmentResponse }) => {
    const priorityStyle = getPriorityStyle(item.priority || '');
    const statusStyle = getStatusStyle(item.status || '');
    const mediaUri = resolveMediaUrl(item.image_url);

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radii.xl,
          },
        ]}
        onPress={() => {
          navigation.navigate('WorkerTaskDetails', { assignment: item });
        }}
        activeOpacity={0.7}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.headerBadges}>
            <View
              style={[
                styles.badge,
                { backgroundColor: statusStyle.bg, borderRadius: radii.sm },
              ]}
            >
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: priorityStyle.bg, borderRadius: radii.sm },
              ]}
            >
              <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
                {item.priority}
              </Text>
            </View>
          </View>
          <Text style={[styles.reportIdText, { color: colors.mutedForeground }]}>
            #{item.report_id}
          </Text>
        </View>

        {/* Content Row with Image & Details */}
        <View style={styles.cardBody}>
          {mediaUri ? (
            <Image
              source={{ uri: mediaUri }}
              style={[styles.taskThumbnail, { borderRadius: radii.md }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholderThumbnail,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.md,
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>🛠️</Text>
            </View>
          )}

          <View style={styles.cardInfo}>
            <Text
              style={[styles.issueTypeText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {item.issue_type}
            </Text>
            {item.description ? (
              <Text
                style={[styles.descText, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
            {item.address ? (
              <Text
                style={[styles.addressText, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                📍 {item.address}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Footer Row: Timestamps & CTA */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.timestamps}>
            <Text style={[styles.timestampText, { color: colors.mutedForeground }]}>
              {t('workerTasks', 'assignedDate')}: {formatDate(item.assigned_at)}
            </Text>
            {item.work_started_at ? (
              <Text style={[styles.timestampText, { color: colors.primary }]}>
                {t('workerTasks', 'workStarted')}: {formatDate(item.work_started_at)}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
            {t('workerTasks', 'viewDetails')} →
          </Text>
        </View>
      </TouchableOpacity>
    );
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
      {/* Screen Header */}
      <View style={[styles.header, { paddingHorizontal: spacing[5], paddingTop: spacing[4] }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('workerTasks', 'title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('workerTasks', 'subtitle')}
        </Text>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'assigned', 'in_progress', 'completed'] as FilterType[]).map((tab) => {
            const isActive = filter === tab;
            const label =
              tab === 'all'
                ? t('workerTasks', 'filterAll')
                : tab === 'assigned'
                ? t('workerTasks', 'filterAssigned')
                : tab === 'in_progress'
                ? t('workerTasks', 'filterInProgress')
                : t('workerTasks', 'filterCompleted');

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: radii.full,
                  },
                ]}
                onPress={() => setFilter(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isActive
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Content / List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.noticeText,
              { color: colors.mutedForeground, marginTop: spacing[3] },
            ]}
          >
            {t('workerTasks', 'loadingTasks')}
          </Text>
        </View>
      ) : error && !refreshing ? (
        <View style={[styles.errorCard, { borderColor: colors.destructive }]}>
          <Text style={[styles.errorTitle, { color: colors.destructive }]}>
            {t('workerTasks', 'errorTitle')}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.foreground }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryBtn,
              { backgroundColor: colors.destructive, borderRadius: radii.md },
            ]}
            onPress={() => fetchAssignments(false)}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>
              {t('workerTasks', 'retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => String(item.assignment_id)}
          renderItem={renderTaskCard}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[8] + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAssignments(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44, marginBottom: 8 }}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t('workerTasks', 'noTasks')}
              </Text>
              <Text
                style={[
                  styles.emptyDesc,
                  { color: colors.mutedForeground, textAlign: 'center' },
                ]}
              >
                {t('workerTasks', 'noTasksDesc')}
              </Text>
            </View>
          }
        />
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
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
  },
  listContent: {
    paddingTop: 8,
    gap: 12,
  },
  taskCard: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  taskThumbnail: {
    width: 68,
    height: 68,
  },
  placeholderThumbnail: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  issueTypeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  descText: {
    fontSize: 12,
    lineHeight: 16,
  },
  addressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timestamps: {
    gap: 2,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '500',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorCard: {
    margin: 20,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
