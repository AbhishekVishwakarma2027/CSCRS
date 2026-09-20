import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredLanguage, setStoredLanguage } from '@cscrs/storage';
import { Language, TranslationDictionary } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';

const translationMap: Record<Language, TranslationDictionary> = {
  en,
  hi,
};

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: <S extends keyof TranslationDictionary, K extends keyof TranslationDictionary[S]>(
    section: S,
    key: K
  ) => string;
  strings: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode; initialLanguage?: Language }> = ({
  children,
  initialLanguage = 'en',
}) => {
  const [language, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    // Load persisted language preference on mount
    getStoredLanguage().then((stored) => {
      if (stored) {
        setLangState(stored);
      }
    });
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    await setStoredLanguage(newLang);
  };

  const currentStrings = translationMap[language] || en;

  const t = <S extends keyof TranslationDictionary, K extends keyof TranslationDictionary[S]>(
    section: S,
    key: K
  ): string => {
    const sectionObj = currentStrings[section];
    if (sectionObj && key in sectionObj) {
      return (sectionObj as Record<string, string>)[key as string] || '';
    }
    // Fallback to English
    const fallbackSection = en[section];
    return (fallbackSection as Record<string, string>)?.[key as string] || '';
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, strings: currentStrings }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
