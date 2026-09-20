import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import {
  WorkerAssignmentResponse,
  startWork,
  resolveMediaUrl,
} from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type TaskDetailsRouteProp = RouteProp<RootStackParamList, 'WorkerTaskDetails'>;

export const WorkerTaskDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TaskDetailsRouteProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [assignment, setAssignment] = useState<WorkerAssignmentResponse>(
    route.params.assignment
  );
  const [isStartingWork, setIsStartingWork] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAssigned =
    (assignment.status || '').toUpperCase() === 'ASSIGNED' ||
    (assignment.status || '').toUpperCase() === 'ACCEPTED';
  const isInProgress = (assignment.status || '').toUpperCase().includes('PROGRESS');
  const isCompleted =
    (assignment.status || '').toUpperCase().includes('COMPLETED') ||
    (assignment.status || '').toUpperCase().includes('RESOLVED');

  const mediaUri = resolveMediaUrl(assignment.image_url);

  // Geofenced Start Work handler
  const handleStartWork = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsStartingWork(true);

    try {
      // 1. Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        const msg = t('workerTaskDetails', 'locationDisabledMsg');
        setActionError(msg);
        Alert.alert(t('workerTaskDetails', 'locationPermissionTitle'), msg);
        setIsStartingWork(false);
        return;
      }

      // 2. Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = t('workerTaskDetails', 'locationPermissionMsg');
        setActionError(msg);
        Alert.alert(t('workerTaskDetails', 'locationPermissionTitle'), msg);
        setIsStartingWork(false);
        return;
      }

      // 3. Acquire high-accuracy position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = loc.coords;

      // 4. Send authoritative backend start-work request
      const startRes = await startWork(assignment.assignment_id, {
        latitude,
        longitude,
      });

      // 5. Update local state to reflect In Progress
      setAssignment((prev) => ({
        ...prev,
        status: startRes.status || 'In Progress',
        work_started_at: startRes.work_started_at || new Date().toISOString(),
      }));

      setActionSuccess(t('workerTaskDetails', 'startWorkSuccess'));
    } catch (err: any) {
      if (err?.response?.status === 403) {
        // Distance check failed (> 30m) or assignment unauthorized
        const detail = err.response?.data?.detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : t('workerTaskDetails', 'geofenceDistanceError');
        setActionError(msg);
        Alert.alert(t('workerTaskDetails', 'geofenceNoticeTitle'), msg);
      } else if (err?.response?.status === 409) {
        // Already started
        const msg = err.response?.data?.detail || 'Work has already started.';
        setActionError(msg);
        setAssignment((prev) => ({ ...prev, status: 'In Progress' }));
      } else if (err?.response?.status === 404) {
        setActionError('Assignment not found.');
      } else {
        const safeMsg =
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to verify location and start work. Please try again.';
        setActionError(typeof safeMsg === 'string' ? safeMsg : JSON.stringify(safeMsg));
      }
    } finally {
      setIsStartingWork(false);
    }
  };

  const handleOpenMaps = async () => {
    const lat = assignment.latitude;
    const lng = assignment.longitude;
    const geoUrl =
      lat != null && lng != null
        ? `geo:${lat},${lng}?q=${lat},${lng}(Civic+Issue)`
        : null;
    const webUrl =
      assignment.google_maps_url ||
      (lat != null && lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : null);

    try {
      if (geoUrl) {
        const canOpenGeo = await Linking.canOpenURL(geoUrl);
        if (canOpenGeo) {
          await Linking.openURL(geoUrl);
          return;
        }
      }

      if (webUrl) {
        const canOpenWeb = await Linking.canOpenURL(webUrl);
        if (canOpenWeb) {
          await Linking.openURL(webUrl);
          return;
        }
      }

      Alert.alert(
        t('workerTaskDetails', 'mapNoticeTitle'),
        t('workerTaskDetails', 'cannotOpenMapMsg')
      );
    } catch {
      Alert.alert(
        t('workerTaskDetails', 'mapErrorTitle'),
        t('workerTaskDetails', 'unableToLaunchMapsMsg')
      );
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
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
      {/* Top Header with Back CTA */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <CscrsIcon name="arrow-left" size={16} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>
            {t('workerTaskDetails', 'backToTasks')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('workerTaskDetails', 'title')} #{assignment.report_id}
        </Text>
      </View>

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
      >
        {/* Status / Priority Badges */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isInProgress
                  ? colors.primary + '20'
                  : isCompleted
                  ? colors.success + '20'
                  : colors.warning + '20',
                borderRadius: radii.md,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isInProgress
                    ? colors.primary
                    : isCompleted
                    ? colors.success
                    : colors.warning,
                },
              ]}
            >
              {assignment.status}
            </Text>
          </View>

          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.md,
              },
            ]}
          >
            <Text style={[styles.priorityBadgeText, { color: colors.foreground }]}>
              {assignment.priority} Priority
            </Text>
          </View>
        </View>

        {/* Issue Type Title */}
        <Text style={[styles.issueTypeTitle, { color: colors.foreground }]}>
          {assignment.issue_type}
        </Text>

        {/* Original Photo Preview */}
        <View
          style={[
            styles.photoCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('workerTaskDetails', 'originalPhoto')}
          </Text>
          {mediaUri ? (
            <Image
              source={{ uri: mediaUri }}
              style={[styles.originalImage, { borderRadius: radii.lg }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.noPhotoBox,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text style={{ fontSize: 36 }}>📷</Text>
              <Text style={[styles.noPhotoText, { color: colors.mutedForeground }]}>
                {t('workerTaskDetails', 'noPhoto')}
              </Text>
            </View>
          )}
        </View>

        {/* Work Order Info Card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('workerTaskDetails', 'taskInfo')}
          </Text>

          {/* Description */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              {t('workerTaskDetails', 'description')}
            </Text>
            <Text style={[styles.fieldValue, { color: colors.foreground }]}>
              {assignment.description || t('workerTaskDetails', 'noDescription')}
            </Text>
          </View>

          {/* Timestamps */}
          <View style={styles.timestampGrid}>
            <View style={styles.timeCol}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {t('workerTaskDetails', 'assignedAt')}
              </Text>
              <Text style={[styles.timeValue, { color: colors.foreground }]}>
                {formatDate(assignment.assigned_at) || 'N/A'}
              </Text>
            </View>

            {assignment.work_started_at ? (
              <View style={styles.timeCol}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  {t('workerTaskDetails', 'workStartedAt')}
                </Text>
                <Text style={[styles.timeValue, { color: colors.primary }]}>
                  {formatDate(assignment.work_started_at)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Site Location Card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <CscrsIcon name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
              {t('workerTaskDetails', 'locationSection')}
            </Text>
          </View>

          {assignment.address ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {t('workerTaskDetails', 'address')}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                {assignment.address}
              </Text>
            </View>
          ) : null}

          {assignment.latitude != null && assignment.longitude != null ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {t('workerTaskDetails', 'coordinates')}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                {assignment.latitude.toFixed(6)}, {assignment.longitude.toFixed(6)}
              </Text>
            </View>
          ) : null}

          {assignment.google_maps_url ? (
            <TouchableOpacity
              style={[
                styles.mapsBtn,
                {
                  borderColor: colors.primary,
                  borderRadius: radii.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                },
              ]}
              onPress={handleOpenMaps}
              activeOpacity={0.8}
            >
              <CscrsIcon name="map-pin" size={16} color={colors.primary} />
              <Text style={[styles.mapsBtnText, { color: colors.primary }]}>
                {t('workerTaskDetails', 'openInMaps')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Success Banner */}
        {actionSuccess && (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.success + '20',
                borderColor: colors.success,
                borderRadius: radii.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <CscrsIcon name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.bannerText, { color: colors.success }]}>
              {actionSuccess}
            </Text>
          </View>
        )}

        {/* Error Banner */}
        {actionError && (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.destructive + '15',
                borderColor: colors.destructive,
                borderRadius: radii.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <CscrsIcon name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.bannerText, { color: colors.destructive }]}>
              {actionError}
            </Text>
          </View>
        )}

        {/* Dynamic Action Area */}
        <View style={styles.actionArea}>
          {isAssigned && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  opacity: isStartingWork ? 0.7 : 1,
                },
              ]}
              onPress={handleStartWork}
              disabled={isStartingWork}
              activeOpacity={0.8}
            >
              {isStartingWork ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text
                    style={[
                      styles.primaryActionBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {t('workerTaskDetails', 'startingWork')}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.primaryActionBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  🚀 {t('workerTaskDetails', 'startWorkAction')}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isInProgress && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: colors.success,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={() => {
                navigation.navigate('WorkerResolutionSubmit', {
                  assignment,
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryActionBtnText, { color: '#ffffff' }]}>
                📸 {t('workerTaskDetails', 'submitResolutionAction')}
              </Text>
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View
              style={[
                styles.completedBox,
                {
                  backgroundColor: colors.success + '15',
                  borderColor: colors.success,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text style={[styles.completedBoxText, { color: colors.success }]}>
                ✓ {t('workerTaskDetails', 'taskCompletedBadge')}
              </Text>
            </View>
          )}

          {/* Secondary Action: Flag for Department Forward */}
          {!isCompleted && (
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={() => {
                navigation.navigate('WorkerForwardRequest', {
                  assignment,
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryActionBtnText, { color: colors.foreground }]}>
                🚩 {t('workerTaskDetails', 'flagForwardAction')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  issueTypeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  photoCard: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  originalImage: {
    width: '100%',
    height: 220,
  },
  noPhotoBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noPhotoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailsCard: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  fieldBlock: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  timestampGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
  },
  timeCol: {
    flex: 1,
    gap: 3,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapsBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: 4,
  },
  mapsBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  banner: {
    padding: 14,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  actionArea: {
    marginTop: 8,
    gap: 10,
  },
  primaryActionBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  completedBoxText: {
    fontSize: 14,
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
