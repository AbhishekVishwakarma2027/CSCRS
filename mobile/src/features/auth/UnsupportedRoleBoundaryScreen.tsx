import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { useAuthSession } from '../../core/auth';
import { RootStackParamList } from '../../app/navigation/types';

type UnsupportedNavProp = NativeStackNavigationProp<RootStackParamList, 'UnsupportedRoleBoundary'>;

export const UnsupportedRoleBoundaryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<UnsupportedNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { user, unsupportedRole, logout } = useAuthSession();

  const handleSignOut = async () => {
    await logout();
    navigation.replace('AuthBoundary');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[6] },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.xl,
            },
          ]}
        >
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.destructive + '20' },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
            <Text style={[styles.badgeText, { color: colors.destructive }]}>
              ADMINISTRATIVE ROLE DETECTED
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Web Portal Required
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your verified backend role is &ldquo;{unsupportedRole ?? user?.role}&rdquo;. The CSCRS mobile application currently supports Citizen and Municipal Worker personas only.
          </Text>
        </View>

        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>
            Administrative Workflows
          </Text>
          <Text style={[styles.noticeDesc, { color: colors.mutedForeground }]}>
            Department Administration, City Administration, and System Oversight tools are available through the official CSCRS Web Administrative Portal at https://cscrs.tech.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.signOutBtn,
            {
              borderColor: colors.destructive,
              borderRadius: radii.lg,
            },
          ]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={[styles.signOutBtnText, { color: colors.destructive }]}>
            Sign Out to Switch Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, gap: 16 },
  card: { padding: 22, borderWidth: 1, gap: 12 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  noticeBox: { padding: 18, borderWidth: 1, gap: 8 },
  noticeTitle: { fontSize: 15, fontWeight: '700' },
  noticeDesc: { fontSize: 13, lineHeight: 18 },
  signOutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: 12,
  },
  signOutBtnText: { fontSize: 14, fontWeight: '700' },
});
