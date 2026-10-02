import { AppLanguage, MobilePersona } from '@cscrs/models';
import { defaultStorage } from './adapter';
import { STORAGE_KEYS, OnboardingPreferences } from './types';

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const val = await defaultStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (val === 'en' || val === 'hi') {
    return val;
  }
  return null;
}

export async function setStoredLanguage(lang: AppLanguage): Promise<void> {
  await defaultStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
}

export async function getStoredRole(): Promise<MobilePersona | null> {
  const val = await defaultStorage.getItem(STORAGE_KEYS.ROLE);
  if (val === 'Citizen' || val === 'Worker') {
    return val;
  }
  return null;
}

export async function setStoredRole(role: MobilePersona): Promise<void> {
  await defaultStorage.setItem(STORAGE_KEYS.ROLE, role);
}

export async function clearStoredRole(): Promise<void> {
  await defaultStorage.removeItem(STORAGE_KEYS.ROLE);
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const val = await defaultStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return val === 'true';
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  await defaultStorage.setItem(
    STORAGE_KEYS.ONBOARDING_COMPLETED,
    completed ? 'true' : 'false'
  );
}

export async function getOnboardingPreferences(): Promise<OnboardingPreferences> {
  const [language, role, completedStr] = await Promise.all([
    getStoredLanguage(),
    getStoredRole(),
    defaultStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
  ]);

  return {
    language,
    role,
    isCompleted: completedStr === 'true',
  };
}

export async function resetOnboardingPreferences(): Promise<void> {
  await Promise.all([
    defaultStorage.removeItem(STORAGE_KEYS.LANGUAGE),
    defaultStorage.removeItem(STORAGE_KEYS.ROLE),
    defaultStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
  ]);
}

export async function getStoredThemeMode(): Promise<'light' | 'dark' | 'system' | null> {
  const val = await defaultStorage.getItem(STORAGE_KEYS.THEME);
  if (val === 'light' || val === 'dark' || val === 'system') {
    return val;
  }
  return null;
}

export async function setStoredThemeMode(mode: 'light' | 'dark' | 'system'): Promise<void> {
  await defaultStorage.setItem(STORAGE_KEYS.THEME, mode);
}
