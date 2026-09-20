import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import {
  getReportDetails,
  getReportTimeline,
  getMyReports,
  fetchReportImageBase64,
  ReportDetailsResponse,
  TimelineEvent,
} from '@cscrs/api';
import { formatPercentage } from '@cscrs/utils';
import { RootStackScreenProps } from '../../../app/navigation/types';
import { useI18n } from '../../../core/i18n';

type ImageTab = 'original' | 'annotated' | 'resolution';

export const CitizenReportDetailsScreen: React.FC<
  RootStackScreenProps<'CitizenReportDetails'>
> = ({ route, navigation }) => {
  const { reportNumber: initialReportNumber, reportId: initialReportId } =
    route.params;

  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [report, setReport] = useState<ReportDetailsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Tabbed image state
  const [activeTab, setActiveTab] = useState<ImageTab>('original');
  const [imagesCache, setImagesCache] = useState<Record<ImageTab, string | null | undefined>>({
    original: undefined,
    annotated: undefined,
    resolution: undefined,
  });
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const fetchTimeline = useCallback(
    async (reportId: number) => {
      setLoadingTimeline(true);
      setTimelineError(null);
      try {
        const response = await getReportTimeline(reportId);
        setTimeline(response.timeline || []);
      } catch (err: any) {
        setTimelineError(
          err?.response?.data?.detail ?? t('citizenReportDetails', 'timelineError')
        );
      } finally {
        setLoadingTimeline(false);
      }
    },
    [t]
  );

  const loadImageForTab = useCallback(
    async (tab: ImageTab, reportId: number) => {
      if (imagesCache[tab] !== undefined) return;
      setLoadingImage(true);
      try {
        const base64Uri = await fetchReportImageBase64(reportId, tab);
        setImagesCache((prev) => ({ ...prev, [tab]: base64Uri }));
      } catch {
        setImagesCache((prev) => ({ ...prev, [tab]: null }));
      } finally {
        setLoadingImage(false);
      }
    },
    [imagesCache]
  );

  const loadReportData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        let resolvedReportNumber = initialReportNumber;

        // If only reportId was provided (e.g. from a notification), resolve the report number
        if (!resolvedReportNumber && initialReportId) {
          const myReports = await getMyReports();
          const match = myReports.find((r) => r.id === initialReportId);
          if (match) {
            resolvedReportNumber = match.report_number;
          } else {
            setError(t('citizenReportDetails', 'notFound'));
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }

        if (!resolvedReportNumber) {
          setError(t('citizenReportDetails', 'notFound'));
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const reportData = await getReportDetails(resolvedReportNumber);
        setReport(reportData);

        // Fetch timeline using the authoritative report ID
        if (reportData.id) {
          await fetchTimeline(reportData.id);
          // Preload original image
          loadImageForTab('original', reportData.id);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setError(t('citizenReportDetails', 'notFound'));
        } else {
          setError(
            err?.response?.data?.detail ??
              t('citizenReportDetails', 'errorTitle')
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [initialReportNumber, initialReportId, fetchTimeline, loadImageForTab, t]
  );

  useEffect(() => {
    loadReportData(false);
  }, [loadReportData]);

  useEffect(() => {
    if (report?.id) {
      loadImageForTab(activeTab, report.id);
    }
  }, [activeTab, report?.id, loadImageForTab]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return { bg: colors.success + '20', text: colors.success };
      case 'in progress':
      case 'assigned':
      case 'investigating':
        return { bg: colors.warning + '20', text: colors.warning };
      case 'cancelled':
      case 'rejected':
        return { bg: colors.destructive + '20', text: colors.destructive };
      case 'submitted':
      case 'pending':
      default:
        return { bg: colors.primary + '20', text: colors.primary };
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return { bg: colors.destructive + '20', text: colors.destructive };
      case 'high':
        return { bg: colors.warning + '25', text: colors.warning };
      case 'medium':
        return { bg: colors.primary + '20', text: colors.primary };
      case 'low':
      default:
        return { bg: colors.secondary, text: colors.mutedForeground };
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
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[3],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common', 'back')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CscrsIcon name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.headerTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {report?.report_number ?? t('citizenReportDetails', 'title')}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
          >
            {report?.issue_type ?? t('citizenReportDetails', 'title')}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.refreshBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => loadReportData(true)}
          disabled={loading || refreshing}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CscrsIcon name="refresh-cw" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.mutedForeground, marginTop: spacing[3] },
            ]}
          >
            {t('citizenReportDetails', 'loadingDetails')}
          </Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={[styles.errorContainer, { padding: spacing[5] }]}>
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
            <CscrsIcon name="alert-circle" size={32} color={colors.destructive} />
            <Text style={[styles.errorTitle, { color: colors.destructive }]}>
              {t('citizenReportDetails', 'errorTitle')}
            </Text>
            <Text style={[styles.errorDetail, { color: colors.foreground }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryBtn,
                { backgroundColor: colors.destructive, borderRadius: radii.md },
              ]}
              onPress={() => loadReportData(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.retryBtnText,
                  { color: colors.destructiveForeground },
                ]}
              >
                {t('citizenReportDetails', 'retry')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Report Content */}
      {!loading && !error && report && (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[8],
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReportData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Issue Summary Card */}
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
            <View style={styles.cardHeader}>
              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusBadgeStyle(report.status).bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusBadgeStyle(report.status).text },
                    ]}
                  >
                    {report.status}
                  </Text>
                </View>

                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: getPriorityBadgeStyle(report.priority).bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityBadgeText,
                      { color: getPriorityBadgeStyle(report.priority).text },
                    ]}
                  >
                    {report.priority} {t('citizenReportDetails', 'priority')}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.issueType, { color: colors.foreground }]}>
              {report.issue_type}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* AI & Verification Attributes */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text
                  style={[styles.metaLabel, { color: colors.mutedForeground }]}
                >
                  {t('citizenReportDetails', 'riskScore')}
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    {
                      color:
                        report.risk_score > 50
                          ? colors.destructive
                          : colors.foreground,
                    },
                  ]}
                >
                  {report.risk_score != null ? `${report.risk_score} / 100` : '—'}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Text
                  style={[styles.metaLabel, { color: colors.mutedForeground }]}
                >
                  {t('citizenReportDetails', 'aiConfidence')}
                </Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {report.ai_confidence != null
                    ? formatPercentage(report.ai_confidence)
                    : '—'}
                </Text>
              </View>
            </View>

            {/* Verification Status */}
            <View
              style={[
                styles.verificationBanner,
                {
                  backgroundColor: report.verification_passed
                    ? colors.success + '15'
                    : colors.warning + '15',
                  borderColor: report.verification_passed
                    ? colors.success + '40'
                    : colors.warning + '40',
                  borderRadius: radii.md,
                },
              ]}
            >
              <CscrsIcon
                name={report.verification_passed ? 'check-circle' : 'alert-circle'}
                size={18}
                color={report.verification_passed ? colors.success : colors.warning}
              />
              <View style={styles.bannerTextCol}>
                <Text
                  style={[
                    styles.bannerTitle,
                    {
                      color: report.verification_passed
                        ? colors.success
                        : colors.warning,
                    },
                  ]}
                >
                  {report.verification_passed
                    ? t('citizenReportDetails', 'verified')
                    : t('citizenReportDetails', 'failed')}
                </Text>
                <Text
                  style={[styles.bannerSubtitle, { color: colors.mutedForeground }]}
                >
                  {report.verification_decision ?? 'Standard Evaluation'}
                </Text>
              </View>
            </View>
          </View>

          {/* Report Photos Tabbed Card */}
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
            <View style={styles.sectionHeaderRow}>
              <CscrsIcon name="camera" size={16} color={colors.primary} />
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                {t('reportImages', 'title')}
              </Text>
            </View>

            {/* Tab selector */}
            <View
              style={[
                styles.tabSelectorRow,
                { backgroundColor: colors.secondary, borderRadius: radii.md },
              ]}
            >
              {(['original', 'annotated', 'resolution'] as ImageTab[]).map((tab) => {
                const isSelected = activeTab === tab;
                const tabLabel =
                  tab === 'original'
                    ? t('reportImages', 'tabOriginal')
                    : tab === 'annotated'
                    ? t('reportImages', 'tabAnnotated')
                    : t('reportImages', 'tabResolution');
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.imageTabBtn,
                      isSelected && {
                        backgroundColor: colors.card,
                        borderRadius: radii.sm,
                      },
                    ]}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.imageTabText,
                        {
                          color: isSelected ? colors.primary : colors.mutedForeground,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {tabLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tab image preview */}
            <View style={styles.imagePreviewContainer}>
              {loadingImage ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {t('reportImages', 'loadingImage')}
                  </Text>
                </View>
              ) : imagesCache[activeTab] ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFullScreenImage(imagesCache[activeTab]!)}
                  style={styles.imageTouchWrapper}
                >
                  <Image
                    source={{ uri: imagesCache[activeTab]! }}
                    style={styles.tabImage}
                    resizeMode="cover"
                  />
                  <View style={styles.tapToEnlarge}>
                    <CscrsIcon name="maximize-2" size={12} color="#FFF" />
                    <Text style={styles.tapToEnlargeText}>
                      {t('reportImages', 'tapToEnlarge')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <CscrsIcon name="image" size={32} color={colors.mutedForeground} />
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {t('reportImages', 'noImageAvailable')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location & GPS Card */}
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
            <View style={styles.sectionHeaderRow}>
              <CscrsIcon name="map-pin" size={16} color={colors.primary} />
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                {t('citizenReportDetails', 'address')}
              </Text>
            </View>

            {report.address ? (
              <Text style={[styles.addressText, { color: colors.foreground }]}>
                {report.address}
              </Text>
            ) : (
              <Text
                style={[styles.addressText, { color: colors.mutedForeground }]}
              >
                GPS Geotagged Location (Civic Infrastructure)
              </Text>
            )}

            <View
              style={[
                styles.coordinatesBadge,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                },
              ]}
            >
              <Text
                style={[styles.coordinatesText, { color: colors.mutedForeground }]}
              >
                {t('citizenReportDetails', 'coordinates')}:{' '}
                {report.latitude?.toFixed(4)}° N, {report.longitude?.toFixed(4)}° E
              </Text>
            </View>
          </View>

          {/* Feedback CTA if Resolved */}
          {report.status?.toLowerCase() === 'resolved' && (
            <TouchableOpacity
              style={[
                styles.feedbackCta,
                { backgroundColor: colors.primary, borderRadius: radii.lg },
              ]}
              onPress={() => navigation.navigate('CitizenFeedback')}
              activeOpacity={0.85}
            >
              <CscrsIcon name="star" size={18} color={colors.primaryForeground} />
              <Text
                style={[styles.feedbackCtaText, { color: colors.primaryForeground }]}
              >
                {t('feedback', 'title')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Chronological Timeline Section */}
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
            <View style={styles.sectionHeaderRow}>
              <CscrsIcon name="clock" size={16} color={colors.primary} />
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                {t('citizenReportDetails', 'timelineTitle')}
              </Text>
            </View>

            {loadingTimeline && (
              <View style={styles.timelineLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[
                    styles.timelineLoadingText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t('citizenReportDetails', 'loadingTimeline')}
                </Text>
              </View>
            )}

            {timelineError && (
              <View style={styles.timelineErrorBox}>
                <Text
                  style={[styles.timelineErrorText, { color: colors.destructive }]}
                >
                  {timelineError}
                </Text>
                {report.id && (
                  <TouchableOpacity
                    style={[
                      styles.retryTimelineBtn,
                      { borderColor: colors.destructive },
                    ]}
                    onPress={() => fetchTimeline(report.id)}
                  >
                    <Text
                      style={[
                        styles.retryTimelineBtnText,
                        { color: colors.destructive },
                      ]}
                    >
                      {t('citizenReportDetails', 'retry')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!loadingTimeline && !timelineError && timeline.length === 0 && (
              <Text
                style={[
                  styles.emptyTimelineText,
                  { color: colors.mutedForeground },
                ]}
              >
                {t('citizenReportDetails', 'emptyTimeline')}
              </Text>
            )}

            {!loadingTimeline &&
              !timelineError &&
              timeline.length > 0 &&
              timeline.map((event, index) => {
                const isLast = index === timeline.length - 1;
                return (
                  <View key={index} style={styles.timelineRow}>
                    <View style={styles.timelineTrack}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor:
                              index === 0 ? colors.primary : colors.success,
                            borderColor: colors.card,
                          },
                        ]}
                      />
                      {!isLast && (
                        <View
                          style={[
                            styles.timelineLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineBody}>
                      <View style={styles.timelineMeta}>
                        <Text
                          style={[
                            styles.timelineEventTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {event.title}
                        </Text>
                        <Text
                          style={[
                            styles.timelineEventDate,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {new Date(event.created_at).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.timelineEventDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {event.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </ScrollView>
      )}

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setFullScreenImage(null)}
              accessibilityLabel={t('reportImages', 'close')}
            >
              <CscrsIcon name="x" size={24} color="#FFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  errorCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  card: {
    padding: 18,
    borderWidth: 1,
  },
  cardHeader: {
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  issueType: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSubtitle: {
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabSelectorRow: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  imageTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTabText: {
    fontSize: 12,
  },
  imagePreviewContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageTouchWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  tabImage: {
    width: '100%',
    height: '100%',
  },
  tapToEnlarge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapToEnlargeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
    borderRadius: 8,
    gap: 8,
    backgroundColor: 'rgba(150,150,150,0.05)',
  },
  imagePlaceholderText: {
    fontSize: 12,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  coordinatesBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  coordinatesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    marginTop: 16,
  },
  feedbackCtaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timelineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  timelineLoadingText: {
    fontSize: 13,
  },
  timelineErrorBox: {
    paddingVertical: 12,
    gap: 8,
  },
  timelineErrorText: {
    fontSize: 13,
  },
  retryTimelineBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderRadius: 4,
  },
  retryTimelineBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTimelineText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineEventTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineEventDate: {
    fontSize: 11,
  },
  timelineEventDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
});
