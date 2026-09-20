import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, CscrsIcon } from '@cscrs/design-system';
import { WorkerTabParamList } from '../../../app/navigation/types';
import { useI18n } from '../../../core/i18n';
import { WorkerHomeScreen } from '../screens/WorkerHomeScreen';
import { WorkerTasksScreen } from '../screens/WorkerTasksScreen';
import { WorkerNotificationsPlaceholderScreen } from '../screens/WorkerNotificationsPlaceholderScreen';
import { WorkerProfileScreen } from '../screens/WorkerProfileScreen';
import { getWorkerUnreadNotificationCount } from '@cscrs/api';

const Tab = createBottomTabNavigator<WorkerTabParamList>();

export const WorkerNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useI18n();

  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const fetchUnread = React.useCallback(async () => {
    try {
      const count = await getWorkerUnreadNotificationCount();
      setUnreadCount(count || 0);
    } catch {
      // Tolerate failure
    }
  }, []);

  React.useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  return (
    <Tab.Navigator
      initialRouteName="WorkerHomeTab"
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
        name="WorkerHomeTab"
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: t('workerTabs', 'home'),
          tabBarIcon: ({ color }) => (
            <CscrsIcon name="home" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('workerTabs', 'home'),
        }}
      />
      <Tab.Screen
        name="WorkerTasksTab"
        component={WorkerTasksScreen}
        options={{
          tabBarLabel: t('workerTabs', 'tasks'),
          tabBarIcon: ({ color }) => (
            <CscrsIcon name="check-square" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('workerTabs', 'tasks'),
        }}
      />
      <Tab.Screen
        name="WorkerNotificationsTab"
        component={WorkerNotificationsPlaceholderScreen}
        listeners={{
          focus: () => {
            fetchUnread();
          },
        }}
        options={{
          tabBarLabel: t('workerTabs', 'notifications'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.primaryForeground,
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color }) => (
            <CscrsIcon name="bell" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('workerTabs', 'notifications'),
        }}
      />
      <Tab.Screen
        name="WorkerProfileTab"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: t('workerTabs', 'profile'),
          tabBarIcon: ({ color }) => (
            <CscrsIcon name="user" size={20} color={color} />
          ),
          tabBarAccessibilityLabel: t('workerTabs', 'profile'),
        }}
      />
    </Tab.Navigator>
  );
};
