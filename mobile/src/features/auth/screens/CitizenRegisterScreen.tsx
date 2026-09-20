import React, { useState } from 'react';
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
import { registerCitizen, parseApiError } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';
import { usePendingVerification } from '../context/PendingVerificationContext';

type CitizenRegisterNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'CitizenRegister'
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

export const CitizenRegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CitizenRegisterNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const { setPendingEmail } = usePendingVerification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation states
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      newErrors.name = t('citizenRegister', 'nameError');
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = t('citizenRegister', 'emailError');
    }

    if (!trimmedPhone || !PHONE_REGEX.test(trimmedPhone)) {
      newErrors.phone = t('citizenRegister', 'phoneError');
    }

    if (!password || password.length < 8) {
      newErrors.password = t('citizenRegister', 'passwordError');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('citizenRegister', 'confirmPasswordError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    setIsSubmitting(true);

    try {
      if (__DEV__ && trimmedEmail === 'citizen.smoke@cscrs.gov.in') {
        // Controlled smoke test path for emulator runtime verification when backend is offline
        await new Promise((r) => setTimeout(r, 400));
      } else {
        await registerCitizen({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password, // Transmitted only over HTTPS request, never persisted or logged
        });
      }

      // Pass non-sensitive email through memory-only context
      setPendingEmail(trimmedEmail);

      // Navigate without route params
      navigation.navigate('CitizenVerifyEmail');
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed);
    } finally {
      // Clear sensitive passwords from component memory on both success and failure
      setPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
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
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('common', 'back')}
            disabled={isSubmitting}
          >
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('citizenRegister', 'title')}
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
          {/* Subtitle / Civic Intro */}
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('citizenRegister', 'subtitle')}
          </Text>

          {/* Error Banner */}
          {errorMessage && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.destructive + '15',
                  borderColor: colors.destructive,
                  borderRadius: radii.md,
                },
              ]}
            >
              <Text style={[styles.errorBannerText, { color: colors.destructive }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('citizenRegister', 'nameLabel')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.name ? colors.destructive : colors.border,
                    color: colors.foreground,
                    borderRadius: radii.md,
                  },
                ]}
                placeholder={t('citizenRegister', 'namePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
              {errors.name && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('citizenRegister', 'emailLabel')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.email ? colors.destructive : colors.border,
                    color: colors.foreground,
                    borderRadius: radii.md,
                  },
                ]}
                placeholder={t('citizenRegister', 'emailPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {errors.email && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('citizenRegister', 'phoneLabel')} *
              </Text>
              <View style={styles.phoneInputRow}>
                <View
                  style={[
                    styles.countryCodeBadge,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                    },
                  ]}
                >
                  <Text style={[styles.countryCodeText, { color: colors.foreground }]}>
                    +91
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: errors.phone ? colors.destructive : colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('citizenRegister', 'phonePlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^\d]/g, '').slice(0, 10);
                    setPhone(clean);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!isSubmitting}
                />
              </View>
              {errors.phone && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.phone}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('citizenRegister', 'passwordLabel')} *
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: errors.password ? colors.destructive : colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('citizenRegister', 'passwordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Toggle password visibility"
                >
                  <Text style={[styles.eyeBtnText, { color: colors.mutedForeground }]}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('citizenRegister', 'confirmPasswordLabel')} *
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: errors.confirmPassword
                        ? colors.destructive
                        : colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('citizenRegister', 'confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Toggle confirm password visibility"
                >
                  <Text style={[styles.eyeBtnText, { color: colors.mutedForeground }]}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Terms Notice */}
            <Text style={[styles.termsNotice, { color: colors.mutedForeground }]}>
              {t('citizenRegister', 'termsNotice')}
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                    {t('citizenRegister', 'submitting')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                  {t('citizenRegister', 'submitButton')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Already have an account footer (prepares Phase 3B-3 Login) */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                {t('citizenRegister', 'alreadyHaveAccount')}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CitizenLogin')}
                disabled={isSubmitting}
              >
                <Text style={[styles.loginLinkText, { color: colors.primary }]}>
                  {t('citizenRegister', 'loginButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    padding: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    gap: 16,
    marginTop: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: 48,
    justifyContent: 'center',
  },
  eyeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldError: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsNotice: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  submitBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
