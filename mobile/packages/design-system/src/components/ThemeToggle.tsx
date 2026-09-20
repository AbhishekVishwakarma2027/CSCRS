import React from 'react';
import { View, Text, Switch, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { CscrsIcon } from './CscrsIcon';

export interface ThemeToggleProps {
  label?: string;
  lightLabel?: string;
  darkLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact, native-feeling Theme Switch control.
 * Displays current state (Light / Dark) with accessible hit target and smooth native toggle.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  label,
  lightLabel = 'Light',
  darkLabel = 'Dark',
  style,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.isDark;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.mainLabel,
            { color: theme.colors.foreground, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={styles.controlRow}>
        <CscrsIcon
          name="theme"
          size={16}
          color={isDark ? theme.colors.primary : theme.colors.mutedForeground}
          style={styles.icon}
        />
        <Text style={[styles.stateLabel, { color: theme.colors.foreground }]}>
          {isDark ? darkLabel : lightLabel}
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{
            false: theme.colors.input,
            true: theme.colors.accent,
          }}
          thumbColor={isDark ? theme.colors.primaryForeground : '#FFFFFF'}
          ios_backgroundColor={theme.colors.input}
          accessibilityLabel={`${label || 'Theme'} switch, currently ${isDark ? darkLabel : lightLabel}`}
          accessibilityRole="switch"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
});
