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
import { submitPlatformIssue, parseApiError } from '@cscrs/api';
import { useI18n } from '../../../core/i18n';

const ISSUE_CATEGORIES = ['UI / Display', 'Performance / Lag', 'Network / Connection', 'Crash / Bug', 'Other'];

export function PlatformIssueReportScreen() {
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useI18n();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(ISSUE_CATEGORIES[0] || 'UI / Display');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isFormValid = title.trim().length >= 3 && description.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);

      await submitPlatformIssue(formData);
      setTitle('');
      setDescription('');
      setSuccessMessage(t('platformIssue', 'successMessage'));
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to report platform issue. Please try again.');
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
            {t('platformIssue', 'title')}
          </Text>
          <TouchableOpacity
            style={[styles.historyBtn, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('PlatformIssueList')}
            accessibilityLabel="View issues history"
          >
            <CscrsIcon name="file-text" size={18} color={colors.foreground} />
          </TouchableOpacity>
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
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('platformIssue', 'subtitle')}
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

          <View style={styles.form}>
            {/* Category selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('platformIssue', 'categoryLabel')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {ISSUE_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                          borderRadius: radii.full,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: selected ? colors.primaryForeground : colors.foreground,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Issue Title */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('platformIssue', 'titleLabel')} *
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
                placeholder={t('platformIssue', 'titlePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!isSubmitting}
              />
            </View>

            {/* Issue Description */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t('platformIssue', 'descLabel')} *
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
                placeholder={t('platformIssue', 'descPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={1000}
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
                  opacity: isFormValid && !isSubmitting ? 1 : 0.6,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                    {t('platformIssue', 'submitting')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                  {t('platformIssue', 'submitButton')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  historyBtn: {
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
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
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
});
