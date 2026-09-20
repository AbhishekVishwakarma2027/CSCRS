import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import { submitCitizenReport, CreateReportResponse } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type ReportCreateNavProp = NativeStackNavigationProp<RootStackParamList>;

interface CapturedAsset {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileName?: string;
  exif?: Record<string, any>;
}

export const hasValidExifGps = (exif?: Record<string, any> | null): boolean => {
  if (!exif || typeof exif !== 'object') return false;

  // 1. Direct coordinates from standard EXIF / Android ExifInterface
  const hasDirect =
    (exif.GPSLatitude != null && exif.GPSLongitude != null && exif.GPSLatitude !== '' && exif.GPSLongitude !== '') ||
    (exif.Latitude != null && exif.Longitude != null && exif.Latitude !== '' && exif.Longitude !== '');
  if (hasDirect) return true;

  // 2. iOS nested {GPS} object
  if (exif['{GPS}'] && typeof exif['{GPS}'] === 'object') {
    const nested = exif['{GPS}'];
    if (
      (nested.Latitude != null || nested.GPSLatitude != null) &&
      (nested.Longitude != null || nested.GPSLongitude != null)
    ) {
      return true;
    }
  }

  // 3. Namespaced EXIF tags
  if (
    (exif['GPS:GPSLatitude'] != null || exif['GPS GPSLatitude'] != null) &&
    (exif['GPS:GPSLongitude'] != null || exif['GPS GPSLongitude'] != null)
  ) {
    return true;
  }

  return false;
};

