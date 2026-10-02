import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setOnboardingCompleted } from '@cscrs/storage';
import { useI18n } from '../../../core/i18n';
import { OnboardingCarousel, OnboardingSlide } from '../components/OnboardingCarousel';
import { RootStackParamList } from '../../../app/navigation/types';

type CitizenNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'CitizenOnboarding'
>;

export const CitizenOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<CitizenNavProp>();
  const { t } = useI18n();

  const citizenSlides: OnboardingSlide[] = [
    {
      id: 'citizen-1',
      badge: 'STEP 1 OF 3',
      title: t('citizenOnboarding', 'step1Title'),
      description: t('citizenOnboarding', 'step1Desc'),
      image: require('../../../../apps/cscrs-mobile/assets/onboarding/citizen/report-civic-issues.webp'),
    },
    {
      id: 'citizen-2',
      badge: 'STEP 2 OF 3',
      title: t('citizenOnboarding', 'step2Title'),
      description: t('citizenOnboarding', 'step2Desc'),
      image: require('../../../../apps/cscrs-mobile/assets/onboarding/citizen/capture-photo-evidence.webp'),
    },
    {
      id: 'citizen-3',
      badge: 'STEP 3 OF 3',
      title: t('citizenOnboarding', 'step3Title'),
      description: t('citizenOnboarding', 'step3Desc'),
      image: require('../../../../apps/cscrs-mobile/assets/onboarding/citizen/track-live-milestones.webp'),
    },
  ];

  const handleComplete = async () => {
    await setOnboardingCompleted(true);
    // Replace stack so back navigation doesn't return to onboarding
    navigation.replace('AuthBoundary');
  };

  const handleBackToRole = () => {
    navigation.navigate('RoleSelection');
  };

  return (
    <OnboardingCarousel
      slides={citizenSlides}
      onComplete={handleComplete}
      onBackToRole={handleBackToRole}
      roleTitle={t('role', 'citizenTitle')}
    />
  );
};
