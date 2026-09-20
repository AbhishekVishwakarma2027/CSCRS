import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { shadows } from '../tokens/shadows';
import { Theme, ThemeMode, ThemeContextValue } from './types';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'light',
  onThemeChange,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode);

  // Sync state if initialMode prop changes from storage restoration
  React.useEffect(() => {
    if (initialMode && initialMode !== themeMode) {
      setThemeModeState(initialMode);
    }
  }, [initialMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    onThemeChange?.(mode);
  };

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const toggleTheme = () => {
    const nextMode: ThemeMode = resolvedMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const theme: Theme = useMemo(() => {
    const isDark = resolvedMode === 'dark';
    return {
      mode: resolvedMode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      radii,
      shadows,
    };
  }, [resolvedMode]);

  const contextValue = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
