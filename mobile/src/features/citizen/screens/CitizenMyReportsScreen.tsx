import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { getMyReports, searchMyReports, CitizenReportListItem } from '@cscrs/api';
import { RootStackParamList } from '../../../app/navigation/types';
import { useI18n } from '../../../core/i18n';

type MyReportsNavProp = NativeStackNavigationProp<RootStackParamList>;

type FilterStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export const CitizenMyReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MyReportsNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [reports, setReports] = useState<CitizenReportListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

  // Fetch reports from backend
  const fetchReports = useCallback(async (query = '', isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let data: CitizenReportListItem[];
      if (query.trim()) {
        data = await searchMyReports(query.trim());
      } else {
        data = await getMyReports();
      }
      setReports(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load your reports. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(searchQuery);
  }, [fetchReports, searchQuery]);

  // Status Filter logic
  const filteredReports = reports.filter((item) => {
    if (activeFilter === 'ALL') return true;
    const s = item.status.toUpperCase();
    if (activeFilter === 'PENDING') {
      return s === 'PENDING';
    }
    if (activeFilter === 'IN_PROGRESS') {
      return s === 'ASSIGNED' || s === 'IN_PROGRESS';
    }
    if (activeFilter === 'RESOLVED') {
      return s === 'RESOLVED' || s === 'CLOSED';
    }
    if (activeFilter === 'CANCELLED') {
      return s === 'CANCELLED' || s === 'REJECTED';
    }
    return true;
  });

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

  const getPriorityBadgeStyle = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL' || p === 'EMERGENCY') {
      return { bg: colors.destructive + '15', text: colors.destructive };
    }
    if (p === 'MEDIUM') {
      return { bg: colors.warning + '15', text: colors.warning };
    }
    return { bg: colors.mutedForeground + '20', text: colors.mutedForeground };
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
      {/* Header & Search */}
      <View
        style={[
          styles.headerSection,
          {
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            paddingBottom: spacing[3],
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('citizenMyReports', 'title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('citizenMyReports', 'subtitle')}
        </Text>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t('citizenMyReports', 'searchPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.clearBtn, { color: colors.mutedForeground }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(
            [
              { key: 'ALL', label: t('citizenMyReports', 'filterAll') },
              { key: 'PENDING', label: t('citizenMyReports', 'filterPending') },
              { key: 'IN_PROGRESS', label: t('citizenMyReports', 'filterInProgress') },
              { key: 'RESOLVED', label: t('citizenMyReports', 'filterResolved') },
              { key: 'CANCELLED', label: t('citizenMyReports', 'filterCancelled') },
            ] as const
          ).map((filter) => {
            const isSelected = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radii.full,
                  },
                ]}
                onPress={() => setActiveFilter(filter.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReports(searchQuery, true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading indicator */}
        {loading && !refreshing && (
          <View
            style={[
              styles.stateCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.lg },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
              {t('citizenMyReports', 'loadingReports')}
            </Text>
          </View>
        )}

        {/* Error Card */}
        {error && (
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
              {t('citizenMyReports', 'errorTitle')}
            </Text>
            <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
            <TouchableOpacity
              style={[
                styles.retryBtn,
                { backgroundColor: colors.destructive, borderRadius: radii.md },
              ]}
              onPress={() => fetchReports(searchQuery, false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryBtnText, { color: colors.destructiveForeground }]}>
                {t('citizenMyReports', 'retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State: No reports at all */}
        {!loading && !error && reports.length === 0 && !searchQuery.trim() && (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.xl },
            ]}
          >
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('citizenMyReports', 'noReports')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {t('citizenMyReports', 'noReportsDesc')}
            </Text>
          </View>
        )}

        {/* Search Empty State */}
        {!loading && !error && reports.length === 0 && searchQuery.trim().length > 0 && (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.xl },
            ]}
          >
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('citizenMyReports', 'noSearchResults')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {t('citizenMyReports', 'noSearchResultsDesc')}
            </Text>
          </View>
        )}

        {/* Render Reports */}
        {!loading &&
          !error &&
          filteredReports.map((report) => {
            const statusStyle = getStatusBadgeStyle(report.status);
            const priorityStyle = getPriorityBadgeStyle(report.priority);

            return (
              <TouchableOpacity
                key={report.id}
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
                <View style={styles.reportHeader}>
                  <Text style={[styles.reportNumber, { color: colors.primary }]}>
                    {report.report_number}
                  </Text>
                  <View style={styles.badgeGroup}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                      <Text style={[styles.priorityBadgeText, { color: priorityStyle.text }]}>
                        {report.priority}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {report.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.issueType, { color: colors.foreground }]}>
                  {report.issue_type}
                </Text>

                <View style={styles.reportFooter}>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {new Date(report.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={[styles.detailsLink, { color: colors.primary }]}>
                    Details →
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    gap: 12,
    paddingTop: 8,
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 1,
    gap: 10,
  },
  stateText: {
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
  errorText: {
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
  emptyCard: {
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  reportCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportNumber: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  issueType: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: '700',
  },
});
