import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import { CitizenTabParamList } from '../../../app/navigation/types';
import { useI18n } from '../../../core/i18n';
import { CitizenHomeScreen } from '../screens/CitizenHomeScreen';
import { CitizenMyReportsScreen } from '../screens/CitizenMyReportsScreen';
import { CitizenNotificationsScreen } from '../screens/CitizenNotificationsScreen';
import { CitizenProfileScreen } from '../screens/CitizenProfileScreen';

const Tab = createBottomTabNavigator<CitizenTabParamList>();

export const CitizenNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useI18n();

  return (
    <Tab.Navigator
      initialRouteName="CitizenHomeTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="CitizenHomeTab"
        component={CitizenHomeScreen}
        options={{
          tabBarLabel: t('citizenTabs', 'home'),
          tabBarIcon: ({ color, size }) => (
            <CscrsIcon name="home" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('citizenTabs', 'home'),
        }}
      />
      <Tab.Screen
        name="CitizenMyReportsTab"
        component={CitizenMyReportsScreen}
        options={{
          tabBarLabel: t('citizenTabs', 'myReports'),
          tabBarIcon: ({ color, size }) => (
            <CscrsIcon name="file-text" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('citizenTabs', 'myReports'),
        }}
      />
      <Tab.Screen
        name="CitizenNotificationsTab"
        component={CitizenNotificationsScreen}
        options={{
          tabBarLabel: t('citizenTabs', 'notifications'),
          tabBarIcon: ({ color, size }) => (
            <CscrsIcon name="bell" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('citizenTabs', 'notifications'),
        }}
      />
      <Tab.Screen
        name="CitizenProfileTab"
        component={CitizenProfileScreen}
        options={{
          tabBarLabel: t('citizenTabs', 'profile'),
          tabBarIcon: ({ color, size }) => (
            <CscrsIcon name="user" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('citizenTabs', 'profile'),
        }}
      />
    </Tab.Navigator>
  );
};
