import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@cscrs/design-system';
import { I18nProvider } from '../core/i18n';
import { AuthProvider } from '../core/auth';
import { PendingVerificationProvider } from '../features/auth/context/PendingVerificationContext';
import { getStoredThemeMode, setStoredThemeMode } from '@cscrs/storage';
import { RootNavigator } from './navigation';

function AppContent() {
  const { theme } = useTheme();

  const navigationTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.foreground,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.foreground,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export function App() {
  const [initialTheme, setInitialTheme] = React.useState<'light' | 'dark' | 'system'>('light');

  React.useEffect(() => {
    getStoredThemeMode().then((saved) => {
      if (saved) {
        setInitialTheme(saved);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={initialTheme} onThemeChange={setStoredThemeMode}>
        <I18nProvider initialLanguage="en">
          <AuthProvider>
            <PendingVerificationProvider>
              <AppContent />
            </PendingVerificationProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
