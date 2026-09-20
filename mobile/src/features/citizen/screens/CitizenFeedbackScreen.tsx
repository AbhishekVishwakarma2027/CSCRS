import React, { useState } from 'react';
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
import { submitFeedback, parseApiError } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';

export function CitizenFeedbackScreen() {
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useI18n();

  const [rating, setRating] = useState<number>(5);
  const [likedText, setLikedText] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5 || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await submitFeedback({
        rating,
        liked_text: likedText.trim() ? likedText.trim() : undefined,
        suggestion_text: suggestionText.trim() ? suggestionText.trim() : undefined,
      });
      setSubmitted(true);
      setLikedText('');
      setSuggestionText('');
    } catch (err: unknown) {
      const parsed = parseApiError(err, t('citizenLogin', 'networkError'));
      setErrorMessage(parsed);
    } finally {
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
            {t('feedback', 'title')}
          </Text>
          <View style={{ width: 36 }} />
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
          {submitted ? (
            <View
              style={[
                styles.successCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <View
                style={[
                  styles.successIconBox,
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <CscrsIcon name="check-circle" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                {t('feedback', 'successTitle')}
              </Text>
              <Text
                style={[styles.successSubtitle, { color: colors.mutedForeground }]}
              >
                {t('feedback', 'successMessage')}
              </Text>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.md,
                    marginTop: 20,
                    width: '100%',
                  },
                ]}
                onPress={() => navigation.goBack()}
              >
                <Text
                  style={[styles.submitBtnText, { color: colors.primaryForeground }]}
                >
                  {t('common', 'continue')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('feedback', 'subtitle')}
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

              {/* Rating Card */}
              <View
                style={[
                  styles.ratingCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                  },
                ]}
              >
                <Text style={[styles.ratingLabel, { color: colors.foreground }]}>
                  {t('feedback', 'ratingLabel')}
                </Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starTouch}
                      accessibilityLabel={`${star} stars`}
                    >
                      <CscrsIcon
                        name="star"
                        size={32}
                        color={star <= rating ? '#F59E0B' : colors.mutedForeground + '60'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Liked Text */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  {t('feedback', 'likedLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('feedback', 'likedPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={likedText}
                  onChangeText={setLikedText}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  editable={!isSubmitting}
                />
              </View>

              {/* Suggestion Text */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  {t('feedback', 'suggestionLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: radii.md,
                    },
                  ]}
                  placeholder={t('feedback', 'suggestionPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={suggestionText}
                  onChangeText={setSuggestionText}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  editable={!isSubmitting}
                />
              </View>

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
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                accessibilityLabel={t('feedback', 'submitButton')}
              >
                {isSubmitting ? (
                  <View style={styles.submitRow}>
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                    <Text
                      style={[
                        styles.submitBtnText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {t('feedback', 'submitting')}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.submitBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {t('feedback', 'submitButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  ratingCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  starTouch: {
    padding: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
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
  successCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
