import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { AppLanguage } from '@cscrs/models';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type LanguageNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'LanguageSelection'
>;

interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  badge: string;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    badge: 'EN',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    badge: 'HI',
  },
];

export const LanguageSelectionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LanguageNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { language, setLanguage, t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage | null>(
    language || null
  );

  const handleSelect = (code: AppLanguage) => {
    setSelectedLanguage(code);
    setLanguage(code);
  };

  const handleContinue = () => {
    if (!selectedLanguage) return;
    navigation.navigate('RoleSelection');
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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing[5], paddingTop: spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('language', 'title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('language', 'subtitle')}
          </Text>
        </View>

        {/* Language Cards */}
        <View style={[styles.list, { gap: spacing[3] }]}>
          {languages.map((item) => {
            const isSelected = selectedLanguage === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? colors.card
                      : colors.secondary,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.border,
                    borderRadius: radii.xl,
                  },
                ]}
                onPress={() => handleSelect(item.code)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.name}, ${item.nativeName}`}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.langBadge,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.border,
                        borderRadius: radii.md,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.langBadgeText,
                        {
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>

                  <View style={styles.cardTexts}>
                    <Text
                      style={[
                        styles.langName,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.langNative,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.nativeName}
                    </Text>
                  </View>
                </View>

                {/* Radio Indicator */}
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected
                        ? colors.primary
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[4],
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedLanguage
                ? colors.primary
                : colors.muted,
              borderRadius: radii.lg,
            },
          ]}
          disabled={!selectedLanguage}
          onPress={handleContinue}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue to role selection"
        >
          <Text
            style={[
              styles.continueButtonText,
              {
                color: selectedLanguage
                  ? colors.primaryForeground
                  : colors.mutedForeground,
              },
            ]}
          >
            {t('common', 'continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderWidth: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  langBadge: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardTexts: {
    gap: 2,
  },
  langName: {
    fontSize: 17,
    fontWeight: '700',
  },
  langNative: {
    fontSize: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  continueButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
