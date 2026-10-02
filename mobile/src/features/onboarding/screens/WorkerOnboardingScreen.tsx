import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setOnboardingCompleted } from '@cscrs/storage';
import { useI18n } from '../../../core/i18n';
import { OnboardingCarousel, OnboardingSlide } from '../components/OnboardingCarousel';
import { RootStackParamList } from '../../../app/navigation/types';

type WorkerNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'WorkerOnboarding'
>;

export const WorkerOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<WorkerNavProp>();
  const { t } = useI18n();

  const workerSlides: OnboardingSlide[] = [
    {
      id: 'worker-1',
      badge: 'STEP 1 OF 3',
      title: t('workerOnboarding', 'step1Title'),
      description: t('workerOnboarding', 'step1Desc'),
      image: require('../../../../apps/cscrs-mobile/assets/onboarding/worker/view-assigned-queue.webp'),
    },
    {
      id: 'worker-2',
      badge: 'STEP 2 OF 3',
      title: t('workerOnboarding', 'step2Title'),
      description: t('workerOnboarding', 'step2Desc'),
      image: require('../../../../apps/cscrs-mobile/assets/onboarding/worker/start-work-on-site.webp'),
    },
    {
      id: 'worker-3',
      badge: 'STEP 3 OF 3',
      title: t('workerOnboarding', 'step3Title'),
      description: t('workerOnboarding', 'step3Desc'),
      image: require('../../../../apps/cscrs-mobile/assets/onboarding/worker/submit-resolution-proof.webp'),
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
      slides={workerSlides}
      onComplete={handleComplete}
      onBackToRole={handleBackToRole}
      roleTitle={t('role', 'workerTitle')}
    />
  );
};
