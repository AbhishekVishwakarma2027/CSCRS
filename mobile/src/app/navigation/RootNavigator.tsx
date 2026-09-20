import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { RootStackParamList } from './types';
import {
  SplashScreen,
  LanguageSelectionScreen,
  RoleSelectionScreen,
  CitizenOnboardingScreen,
  WorkerOnboardingScreen,
  AuthBoundaryScreen,
} from '../../features/onboarding';
import {
  CitizenHomePlaceholder,
  WorkerHomePlaceholder,
  UnsupportedRoleBoundaryScreen,
  CitizenRegisterScreen,
  CitizenVerifyEmailScreen,
  CitizenLoginScreen,
  WorkerLoginScreen,
  ForgotPasswordScreen,
  ChangePasswordScreen,
} from '../../features/auth';
import {
  CitizenNavigator,
  CitizenReportCreateScreen,
  CitizenReportDetailsScreen,
  CitizenFeedbackScreen,
  PlatformIssueReportScreen,
  PlatformIssueListScreen,
} from '../../features/citizen';
import {
  WorkerNavigator,
  WorkerTaskDetailsScreen,
  WorkerResolutionSubmitScreen,
  WorkerForwardRequestScreen,
} from '../../features/worker';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.foreground,
        headerTitleStyle: {
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
      />
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
      />
      <Stack.Screen
        name="CitizenOnboarding"
        component={CitizenOnboardingScreen}
      />
      <Stack.Screen
        name="WorkerOnboarding"
        component={WorkerOnboardingScreen}
      />
      <Stack.Screen
        name="AuthBoundary"
        component={AuthBoundaryScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="CitizenHomePlaceholder"
        component={CitizenHomePlaceholder}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="CitizenWorkspace"
        component={CitizenNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="CitizenReportCreate"
        component={CitizenReportCreateScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="CitizenReportDetails"
        component={CitizenReportDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WorkerHomePlaceholder"
        component={WorkerHomePlaceholder}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="WorkerWorkspace"
        component={WorkerNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="WorkerTaskDetails"
        component={WorkerTaskDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WorkerResolutionSubmit"
        component={WorkerResolutionSubmitScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="WorkerForwardRequest"
        component={WorkerForwardRequestScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="UnsupportedRoleBoundary"
        component={UnsupportedRoleBoundaryScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="CitizenRegister"
        component={CitizenRegisterScreen}
      />
      <Stack.Screen
        name="CitizenVerifyEmail"
        component={CitizenVerifyEmailScreen}
      />
      <Stack.Screen
        name="CitizenLogin"
        component={CitizenLoginScreen}
      />
      <Stack.Screen
        name="WorkerLogin"
        component={WorkerLoginScreen}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CitizenFeedback"
        component={CitizenFeedbackScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="PlatformIssueReport"
        component={PlatformIssueReportScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PlatformIssueList"
        component={PlatformIssueListScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export default RootNavigator;
