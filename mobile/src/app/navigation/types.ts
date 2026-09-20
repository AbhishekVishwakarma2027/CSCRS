import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { WorkerAssignmentResponse } from '@cscrs/api';

export type CitizenTabParamList = {
  CitizenHomeTab: undefined;
  CitizenMyReportsTab: undefined;
  CitizenNotificationsTab: undefined;
  CitizenProfileTab: undefined;
};

export type WorkerTabParamList = {
  WorkerHomeTab: undefined;
  WorkerTasksTab: undefined;
  WorkerNotificationsTab: undefined;
  WorkerProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  RoleSelection: undefined;
  CitizenOnboarding: undefined;
  WorkerOnboarding: undefined;
  AuthBoundary: undefined;
  CitizenHomePlaceholder: undefined;
  CitizenWorkspace: undefined;
  CitizenReportCreate: undefined;
  CitizenReportDetails: { reportNumber?: string; reportId?: number };
  WorkerHomePlaceholder: undefined;
  WorkerWorkspace: undefined;
  WorkerTaskDetails: { assignment: WorkerAssignmentResponse };
  WorkerResolutionSubmit: { assignment: WorkerAssignmentResponse };
  WorkerForwardRequest: { assignment: WorkerAssignmentResponse };
  UnsupportedRoleBoundary: undefined;
  FoundationVerification: undefined;
  CitizenRegister: undefined;
  CitizenVerifyEmail: undefined;
  CitizenLogin: undefined;
  WorkerLogin: undefined;
  ForgotPassword: undefined;
  ChangePassword: undefined;
  CitizenFeedback: undefined;
  PlatformIssueReport: undefined;
  PlatformIssueList: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type CitizenTabScreenProps<T extends keyof CitizenTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<CitizenTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type WorkerTabScreenProps<T extends keyof WorkerTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<WorkerTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
