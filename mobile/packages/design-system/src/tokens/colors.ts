export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  border: string;
  input: string;
  ring: string;
  surface: string;
}

export const lightColors: ColorTokens = {
  background: '#F8FAFC',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',
  popover: '#FFFFFF',
  popoverForeground: '#0F172A',
  primary: '#0F2942',
  primaryForeground: '#FFFFFF',
  secondary: '#F1F5F9',
  secondaryForeground: '#0F2942',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  accent: '#0284C7',
  accentForeground: '#FFFFFF',
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  success: '#10B981',
  successForeground: '#FFFFFF',
  warning: '#D97706',
  warningForeground: '#FFFFFF',
  danger: '#DC2626',
  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#0284C7',
  surface: '#FFFFFF',
};

export const darkColors: ColorTokens = {
  background: '#0B132B',
  foreground: '#F8FAFC',
  card: '#16223F',
  cardForeground: '#F8FAFC',
  popover: '#16223F',
  popoverForeground: '#F8FAFC',
  primary: '#38BDF8',
  primaryForeground: '#0B132B',
  secondary: '#1C2D54',
  secondaryForeground: '#F8FAFC',
  muted: '#1C2D54',
  mutedForeground: '#94A3B8',
  accent: '#0EA5E9',
  accentForeground: '#FFFFFF',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#10B981',
  successForeground: '#0B132B',
  warning: '#F59E0B',
  warningForeground: '#0B132B',
  danger: '#EF4444',
  border: '#1E325C',
  input: '#263D6B',
  ring: '#38BDF8',
  surface: '#16223F',
};
