import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  parseApiError,
} from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type ForgotStep = 'email' | 'otp' | 'password' | 'success';

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();

  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      // Strictly wipe sensitive transient memory
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage(t('forgotPassword', 'invalidEmailError'));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await forgotPassword({ email: trimmedEmail });
      startCooldown(60);
      setStep('otp');
    } catch (err) {
      setErrorMessage(parseApiError(err, 'Failed to send reset code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setErrorMessage(t('forgotPassword', 'invalidOtpError'));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: trimmedOtp,
      });
      setStep('password');
    } catch (err) {
      setErrorMessage(parseApiError(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setErrorMessage(t('forgotPassword', 'passwordLengthError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('forgotPassword', 'passwordMismatch'));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      // Wipe passwords immediately
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setStep('success');
    } catch (err) {
      setErrorMessage(parseApiError(err, 'Failed to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
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
            onPress={() => {
              if (step === 'otp') setStep('email');
              else if (step === 'password') setStep('otp');
              else navigation.goBack();
            }}
            disabled={loading}
            accessibilityLabel={t('common', 'back')}
          >
            <CscrsIcon name="chevronLeft" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('forgotPassword', 'title')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[6] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          {step !== 'success' && (
            <View style={styles.stepIndicator}>
              <Text
                style={[
                  styles.stepText,
                  { color: step === 'email' ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t('forgotPassword', 'stepEmail')}
              </Text>
              <Text style={{ color: colors.mutedForeground }}> → </Text>
              <Text
                style={[
                  styles.stepText,
                  { color: step === 'otp' ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t('forgotPassword', 'stepOtp')}
              </Text>
              <Text style={{ color: colors.mutedForeground }}> → </Text>
              <Text
                style={[
                  styles.stepText,
                  { color: step === 'password' ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t('forgotPassword', 'stepPassword')}
              </Text>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: colors.destructive + '15', borderColor: colors.destructive },
              ]}
            >
              <CscrsIcon name="alert" size={16} color={colors.destructive} style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* STEP 1: Email */}
          {step === 'email' && (
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('forgotPassword', 'title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('forgotPassword', 'subtitle')}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('forgotPassword', 'emailLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage(null);
                  }}
                  placeholder={t('forgotPassword', 'emailPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, borderRadius: radii.md, opacity: loading ? 0.7 : 1 },
                ]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    {t('forgotPassword', 'sendOtpButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('forgotPassword', 'otpStepTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('forgotPassword', 'otpStepSubtitle')}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('forgotPassword', 'otpLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.otpInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val.replace(/[^0-9]/g, '').slice(0, 6));
                    setErrorMessage(null);
                  }}
                  placeholder={t('forgotPassword', 'otpPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, borderRadius: radii.md, opacity: loading ? 0.7 : 1 },
                ]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    {t('forgotPassword', 'verifyOtpButton')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend Cooldown */}
              <View style={styles.resendRow}>
                {resendCooldown > 0 ? (
                  <Text style={[styles.cooldownText, { color: colors.mutedForeground }]}>
                    {t('forgotPassword', 'resendCooldown').replace('{seconds}', String(resendCooldown))}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                    <Text style={[styles.resendLink, { color: colors.accent }]}>
                      {t('forgotPassword', 'resendAction')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 'password' && (
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('forgotPassword', 'newPasswordLabel')}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('forgotPassword', 'newPasswordLabel')}
                </Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.foreground,
                        borderRadius: radii.md,
                        flex: 1,
                      },
                    ]}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      setErrorMessage(null);
                    }}
                    placeholder={t('forgotPassword', 'newPasswordPlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('forgotPassword', 'confirmPasswordLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setErrorMessage(null);
                  }}
                  placeholder={t('forgotPassword', 'confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, borderRadius: radii.md, opacity: loading ? 0.7 : 1 },
                ]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    {t('forgotPassword', 'resetPasswordButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* SUCCESS SCREEN */}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View
                style={[
                  styles.successBadge,
                  { backgroundColor: colors.success + '20', borderColor: colors.success },
                ]}
              >
                <CscrsIcon name="check" size={36} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                {t('forgotPassword', 'resetSuccess')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, borderRadius: radii.md, marginTop: spacing[6], width: '100%' },
                ]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                  {t('forgotPassword', 'returnToLogin')}
                </Text>
              </TouchableOpacity>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  formContainer: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  primaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  cooldownText: {
    fontSize: 13,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
});