export const CitizenReportCreateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ReportCreateNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  // Location State
  const [locationStatus, setLocationStatus] = useState<
    'checking' | 'ready' | 'denied' | 'disabled'
  >('checking');
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Asset & Form State
  const [selectedAsset, setSelectedAsset] = useState<CapturedAsset | null>(null);
  const [description, setDescription] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionStage, setSubmissionStage] = useState<number>(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<CreateReportResponse | null>(null);

  // Verify and acquire foreground location
  const verifyLocation = useCallback(async () => {
    setLocationStatus('checking');
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationStatus('disabled');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocationCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationStatus('ready');
    } catch {
      setLocationStatus('disabled');
    }
  }, []);

  useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  // Handle stage timer during submission
  useEffect(() => {
    let timer: any;
    if (isSubmitting) {
      setSubmissionStage(0);
      timer = setInterval(() => {
        setSubmissionStage((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1200);
    } else {
      setSubmissionStage(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSubmitting]);

  // Capture photo via camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('citizenReportCreate', 'title'),
          'Camera permission is required to capture civic issue photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1, // Preserve detail and EXIF metadata without recompression
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset) {
          setSelectedAsset({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            mimeType: asset.mimeType ?? 'image/jpeg',
            fileName: asset.fileName ?? 'civic-report.jpg',
            exif: asset.exif ?? undefined,
          });
          setSubmissionError(null);
        }
      }
    } catch {
      Alert.alert(
        t('citizenReportCreate', 'title'),
        'Unable to open camera. Please try selecting from your photo library.'
      );
    }
  };

  // Select photo from library
  const handleChooseLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('citizenReportCreate', 'title'),
          'Photo library permission is required to select civic issue photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset) {
          setSelectedAsset({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            mimeType: asset.mimeType ?? 'image/jpeg',
            fileName: asset.fileName ?? 'civic-report.jpg',
            exif: asset.exif ?? undefined,
          });
          setSubmissionError(null);
        }
      }
    } catch {
      Alert.alert(
        t('citizenReportCreate', 'title'),
        'Unable to open photo library. Please try again.'
      );
    }
  };

  // Submit report to municipal API
  const handleSubmit = async () => {
    if (!selectedAsset) {
      Alert.alert(
        t('citizenReportCreate', 'title'),
        'Please capture or select an image of the civic issue before submitting.'
      );
      return;
    }

    if (locationStatus !== 'ready') {
      Alert.alert(
        t('citizenReportCreate', 'title'),
        t('citizenReportCreate', 'locationRequiredNotice')
      );
      return;
    }

    // Explicitly verify that image contains valid EXIF GPS metadata before proceeding
    if (!hasValidExifGps(selectedAsset.exif)) {
      Alert.alert(
        t('citizenReportCreate', 'title'),
        t('citizenReportCreate', 'noGpsError')
      );
      setSubmissionError(t('citizenReportCreate', 'noGpsError'));
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedAsset.uri,
        name: selectedAsset.fileName || 'report.jpg',
        type: selectedAsset.mimeType || 'image/jpeg',
      } as any);

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await submitCitizenReport(formData);
      setSubmissionResult(response);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSubmissionError(t('citizenReportCreate', 'alreadyReportedError'));
      } else if (err?.response?.status === 429) {
        setSubmissionError(t('citizenReportCreate', 'rateLimitError'));
      } else if (err?.response?.status === 400) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string' && detail.includes('GPS')) {
          setSubmissionError(t('citizenReportCreate', 'noGpsError'));
        } else if (typeof detail === 'string' && detail.includes('No civic issue')) {
          setSubmissionError(t('citizenReportCreate', 'noCivicIssueError'));
        } else {
          setSubmissionError(detail || 'Verification failed. Please ensure the photo clearly depicts a civic issue.');
        }
      } else {
        const safeMsg = err?.response?.data?.detail || err?.message || t('citizenReportCreate', 'networkError');
        setSubmissionError(typeof safeMsg === 'string' ? safeMsg : JSON.stringify(safeMsg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to My Reports after successful report
  const handleViewReports = () => {
    navigation.replace('CitizenWorkspace');
  };

  const stages = [
    t('submissionProgress', 'uploadingPhoto'),
    t('submissionProgress', 'verifyingLocation'),
    t('submissionProgress', 'analyzingIssue'),
    t('submissionProgress', 'creatingReport'),
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing[5],
            paddingTop: spacing[4],
            paddingBottom: spacing[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.md },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            disabled={isSubmitting}
          >
            <CscrsIcon name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {t('citizenReportCreate', 'title')}
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('citizenReportCreate', 'subtitle')}
        </Text>

        {/* Indeterminate Submission Progress Panel */}
        {isSubmitting && (
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderRadius: radii.xl,
              },
            ]}
          >
            <View style={styles.progressHeader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.progressTitle, { color: colors.foreground }]}>
                {t('submissionProgress', 'title')}
              </Text>
            </View>
            <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
              {t('submissionProgress', 'submittingReport')}
            </Text>

            <View style={styles.stagesContainer}>
              {stages.map((stageText, idx) => {
                const isDone = idx < submissionStage;
                const isCurrent = idx === submissionStage;
                return (
                  <View key={idx} style={styles.stageRow}>
                    <View style={styles.stageIconBox}>
                      {isDone ? (
                        <CscrsIcon name="check-circle" size={16} color={colors.primary} />
                      ) : isCurrent ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <CscrsIcon name="circle" size={14} color={colors.mutedForeground + '60'} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stageText,
                        {
                          color: isDone || isCurrent ? colors.foreground : colors.mutedForeground,
                          fontWeight: isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {stageText}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Location Status Banner */}
        {!isSubmitting && !submissionResult && (
          <View
            style={[
              styles.locationCard,
              {
                backgroundColor:
                  locationStatus === 'ready'
                    ? colors.success + '15'
                    : locationStatus === 'checking'
                    ? colors.card
                    : colors.warning + '15',
                borderColor:
                  locationStatus === 'ready'
                    ? colors.success + '40'
                    : locationStatus === 'checking'
                    ? colors.border
                    : colors.warning + '50',
                borderRadius: radii.lg,
              },
            ]}
          >
            <View style={styles.locationHeader}>
              <CscrsIcon
                name={locationStatus === 'ready' ? 'map-pin' : locationStatus === 'checking' ? 'clock' : 'alert-circle'}
                size={18}
                color={locationStatus === 'ready' ? colors.success : colors.warning}
              />
              <Text
                style={[
                  styles.locationStatusTitle,
                  {
                    color:
                      locationStatus === 'ready'
                        ? colors.success
                        : locationStatus === 'checking'
                        ? colors.foreground
                        : colors.warning,
                  },
                ]}
              >
                {locationStatus === 'ready'
                  ? t('citizenReportCreate', 'locationReady')
                  : locationStatus === 'checking'
                  ? t('citizenReportCreate', 'locationChecking')
                  : locationStatus === 'denied'
                  ? t('citizenReportCreate', 'locationDenied')
                  : t('citizenReportCreate', 'locationDisabled')}
              </Text>
            </View>

            {locationCoords && (
              <Text style={[styles.locationCoordsText, { color: colors.mutedForeground }]}>
                {locationCoords.latitude.toFixed(4)}° N, {locationCoords.longitude.toFixed(4)}° E
              </Text>
            )}

            {locationStatus !== 'ready' && locationStatus !== 'checking' && (
              <TouchableOpacity
                style={[
                  styles.retryLocationBtn,
                  { backgroundColor: colors.warning, borderRadius: radii.md },
                ]}
                onPress={verifyLocation}
                activeOpacity={0.8}
              >
                <Text style={[styles.retryLocationBtnText, { color: colors.warningForeground }]}>
                  {t('citizenReportCreate', 'enableLocationBtn')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Success Card (Displayed after submission) */}
        {submissionResult && (
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
              },
            ]}
          >
            <View
              style={[styles.successIconBadge, { backgroundColor: colors.success + '20' }]}
            >
              <CscrsIcon name="check-circle" size={44} color={colors.success} />
            </View>

            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {submissionResult.duplicate
                ? t('citizenReportCreate', 'duplicateSupportedTitle')
                : t('citizenReportCreate', 'successTitle')}
            </Text>

            <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
              {submissionResult.duplicate
                ? t('citizenReportCreate', 'duplicateSupportedMessage')
                : t('citizenReportCreate', 'successMessage')}
            </Text>

            {submissionResult.report_number && (
              <View
                style={[
                  styles.reportNumberBox,
                  { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
                ]}
              >
                <Text style={[styles.reportNumberLabel, { color: colors.mutedForeground }]}>
                  Official Report Number
                </Text>
                <Text style={[styles.reportNumberValue, { color: colors.primary }]}>
                  {submissionResult.report_number}
                </Text>
              </View>
            )}

            <View style={styles.successActionsRow}>
              {submissionResult.report_number && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1, borderRadius: radii.lg },
                  ]}
                  onPress={() =>
                    navigation.replace('CitizenReportDetails', {
                      reportNumber: submissionResult.report_number,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.primary, borderRadius: radii.lg },
                ]}
                onPress={handleViewReports}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  {t('citizenReportCreate', 'viewReportsAction')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form Section (Hidden after success or during submission) */}
        {!submissionResult && !isSubmitting && (
          <>
            {/* Image Capture / Preview Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                },
              ]}
            >
              {selectedAsset ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedAsset.uri }}
                    style={[styles.previewImage, { borderRadius: radii.lg }]}
                    resizeMode="cover"
                  />
                  <View style={styles.changePhotoRow}>
                    <TouchableOpacity
                      style={[
                        styles.changePhotoBtn,
                        { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
                      ]}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <CscrsIcon name="camera" size={14} color={colors.foreground} />
                      <Text style={[styles.changePhotoBtnText, { color: colors.foreground }]}>
                        Retake Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.changePhotoBtn,
                        { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.md },
                      ]}
                      onPress={handleChooseLibrary}
                      activeOpacity={0.8}
                    >
                      <CscrsIcon name="image" size={14} color={colors.foreground} />
                      <Text style={[styles.changePhotoBtnText, { color: colors.foreground }]}>
                        Pick Another
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Image EXIF GPS Verification Box */}
                  <View
                    style={[
                      styles.exifBox,
                      {
                        backgroundColor: hasValidExifGps(selectedAsset.exif)
                          ? colors.success + '15'
                          : colors.destructive + '15',
                        borderColor: hasValidExifGps(selectedAsset.exif)
                          ? colors.success + '40'
                          : colors.destructive + '40',
                        borderRadius: radii.md,
                      },
                    ]}
                  >
                    <CscrsIcon
                      name={hasValidExifGps(selectedAsset.exif) ? 'check-circle' : 'alert-circle'}
                      size={16}
                      color={hasValidExifGps(selectedAsset.exif) ? colors.success : colors.destructive}
                    />
                    <Text
                      style={[
                        styles.exifBoxText,
                        {
                          color: hasValidExifGps(selectedAsset.exif)
                            ? colors.success
                            : colors.destructive,
                        },
                      ]}
                    >
                      {hasValidExifGps(selectedAsset.exif)
                        ? t('citizenReportCreate', 'imageGpsVerified')
                        : t('citizenReportCreate', 'noGpsError')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.captureOptions}>
                  <TouchableOpacity
                    style={[
                      styles.primaryCaptureBtn,
                      { backgroundColor: colors.primary, borderRadius: radii.xl },
                    ]}
                    onPress={handleTakePhoto}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.captureIconCircle,
                        { backgroundColor: colors.primaryForeground + '22' },
                      ]}
                    >
                      <CscrsIcon name="camera" size={24} color={colors.primaryForeground} />
                    </View>
                    <Text style={[styles.primaryCaptureBtnTitle, { color: colors.primaryForeground }]}>
                      {t('citizenReportCreate', 'takePhoto')}
                    </Text>
                    <Text
                      style={[
                        styles.primaryCaptureBtnSub,
                        { color: colors.primaryForeground + 'CC' },
                      ]}
                    >
                      {t('citizenReportCreate', 'locationRequiredNotice')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryCaptureBtn,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                        borderRadius: radii.lg,
                      },
                    ]}
                    onPress={handleChooseLibrary}
                    activeOpacity={0.85}
                  >
                    <CscrsIcon name="image" size={16} color={colors.foreground} />
                    <Text style={[styles.secondaryCaptureBtnText, { color: colors.foreground }]}>
                      {t('citizenReportCreate', 'chooseLibrary')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Description Input */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('citizenReportCreate', 'descriptionLabel')}
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: radii.md,
                  },
                ]}
                placeholder={t('citizenReportCreate', 'descriptionPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                editable={!isSubmitting}
                textAlignVertical="top"
              />
            </View>

            {/* Error Card */}
            {submissionError && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.destructive + '15',
                    borderColor: colors.destructive + '50',
                    borderRadius: radii.lg,
                  },
                ]}
              >
                <CscrsIcon name="alert-circle" size={18} color={colors.destructive} />
                <Text style={[styles.errorBoxText, { color: colors.destructive }]}>
                  {submissionError}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            {(() => {
              const canSubmit =
                selectedAsset !== null &&
                hasValidExifGps(selectedAsset.exif) &&
                locationStatus === 'ready' &&
                !isSubmitting;

              return (
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: !canSubmit ? colors.muted : colors.primary,
                      borderRadius: radii.xl,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.submitBtnText,
                      {
                        color: !canSubmit ? colors.mutedForeground : colors.primaryForeground,
                      },
                    ]}
                  >
                    {t('citizenReportCreate', 'submitReport')}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </>
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
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  progressCard: {
    padding: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  stagesContainer: {
    gap: 10,
    marginTop: 6,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageIconBox: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageText: {
    fontSize: 13,
  },
  locationCard: {
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationCoordsText: {
    fontSize: 12,
    paddingLeft: 26,
  },
  retryLocationBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginLeft: 26,
  },
  retryLocationBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  captureOptions: {
    gap: 12,
  },
  primaryCaptureBtn: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  captureIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  primaryCaptureBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryCaptureBtnSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  secondaryCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryCaptureBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    gap: 12,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  changePhotoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  changePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    gap: 6,
  },
  changePhotoBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  exifBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    gap: 8,
  },
  exifBoxText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorBoxText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  successCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  reportNumberBox: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
  },
  reportNumberLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportNumberValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
