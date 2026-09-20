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
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import { loginUser, parseApiError } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';
import { useAuthSession } from '../../../core/auth';
import { RootStackParamList } from '../../../app/navigation/types';

type WorkerLoginNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'WorkerLogin'
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const WorkerLoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WorkerLoginNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const { loginWithTokens } = useAuthSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = t('workerLogin', 'emailError');
    }

    if (!password || password.length < 8) {
      newErrors.password = t('workerLogin', 'passwordError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      // 1. Call existing POST /api/v1/auth/login with OAuth2 form-urlencoded payload
      const tokens = await loginUser({
        username: trimmedEmail,
        password,
      });

      // 2. Pass tokens to existing loginWithTokens() in AuthContext
      // AuthContext handles SecureTokenStore persistence, /me resolution, and rollback on error
      await loginWithTokens(tokens);

      // 3. Delegate to existing auth boundary architecture for destination routing
      navigation.replace('AuthBoundary');
    } catch (err: unknown) {
      const parsed = parseApiError(err, t('workerLogin', 'networkError'));
      setErrorMessage(parsed);
    } finally {
      // Strictly clear transient password from state
      setPassword('');
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
            <CscrsIcon name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('workerLogin', 'title')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: spacing[5],
              paddingTop: spacing[5],
              paddingBottom: spacing[6],
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subtitle & Role Badge */}
          <View style={styles.introBox}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: colors.warning ? colors.warning + '20' : colors.primary + '18' },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: colors.warning ? colors.warning : colors.primary },
                ]}
              >
                {t('workerLogin', 'badge')}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t('workerLogin', 'subtitle')}
            </Text>
          </View>

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

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Official Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('workerLogin', 'emailLabel')} *
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
                placeholder={t('workerLogin', 'emailPlaceholder')}
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
                accessibilityLabel={t('workerLogin', 'emailLabel')}
              />
              {errors.email && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('workerLogin', 'passwordLabel')} *
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: errors.password ? colors.destructive : colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('workerLogin', 'passwordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  accessibilityLabel={t('workerLogin', 'passwordLabel')}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Toggle password visibility"
                >
                  <CscrsIcon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 4 }}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isSubmitting}
              accessibilityLabel={t('forgotPassword', 'forgotPasswordLink')}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.primary,
                }}
              >
                {t('forgotPassword', 'forgotPasswordLink')}
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.8}
              accessibilityLabel={t('workerLogin', 'signInButton')}
            >
              {isSubmitting ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                    {t('workerLogin', 'signingIn')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                  {t('workerLogin', 'signInButton')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Informational Notice */}
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                },
              ]}
            >
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                {t('workerLogin', 'notice')}
              </Text>
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
  introBox: {
    gap: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  banner: {
    padding: 12,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  form: {
    gap: 16,
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
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingRight: 56,
    fontSize: 15,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: 48,
    justifyContent: 'center',
  },
  eyeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldError: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  submitBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeBox: {
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
