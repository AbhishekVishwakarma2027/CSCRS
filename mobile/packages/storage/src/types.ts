import { AppLanguage, MobilePersona } from '@cscrs/models';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface OnboardingPreferences {
  language: AppLanguage | null;
  role: MobilePersona | null;
  isCompleted: boolean;
}

export const STORAGE_KEYS = {
  LANGUAGE: 'cscrs_language_pref',
  ROLE: 'cscrs_role_pref',
  ONBOARDING_COMPLETED: 'cscrs_onboarding_completed',
  THEME: 'cscrs_theme_pref',
} as const;
