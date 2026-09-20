import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { useAuthSession } from '../../core/auth';
import { RootStackParamList } from '../../app/navigation/types';

type WorkerNavProp = NativeStackNavigationProp<RootStackParamList, 'WorkerHomePlaceholder'>;

export const WorkerHomePlaceholder: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WorkerNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { user, roleMismatchNotice, logout } = useAuthSession();

  // If authenticated as Worker, automatically transition to the full WorkerWorkspace
  React.useEffect(() => {
    if (user?.role === 'Worker') {
      navigation.replace('WorkerWorkspace');
    }
  }, [user, navigation]);

  const handleLogout = async () => {
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
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              AUTHENTICATED WORKER
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Worker Workspace
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Phase 4 Dashboard Placeholder. Authentication verified via GET /api/v1/auth/me.
          </Text>
        </View>

        {roleMismatchNotice && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: colors.warning + '15',
                borderColor: colors.warning,
                borderRadius: radii.lg,
              },
            ]}
          >
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              {roleMismatchNotice}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            Verified Worker Profile
          </Text>

          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>Name:</Text>
            <Text style={[styles.kvVal, { color: colors.foreground }]}>{user?.name ?? 'Field Worker'}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>Email:</Text>
            <Text style={[styles.kvVal, { color: colors.foreground }]}>{user?.email ?? 'worker@example.com'}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>Official Role:</Text>
            <Text style={[styles.kvVal, { color: colors.primary }]}>{user?.role ?? 'Worker'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.lg,
            },
          ]}
          onPress={() => navigation.replace('WorkerWorkspace')}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueBtnText, { color: colors.primaryForeground }]}>
            Go to Worker Dashboard →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              borderColor: colors.destructive,
              borderRadius: radii.lg,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutBtnText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, gap: 16 },
  card: { padding: 22, borderWidth: 1, gap: 10 },
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
  noticeCard: { padding: 14, borderWidth: 1 },
  noticeText: { fontSize: 13, fontWeight: '500' },
  infoCard: { padding: 18, borderWidth: 1, gap: 12 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kvKey: { fontSize: 13 },
  kvVal: { fontSize: 13, fontWeight: '600' },
  continueBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  continueBtnText: { fontSize: 15, fontWeight: '700' },
  logoutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  logoutBtnText: { fontSize: 14, fontWeight: '700' },
});
