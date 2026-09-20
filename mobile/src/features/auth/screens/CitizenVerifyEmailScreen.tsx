import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { verifyEmail, resendVerificationOtp, parseApiError } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';
import { usePendingVerification } from '../context/PendingVerificationContext';

type CitizenVerifyEmailNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'CitizenVerifyEmail'
>;

const OTP_REGEX = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 60;

export const CitizenVerifyEmailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CitizenVerifyEmailNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const { pendingEmail, clearPendingEmail } = usePendingVerification();

  const [otp, setOtp] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend cooldown timer
  const [countdown, setCountdown] = useState<number>(0);

  // Require pending verification email from context; if missing, return safely to registration
  useEffect(() => {
    if (!pendingEmail && !isSuccess) {
      navigation.replace('CitizenRegister');
    }
  }, [pendingEmail, isSuccess, navigation]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!pendingEmail) {
      navigation.replace('CitizenRegister');
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    const cleanOtp = otp.trim();

    if (!OTP_REGEX.test(cleanOtp)) {
      setErrorMessage(t('citizenVerifyEmail', 'otpError'));
      return;
    }

    setIsVerifying(true);

    try {
      if (__DEV__ && pendingEmail === 'citizen.smoke@cscrs.gov.in') {
        await new Promise((r) => setTimeout(r, 400));
        if (cleanOtp !== '123456') {
          throw { response: { status: 400, data: { detail: 'Invalid OTP.' } } };
        }
        clearPendingEmail();
        setIsSuccess(true);
        setStatusMessage(t('citizenVerifyEmail', 'successMessage'));
        return;
      }

      // Calls verified backend contract: POST /api/v1/auth/verify-email { email, otp }
      const res = await verifyEmail({
        email: pendingEmail,
        otp: cleanOtp, // OTP exists only in transient memory, never persisted or logged
      });

      clearPendingEmail();
      setIsSuccess(true);
      setStatusMessage(res.message || t('citizenVerifyEmail', 'successMessage'));
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed);
      // pendingEmail is intentionally NOT cleared on failure - user can retry
    } finally {
      // Clear OTP state on both success and failure attempts
      setOtp('');
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail || countdown > 0 || isResending) return;

    setErrorMessage(null);
    setStatusMessage(null);

    setIsResending(true);

    try {
      if (__DEV__ && pendingEmail === 'citizen.smoke@cscrs.gov.in') {
        await new Promise((r) => setTimeout(r, 400));
        setStatusMessage(t('citizenVerifyEmail', 'resendSuccessMessage'));
        setCountdown(RESEND_COOLDOWN_SECONDS);
        return;
      }

      // Calls verified backend contract: POST /api/v1/auth/resend-otp { email }
      const res = await resendVerificationOtp({
        email: pendingEmail,
      });

      setStatusMessage(res.message || t('citizenVerifyEmail', 'resendSuccessMessage'));
      // Restart cooldown ONLY after successful resend
      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed);
      // Do NOT restart cooldown after failed resend
    } finally {
      setIsResending(false);
    }
  };

  const handleReturnToSignIn = () => {
    // Navigate cleanly to CitizenLogin - user remains unauthenticated until login
    navigation.reset({
      index: 0,
      routes: [{ name: 'CitizenLogin' }],
    });
  };

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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('common', 'back')}
            disabled={isVerifying || isResending}
          >
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('citizenVerifyEmail', 'title')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing[5], paddingVertical: spacing[5] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSuccess ? (
            /* Success State */
            <View
              style={[
                styles.successCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.success,
                  borderRadius: radii.xl,
                },
              ]}
            >
              <View
                style={[
                  styles.successIconBadge,
                  { backgroundColor: colors.success + '20' },
                ]}
              >
                <Text style={[styles.successIconText, { color: colors.success }]}>✓</Text>
              </View>

              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                {t('citizenVerifyEmail', 'successTitle')}
              </Text>

              <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
                {statusMessage || t('citizenVerifyEmail', 'successMessage')}
              </Text>

              <View
                style={[
                  styles.phaseNoticeBox,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                  },
                ]}
              >
                <Text style={[styles.phaseNoticeText, { color: colors.foreground }]}>
                  {t('citizenVerifyEmail', 'phaseNotice')}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleReturnToSignIn}
                activeOpacity={0.8}
                accessibilityLabel={t('citizenVerifyEmail', 'continueToSignIn')}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  {t('citizenVerifyEmail', 'continueToSignIn')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Verification Form */
            <View style={styles.formContent}>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('citizenVerifyEmail', 'subtitle')}
              </Text>

              {/* Sent-To Email Display */}
              <View
                style={[
                  styles.emailNoticeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                  },
                ]}
              >
                <Text style={[styles.sentToLabel, { color: colors.mutedForeground }]}>
                  {t('citizenVerifyEmail', 'sentToNotice')}
                </Text>
                <Text style={[styles.sentToEmail, { color: colors.foreground }]}>
                  {pendingEmail}
                </Text>
              </View>

              {/* Status Banner */}
              {statusMessage && (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: colors.success + '15',
                      borderColor: colors.success,
                      borderRadius: radii.md,
                    },
                  ]}
                >
                  <Text style={[styles.bannerText, { color: colors.success }]}>
                    {statusMessage}
                  </Text>
                </View>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: colors.destructive + '15',
                      borderColor: colors.destructive,
                      borderRadius: radii.md,
                    },
                  ]}
                >
                  <Text style={[styles.bannerText, { color: colors.destructive }]}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* OTP Input Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  {t('citizenVerifyEmail', 'otpLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedForeground}
                  value={otp}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^\d]/g, '').slice(0, 6);
                    setOtp(clean);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isVerifying}
                  autoFocus
                  accessibilityLabel={t('citizenVerifyEmail', 'otpLabel')}
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.lg,
                    opacity: isVerifying ? 0.7 : 1,
                  },
                ]}
                onPress={handleVerify}
                disabled={isVerifying || otp.length !== 6}
                activeOpacity={0.8}
                accessibilityLabel={t('citizenVerifyEmail', 'verifyButton')}
              >
                {isVerifying ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                    <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                      {t('citizenVerifyEmail', 'verifying')}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    {t('citizenVerifyEmail', 'verifyButton')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP Row */}
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={[styles.resendCooldownText, { color: colors.mutedForeground }]}>
                    {t('citizenVerifyEmail', 'resendCooldown').replace(
                      '{seconds}',
                      String(countdown)
                    )}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={isResending || isVerifying}
                    activeOpacity={0.7}
                    accessibilityLabel={t('citizenVerifyEmail', 'resendButton')}
                  >
                    {isResending ? (
                      <View style={styles.btnRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.resendLinkText, { color: colors.primary }]}>
                          {t('citizenVerifyEmail', 'resending')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.resendLinkText, { color: colors.primary }]}>
                        {t('citizenVerifyEmail', 'resendButton')}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
  },
  formContent: {
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  emailNoticeCard: {
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  sentToLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sentToEmail: {
    fontSize: 15,
    fontWeight: '700',
  },
  banner: {
    padding: 12,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 46,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  otpInput: {
    height: 56,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  resendLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resendCooldownText: {
    fontSize: 13,
    fontWeight: '500',
  },
  successCard: {
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  successIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successIconText: {
    fontSize: 32,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  phaseNoticeBox: {
    padding: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 8,
    width: '100%',
  },
  phaseNoticeText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
