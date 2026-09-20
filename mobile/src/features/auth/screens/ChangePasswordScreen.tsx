import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import { changePassword, parseApiError } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';

export function ChangePasswordScreen() {
  const { theme } = useTheme();
  const { colors, typography, spacing, radii } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useI18n();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Strictly wipe transient credentials on unmount
  useEffect(() => {
    return () => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  // Validation rules
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid =
    oldPassword.length > 0 &&
    hasMinLen &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Clear state immediately upon successful submission
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(t('changePassword', 'changeSuccess'));
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to change password. Please try again.');
      setErrorMessage(parsed);
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          >
            <CscrsIcon name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('changePassword', 'title')}
          </Text>
          <View style={{ width: 40 }} />
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
          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('changePassword', 'subtitle')}
          </Text>

          {/* Error Banner */}
          {errorMessage && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.destructive + '15',
                  borderColor: colors.destructive + '40',
                  borderRadius: radii.md,
                },
              ]}
            >
              <CscrsIcon name="alert-circle" size={18} color={colors.destructive} />
              <Text style={[styles.bannerText, { color: colors.destructive }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Success Banner */}
          {successMessage && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '40',
                  borderRadius: radii.md,
                },
              ]}
            >
              <CscrsIcon name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.bannerText, { color: colors.primary }]}>
                {successMessage}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Current / Old Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('changePassword', 'oldPasswordLabel')} *
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('changePassword', 'oldPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={oldPassword}
                  onChangeText={(text) => {
                    setOldPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showOldPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel={t('changePassword', 'oldPasswordLabel')}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowOldPassword(!showOldPassword)}
                  accessibilityLabel="Toggle old password visibility"
                >
                  <CscrsIcon
                    name={showOldPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('changePassword', 'newPasswordLabel')} *
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('changePassword', 'newPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel={t('changePassword', 'newPasswordLabel')}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  accessibilityLabel="Toggle new password visibility"
                >
                  <CscrsIcon
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('changePassword', 'confirmPasswordLabel')} *
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        confirmPassword.length > 0 && !passwordsMatch
                          ? colors.destructive
                          : colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('changePassword', 'confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel={t('changePassword', 'confirmPasswordLabel')}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityLabel="Toggle confirm password visibility"
                >
                  <CscrsIcon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={[styles.fieldError, { color: colors.destructive }]}>
                  {t('changePassword', 'passwordMismatch')}
                </Text>
              )}
            </View>

            {/* Password Policy Requirements */}
            <View
              style={[
                styles.policyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                },
              ]}
            >
              <Text style={[styles.policyHeader, { color: colors.foreground }]}>
                Password Requirements
              </Text>
              <RequirementItem
                met={hasMinLen}
                text="At least 8 characters"
                colors={colors}
              />
              <RequirementItem
                met={hasUpper}
                text="At least 1 uppercase letter (A-Z)"
                colors={colors}
              />
              <RequirementItem
                met={hasLower}
                text="At least 1 lowercase letter (a-z)"
                colors={colors}
              />
              <RequirementItem
                met={hasNumber}
                text="At least 1 number (0-9)"
                colors={colors}
              />
              <RequirementItem
                met={hasSpecial}
                text="At least 1 special character"
                colors={colors}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  opacity: isFormValid && !isLoading ? 1 : 0.6,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
              accessibilityLabel={t('changePassword', 'changeButton')}
            >
              {isLoading ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text
                    style={[styles.submitBtnText, { color: colors.primaryForeground }]}
                  >
                    {t('changePassword', 'changing')}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.submitBtnText, { color: colors.primaryForeground }]}
                >
                  {t('changePassword', 'changeButton')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back Button if successful */}
            {successMessage && (
              <TouchableOpacity
                style={[
                  styles.doneBtn,
                  {
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.doneBtnText, { color: colors.foreground }]}>
                  {t('common', 'back')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function RequirementItem({
  met,
  text,
  colors,
}: {
  met: boolean;
  text: string;
  colors: { primary: string; mutedForeground: string };
}) {
  return (
    <View style={styles.requirementRow}>
      <CscrsIcon
        name={met ? 'check-circle' : 'circle'}
        size={14}
        color={met ? colors.primary : colors.mutedForeground}
      />
      <Text
        style={[
          styles.requirementText,
          {
            color: met ? colors.primary : colors.mutedForeground,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: {
    flex: 1,
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
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
  },
  policyCard: {
    padding: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  policyHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
  },
  submitBtn: {
    paddingVertical: 14,
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
  doneBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
