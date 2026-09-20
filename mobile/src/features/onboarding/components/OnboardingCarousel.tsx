import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@cscrs/design-system';
import { useI18n } from '../../../core/i18n';

export interface OnboardingSlide {
  id: string;
  badge: string;
  title: string;
  description: string;
  image?: ImageSourcePropType;
}

interface OnboardingCarouselProps {
  slides: OnboardingSlide[];
  onComplete: () => void;
  onBackToRole: () => void;
  roleTitle: string;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  slides,
  onComplete,
  onBackToRole,
  roleTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const isDark = theme.isDark;

  const isLastSlide = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex] || slides[0]!;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      onBackToRole();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Full-bleed background illustration */}
      {currentSlide.image && (
        <Image
          source={currentSlide.image}
          style={styles.fullBleedIllustration}
          resizeMode="contain"
          accessibilityLabel={currentSlide.title}
        />
      )}

      {/* 2. Top Overlay: Role Badge, Skip Button, Progress Indicators */}
      <View
        style={[
          styles.topOverlay,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 12),
            paddingHorizontal: spacing[4],
          },
        ]}
      >
        <View style={styles.topRow}>
          {/* Role Pill */}
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(15, 23, 42, 0.82)'
                  : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text style={[styles.roleBadgeText, { color: colors.foreground }]}>
              {roleTitle}
            </Text>
          </View>

          {/* Skip Button */}
          {!isLastSlide ? (
            <TouchableOpacity
              style={[
                styles.skipButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(15, 23, 42, 0.72)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              onPress={onComplete}
              activeOpacity={0.7}
              accessibilityLabel="Skip onboarding"
            >
              <Text style={[styles.skipButtonText, { color: colors.foreground }]}>
                {t('common', 'skip')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Progress Indicators (directly below role pill) */}
        <View style={styles.progressContainer}>
          {slides.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive
                      ? colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.35)'
                      : 'rgba(15, 41, 66, 0.22)',
                    width: isActive ? 28 : 8,
                    borderRadius: radii.full,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Spacer pushing the card to the bottom while artwork spans the entire view */}
      <View style={styles.artworkSpace} pointerEvents="none" />

      {/* 3. Translucent / Frosted Bottom Information Card */}
      <View
        style={[
          styles.bottomCardWrapper,
          {
            paddingBottom: Math.max(insets.bottom + 8, 20),
            paddingHorizontal: spacing[4],
          },
        ]}
      >
        <View
          style={[
            styles.glassCard,
            {
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.88)'
                : 'rgba(255, 255, 255, 0.88)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(255, 255, 255, 0.95)',
              borderRadius: 24,
            },
          ]}
        >
          {/* Step Badge */}
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: colors.primary + '18' },
            ]}
          >
            <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
              {currentSlide.badge}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {currentSlide.title}
          </Text>

          {/* Description */}
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
          >
            {currentSlide.description}
          </Text>

          {/* Button Controls Row */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 41, 59, 0.65)'
                    : 'rgba(241, 245, 249, 0.88)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                  borderRadius: radii.lg,
                },
              ]}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <Text style={[styles.backButtonText, { color: colors.foreground }]}>
                {t('common', 'back')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={handleNext}
              activeOpacity={0.85}
              accessibilityLabel={isLastSlide ? 'Complete onboarding' : 'Next slide'}
            >
              <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
                {isLastSlide ? t('common', 'getStarted') : t('common', 'next')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  fullBleedIllustration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    width: '100%',
    zIndex: 10,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingLeft: 2,
  },
  dot: {
    height: 6,
  },
  artworkSpace: {
    flex: 1,
  },
  bottomCardWrapper: {
    width: '100%',
    zIndex: 10,
  },
  glassCard: {
    padding: 20,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
