import React, { useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@cscrs/design-system';
import {
  WorkerAssignmentResponse,
  submitResolution,
  ResolutionResponse,
} from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type ResolutionSubmitRouteProp = RouteProp<
  RootStackParamList,
  'WorkerResolutionSubmit'
>;

interface PickedAsset {
  uri: string;
  mimeType?: string;
  fileName?: string;
}

export const WorkerResolutionSubmitScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ResolutionSubmitRouteProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const { assignment } = route.params;

  const [selectedAsset, setSelectedAsset] = useState<PickedAsset | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [resolutionResult, setResolutionResult] = useState<ResolutionResponse | null>(null);

  // Camera capture
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('workerResolution', 'title'),
          t('workerResolution', 'cameraPermissionMsg')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset) {
          setSelectedAsset({
            uri: asset.uri,
            mimeType: asset.mimeType ?? 'image/jpeg',
            fileName: asset.fileName ?? `resolution_${assignment.assignment_id}.jpg`,
          });
          setSubmissionError(null);
        }
      }
    } catch {
      Alert.alert(
        t('workerResolution', 'errorTitle'),
        t('workerResolution', 'unableToLaunchCameraMsg')
      );
    }
  };

  // Gallery select
  const handleChooseGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('workerResolution', 'title'),
          t('workerResolution', 'photoLibraryPermissionMsg')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset) {
          setSelectedAsset({
            uri: asset.uri,
            mimeType: asset.mimeType ?? 'image/jpeg',
            fileName: asset.fileName ?? `resolution_${assignment.assignment_id}.jpg`,
          });
          setSubmissionError(null);
        }
      }
    } catch {
      Alert.alert(
        t('workerResolution', 'errorTitle'),
        t('workerResolution', 'unableToOpenPhotosMsg')
      );
    }
  };

  // Submit resolution via multipart/form-data
  const handleSubmit = async () => {
    if (!selectedAsset) {
      const msg = t('workerResolution', 'photoRequired');
      setSubmissionError(msg);
      Alert.alert(t('workerResolution', 'title'), msg);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const formData = new FormData();
      formData.append('assignment_id', String(assignment.assignment_id));
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }
      formData.append('image', {
        uri: selectedAsset.uri,
        name: selectedAsset.fileName || `resolution_${assignment.assignment_id}.jpg`,
        type: selectedAsset.mimeType || 'image/jpeg',
      } as any);

      const response = await submitResolution(formData);
      setResolutionResult(response);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setSubmissionError(t('workerResolution', 'rateLimitError'));
      } else if (err?.response?.status === 409) {
        const detail = err.response?.data?.detail;
        setSubmissionError(
          typeof detail === 'string'
            ? detail
            : t('workerResolution', 'conflictError')
        );
      } else if (err?.response?.status === 400) {
        const detail = err.response?.data?.detail;
        setSubmissionError(
          typeof detail === 'string'
            ? detail
            : 'Verification failed. Please ensure the uploaded resolution photo clearly depicts the resolved site.'
        );
      } else {
        const safeMsg =
          err?.response?.data?.detail ||
          err?.message ||
          t('workerResolution', 'networkError');
        setSubmissionError(typeof safeMsg === 'string' ? safeMsg : JSON.stringify(safeMsg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForRetry = () => {
    setResolutionResult(null);
    setSelectedAsset(null);
    setRemarks('');
    setSubmissionError(null);
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

  // Phase 5E: Worker-facing PASS / REVIEW / FAIL Verdict UI
  if (resolutionResult) {
    const isPass =
      resolutionResult.verification_decision === 'PASS' ||
      resolutionResult.verification_passed === true;
    const isReview =
      resolutionResult.verification_decision === 'REVIEW' ||
      resolutionResult.manual_review === true;
    const isFail =
      resolutionResult.verification_decision === 'REJECT' ||
      (!isPass && !isReview);

    const verdictColor = isPass
      ? colors.success
      : isReview
      ? colors.warning
      : colors.destructive;

    const verdictBg = verdictColor + '18';
    const verdictBorder = verdictColor;

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
            styles.successCenter,
            {
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[8] + insets.bottom,
            },
          ]}
        >
          <View
            style={[
              styles.verdictCard,
              {
                backgroundColor: colors.card,
                borderColor: verdictBorder,
                borderRadius: radii['2xl'],
              },
            ]}
          >
            {/* Verdict Icon */}
            <Text style={{ fontSize: 52 }}>
              {isPass ? '🎉' : isReview ? '🔍' : '⚠️'}
            </Text>

            {/* Verdict Badge */}
            <View
              style={[
                styles.verdictBadge,
                { backgroundColor: verdictBg, borderColor: verdictBorder, borderRadius: radii.full },
              ]}
            >
              <Text style={[styles.verdictBadgeText, { color: verdictColor }]}>
                {isPass
                  ? 'VERIFIED • PASS'
                  : isReview
                  ? 'MANUAL REVIEW REQUIRED'
                  : 'VERIFICATION FAILED • REWORK'}
              </Text>
            </View>

            {/* Title & Description */}
            <Text style={[styles.verdictTitle, { color: colors.foreground }]}>
              {isPass
                ? t('workerResolution', 'verdictPassTitle')
                : isReview
                ? t('workerResolution', 'verdictReviewTitle')
                : t('workerResolution', 'verdictFailTitle')}
            </Text>

            <Text style={[styles.verdictDesc, { color: colors.mutedForeground }]}>
              {isPass
                ? t('workerResolution', 'verdictPassDesc')
                : isReview
                ? t('workerResolution', 'verdictReviewDesc')
                : t('workerResolution', 'verdictFailDesc')}
            </Text>

            {/* Structured Metadata Box */}
            <View
              style={[
                styles.metaContainer,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                },
              ]}
            >
              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>
                  {t('workerResolution', 'resolutionId')}
                </Text>
                <Text style={[styles.metaVal, { color: colors.foreground }]}>
                  #{resolutionResult.id}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>
                  {t('workerResolution', 'decisionLabel')}
                </Text>
                <Text style={[styles.metaVal, { color: verdictColor }]}>
                  {resolutionResult.verification_decision || (isPass ? 'PASS' : isReview ? 'REVIEW' : 'REJECT')}
                </Text>
              </View>

              {resolutionResult.verification_score != null && (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>
                    {t('workerResolution', 'scoreLabel')}
                  </Text>
                  <Text style={[styles.metaVal, { color: colors.foreground }]}>
                    {(resolutionResult.verification_score * 100).toFixed(0)}%
                  </Text>
                </View>
              )}

              {resolutionResult.verified_at ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>
                    {t('workerResolution', 'verifiedAtLabel')}
                  </Text>
                  <Text style={[styles.metaVal, { color: colors.foreground }]}>
                    {formatDate(resolutionResult.verified_at)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Rework Notice for FAIL */}
            {isFail && (
              <View
                style={[
                  styles.reworkNoticeBox,
                  {
                    backgroundColor: colors.destructive + '15',
                    borderColor: colors.destructive,
                    borderRadius: radii.lg,
                  },
                ]}
              >
                <Text style={[styles.reworkNoticeText, { color: colors.destructive }]}>
                  {t('workerResolution', 'reworkNotice')}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsArea}>
              {isFail ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: radii.lg,
                      },
                    ]}
                    onPress={handleResetForRetry}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.primaryBtnText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      🔄 {t('workerResolution', 'tryAgainAction')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: radii.lg,
                      },
                    ]}
                    onPress={() => {
                      navigation.replace('WorkerWorkspace');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                      {t('workerResolution', 'backToTasks')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radii.lg,
                    },
                  ]}
                  onPress={() => {
                    navigation.replace('WorkerWorkspace');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {t('workerResolution', 'backToTasks')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

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
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>
            ← {t('workerTaskDetails', 'backToTasks')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('workerResolution', 'title')}
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
        {/* Title & Info */}
        <View style={styles.titleBlock}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {t('workerResolution', 'title')}
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
            {t('workerResolution', 'subtitle')}
          </Text>
          <Text style={[styles.reportInfoBadge, { color: colors.primary }]}>
            Task #{assignment.report_id} • {assignment.issue_type}
          </Text>
        </View>

        {/* Photo Evidence Section */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            📷 {t('workerResolution', 'photoEvidence')}
          </Text>

          {selectedAsset ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedAsset.uri }}
                style={[styles.previewImage, { borderRadius: radii.lg }]}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[
                  styles.retakeBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                  },
                ]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Text style={[styles.retakeBtnText, { color: colors.foreground }]}>
                  🔄 {t('workerResolution', 'retakePhoto')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerBtnRow}>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pickerBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  📸 {t('workerResolution', 'takePhoto')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleChooseGallery}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerBtnText, { color: colors.foreground }]}>
                  🖼️ {t('workerResolution', 'choosePhoto')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Remarks Section */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            📝 {t('workerResolution', 'remarksLabel')}
          </Text>
          <TextInput
            style={[
              styles.remarksInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: radii.md,
              },
            ]}
            placeholder={t('workerResolution', 'remarksPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Error Banner */}
        {submissionError && (
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
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              ⚠️ {submissionError}
            </Text>
          </View>
        )}

        {/* Submit Action Button */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.lg,
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primaryForeground} />
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: colors.primaryForeground },
                ]}
              >
                {t('workerResolution', 'submitting')}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.primaryBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              ✓ {t('workerResolution', 'submitAction')}
            </Text>
          )}
        </TouchableOpacity>
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
    gap: 16,
  },
  titleBlock: {
    gap: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  reportInfoBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerBtnRow: {
    gap: 10,
  },
  pickerBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    gap: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  retakeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  remarksInput: {
    borderWidth: 1,
    padding: 12,
    height: 90,
    fontSize: 14,
  },
  errorCard: {
    padding: 14,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '100%',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verdictCard: {
    width: '100%',
    padding: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 12,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  verdictBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verdictTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  verdictDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  metaContainer: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  reworkNoticeBox: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
  },
  reworkNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  actionButtonsArea: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
});
