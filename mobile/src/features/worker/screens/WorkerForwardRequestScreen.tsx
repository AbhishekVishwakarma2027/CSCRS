import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import {
  WorkerAssignmentResponse,
  submitForwardRequest,
  ForwardRequestResponse,
} from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type ForwardRequestRouteProp = RouteProp<
  RootStackParamList,
  'WorkerForwardRequest'
>;

export const WorkerForwardRequestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ForwardRequestRouteProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const { assignment } = route.params;

  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forwardResult, setForwardResult] = useState<ForwardRequestResponse | null>(null);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      const msg = t('workerForwardRequest', 'reasonRequired');
      setErrorMessage(msg);
      Alert.alert(t('workerForwardRequest', 'title'), msg);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitForwardRequest(assignment.report_id, {
        reason: trimmed,
      });
      setForwardResult(result);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setErrorMessage(t('workerForwardRequest', 'alreadyPendingError'));
      } else if (err?.response?.status === 403) {
        setErrorMessage(t('workerForwardRequest', 'unauthorizedError'));
      } else if (err?.response?.status === 404) {
        setErrorMessage('Report or assignment not found.');
      } else {
        const safeMsg =
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to submit forward request. Please try again.';
        setErrorMessage(typeof safeMsg === 'string' ? safeMsg : JSON.stringify(safeMsg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If submitted successfully, render confirmation state
  if (forwardResult) {
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
            styles.centerContent,
            {
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[8] + insets.bottom,
            },
          ]}
        >
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderRadius: radii['2xl'],
              },
            ]}
          >
            <Text style={{ fontSize: 52 }}>🚩</Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.warning + '20', borderColor: colors.warning, borderRadius: radii.full },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                {t('workerForwardRequest', 'statusPending')}
              </Text>
            </View>

            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {t('workerForwardRequest', 'successTitle')}
            </Text>

            <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
              {t('workerForwardRequest', 'successMessage')}
            </Text>

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
                  Request ID
                </Text>
                <Text style={[styles.metaVal, { color: colors.foreground }]}>
                  #{forwardResult.id}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>
                  Report
                </Text>
                <Text style={[styles.metaVal, { color: colors.foreground }]}>
                  #{forwardResult.report_id}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: colors.mutedForeground }]}>
                  Reason
                </Text>
                <Text
                  style={[styles.metaVal, { color: colors.foreground, flex: 1, textAlign: 'right' }]}
                  numberOfLines={2}
                >
                  {forwardResult.reason}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  marginTop: spacing[3],
                  width: '100%',
                },
              ]}
              onPress={() => {
                navigation.goBack();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: colors.primaryForeground },
                ]}
              >
                {t('workerForwardRequest', 'backToTaskAction')}
              </Text>
            </TouchableOpacity>
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
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>
            ← {t('workerForwardRequest', 'cancelAction')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('workerForwardRequest', 'title')}
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
        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {t('workerForwardRequest', 'title')}
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
            {t('workerForwardRequest', 'subtitle')}
          </Text>
        </View>

        {/* Task Reference Card */}
        <View
          style={[
            styles.refCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <Text style={[styles.refCardTitle, { color: colors.foreground }]}>
            Task #{assignment.report_id} • {assignment.issue_type}
          </Text>
          {assignment.address ? (
            <Text style={[styles.refCardSubtitle, { color: colors.mutedForeground }]}>
              📍 {assignment.address}
            </Text>
          ) : null}
        </View>

        {/* Reason Input Card */}
        <View
          style={[
            styles.inputCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            {t('workerForwardRequest', 'reasonLabel')} *
          </Text>
          <TextInput
            style={[
              styles.reasonInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: radii.md,
              },
            ]}
            placeholder={t('workerForwardRequest', 'reasonPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Error Banner */}
        {errorMessage && (
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
              ⚠️ {errorMessage}
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
                {t('workerForwardRequest', 'submitting')}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.primaryBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              🚩 {t('workerForwardRequest', 'submitAction')}
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
  refCard: {
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  refCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  refCardSubtitle: {
    fontSize: 12,
  },
  inputCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  reasonInput: {
    borderWidth: 1,
    padding: 12,
    height: 120,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  successDesc: {
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
    gap: 8,
  },
  metaKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
  },
});
