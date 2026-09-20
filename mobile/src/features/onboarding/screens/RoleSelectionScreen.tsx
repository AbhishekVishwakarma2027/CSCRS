import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@cscrs/design-system';
import { MobilePersona } from '@cscrs/models';
import { setStoredRole } from '@cscrs/storage';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

type RoleNavProp = NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;

export const RoleSelectionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RoleNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<MobilePersona | null>(null);

  const handleSelectRole = (role: MobilePersona) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    await setStoredRole(selectedRole);

    if (selectedRole === 'Citizen') {
      navigation.navigate('CitizenOnboarding');
    } else {
      navigation.navigate('WorkerOnboarding');
    }
  };

  const handleBack = () => {
    navigation.navigate('LanguageSelection');
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
          styles.scrollContent,
          { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('role', 'title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('role', 'subtitle')}
          </Text>
        </View>

        {/* Roles List */}
        <View style={[styles.cardsContainer, { gap: spacing[4] }]}>
          {/* Citizen Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor:
                  selectedRole === 'Citizen' ? colors.card : colors.secondary,
                borderColor:
                  selectedRole === 'Citizen' ? colors.primary : colors.border,
                borderRadius: radii.xl,
              },
            ]}
            onPress={() => handleSelectRole('Citizen')}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedRole === 'Citizen' }}
            accessibilityLabel="Citizen role option"
          >
            <View style={styles.roleCardHeader}>
              <View style={styles.badgeAndTitle}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        selectedRole === 'Citizen'
                          ? colors.primary
                          : colors.border,
                      borderRadius: radii.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      {
                        color:
                          selectedRole === 'Citizen'
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    C
                  </Text>
                </View>

                <View>
                  <Text style={[styles.roleTitle, { color: colors.foreground }]}>
                    {t('role', 'citizenTitle')}
                  </Text>
                  <Text
                    style={[styles.roleDesc, { color: colors.mutedForeground }]}
                  >
                    {t('role', 'citizenDescription')}
                  </Text>
                </View>
              </View>

              {/* Radio Indicator */}
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      selectedRole === 'Citizen'
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}
              >
                {selectedRole === 'Citizen' && (
                  <View
                    style={[
                      styles.radioDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
            </View>

            {/* Feature Points */}
            <View style={[styles.featureList, { borderTopColor: colors.border }]}>
              <Text style={[styles.featurePoint, { color: colors.foreground }]}>
                * {t('role', 'citizenPoint1')}
              </Text>
              <Text style={[styles.featurePoint, { color: colors.foreground }]}>
                * {t('role', 'citizenPoint2')}
              </Text>
              <Text style={[styles.featurePoint, { color: colors.foreground }]}>
                * {t('role', 'citizenPoint3')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Worker Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor:
                  selectedRole === 'Worker' ? colors.card : colors.secondary,
                borderColor:
                  selectedRole === 'Worker' ? colors.primary : colors.border,
                borderRadius: radii.xl,
              },
            ]}
            onPress={() => handleSelectRole('Worker')}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedRole === 'Worker' }}
            accessibilityLabel="Municipal worker role option"
          >
            <View style={styles.roleCardHeader}>
              <View style={styles.badgeAndTitle}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        selectedRole === 'Worker'
                          ? colors.primary
                          : colors.border,
                      borderRadius: radii.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      {
                        color:
                          selectedRole === 'Worker'
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    W
                  </Text>
                </View>

                <View>
                  <Text style={[styles.roleTitle, { color: colors.foreground }]}>
                    {t('role', 'workerTitle')}
                  </Text>
                  <Text
                    style={[styles.roleDesc, { color: colors.mutedForeground }]}
                  >
                    {t('role', 'workerDescription')}
                  </Text>
                </View>
              </View>

              {/* Radio Indicator */}
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      selectedRole === 'Worker'
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}
              >
                {selectedRole === 'Worker' && (
                  <View
                    style={[
                      styles.radioDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
            </View>

            {/* Feature Points */}
            <View style={[styles.featureList, { borderTopColor: colors.border }]}>
              <Text style={[styles.featurePoint, { color: colors.foreground }]}>
                * {t('role', 'workerPoint1')}
              </Text>
              <Text style={[styles.featurePoint, { color: colors.foreground }]}>
                * {t('role', 'workerPoint2')}
              </Text>
              <Text style={[styles.featurePoint, { color: colors.foreground }]}>
                * {t('role', 'workerPoint3')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Disclaimer Notice */}
        <View
          style={[
            styles.disclaimerBox,
            { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: radii.lg },
          ]}
        >
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            {t('role', 'disclaimer')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar Controls */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[4],
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, borderRadius: radii.lg }]}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to language selection"
        >
          <Text style={[styles.backButtonText, { color: colors.foreground }]}>
            {t('common', 'back')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedRole ? colors.primary : colors.muted,
              borderRadius: radii.lg,
            },
          ]}
          disabled={!selectedRole}
          onPress={handleContinue}
          activeOpacity={0.8}
          accessibilityLabel="Continue to role onboarding"
        >
          <Text
            style={[
              styles.continueButtonText,
              {
                color: selectedRole
                  ? colors.primaryForeground
                  : colors.mutedForeground,
              },
            ]}
          >
            {t('common', 'continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardsContainer: {
    width: '100%',
  },
  roleCard: {
    padding: 20,
    borderWidth: 2,
    gap: 16,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  roleBadge: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: 13,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  featureList: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 6,
  },
  featurePoint: {
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimerBox: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
