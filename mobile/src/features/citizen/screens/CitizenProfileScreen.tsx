import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, CscrsIcon, ThemeToggle } from '@cscrs/design-system';
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  ProfileData,
} from '@cscrs/api';
import { resolveApiUrl } from '@cscrs/config';
import { clearStoredRole } from '@cscrs/storage';
import { RootStackParamList } from '../../../app/navigation/types';
import { useAuthSession } from '../../../core/auth';
import { useI18n } from '../../../core/i18n';

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList>;

export const CitizenProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { t, language, setLanguage } = useI18n();
  const { user, logout } = useAuthSession();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Profile Photo Uploading state
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getMyProfile();
        setProfile(data);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ?? t('citizenProfile', 'error')
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchProfile(false);
  }, [fetchProfile]);

  const handleStartEdit = () => {
    setEditName(profile?.name || user?.name || '');
    setEditPhone(profile?.phone || '');
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedPhone = editPhone.trim();

    // Validation
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setSaveError(t('citizenProfile', 'nameError'));
      return;
    }

    if (trimmedPhone.length > 0 && (trimmedPhone.length < 10 || trimmedPhone.length > 15)) {
      setSaveError(t('citizenProfile', 'phoneError'));
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateMyProfile({
        name: trimmedName,
        phone: trimmedPhone.length > 0 ? trimmedPhone : undefined,
      });

      setProfile((prev) =>
        prev
          ? { ...prev, name: trimmedName, phone: trimmedPhone || prev.phone }
          : null
      );
      setSaveSuccess(t('citizenProfile', 'updateSuccess'));
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(
        err?.response?.data?.detail ?? t('citizenProfile', 'updateError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoActions = () => {
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      {
        text: t('profileAvatar', 'chooseFromGallery'),
        onPress: handlePickPhoto,
      },
    ];

    if (profile?.profile_image) {
      buttons.push({
        text: t('profileAvatar', 'removePhoto'),
        style: 'destructive',
        onPress: handleRemovePhoto,
      });
    }

    buttons.push({
      text: t('profileAvatar', 'cancel'),
      style: 'cancel',
    });

    Alert.alert(t('profileAvatar', 'changePhoto'), undefined, buttons);
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('profileAvatar', 'changePhoto'),
          'Permission to access photo library was denied.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setIsPhotoLoading(true);
        setSaveError(null);
        setSaveSuccess(null);

        try {
          const res = await uploadProfilePhoto(asset.uri, asset.mimeType ?? 'image/jpeg');
          setProfile((prev) => (prev ? { ...prev, profile_image: res.profile_image } : null));
          await fetchProfile(false);
          setSaveSuccess(t('profileAvatar', 'uploadSuccess'));
        } catch (err: any) {
          setSaveError(err?.response?.data?.detail ?? 'Failed to update photo');
        } finally {
          setIsPhotoLoading(false);
        }
      }
    } catch {
      setIsPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await deleteProfilePhoto();
      setProfile((prev) => (prev ? { ...prev, profile_image: null } : null));
      await fetchProfile(false);
      setSaveSuccess(t('profileAvatar', 'removeSuccess'));
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail ?? 'Failed to remove photo');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('citizenProfile', 'signOut'),
      t('citizenProfile', 'confirmSignOut'),
      [
        { text: t('citizenProfile', 'cancel'), style: 'cancel' },
        {
          text: t('citizenProfile', 'signOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            await clearStoredRole();
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection' }],
            });
          },
        },
      ]
    );
  };

  const displayName = profile?.name || user?.name || 'Citizen User';
  const displayEmail = profile?.email || user?.email || 'citizen@cscrs.in';
  const displayPhone = profile?.phone || null;
  const displayRole = profile?.role || user?.role || 'Citizen';

  const getFullProfileImageUrl = (img: string | null | undefined) => {
    if (!img) return null;
    let url = img;
    const baseHost = resolveApiUrl().replace(/\/api\/v1\/?$/, '');
    if (url.startsWith('http://localhost:8000') || url.startsWith('http://127.0.0.1:8000')) {
      url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, baseHost);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `${baseHost.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    }
    return url;
  };

  const photoUri = getFullProfileImageUrl(profile?.profile_image);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            paddingBottom: spacing[3],
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('citizenProfile', 'title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('citizenProfile', 'subtitle')}
        </Text>
      </View>

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.mutedForeground, marginTop: spacing[3] },
            ]}
          >
            {t('citizenProfile', 'loading')}
          </Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && !profile && (
        <View style={[styles.errorBox, { paddingHorizontal: spacing[5] }]}>
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.destructive + '15',
                borderColor: colors.destructive + '40',
                borderRadius: radii.lg,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: colors.destructive }]}>
              {t('citizenProfile', 'error')}
            </Text>
            <Text style={[styles.errorDetail, { color: colors.foreground }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryBtn,
                { backgroundColor: colors.destructive, borderRadius: radii.md },
              ]}
              onPress={() => fetchProfile(false)}
            >
              <Text
                style={[
                  styles.retryBtnText,
                  { color: colors.destructiveForeground },
                ]}
              >
                {t('citizenProfile', 'retry')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Profile Content */}
      {(!loading || refreshing || profile) && (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[8],
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProfile(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Success Banner */}
          {saveSuccess && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.success + '15',
                  borderColor: colors.success + '40',
                  borderRadius: radii.md,
                  marginTop: spacing[3],
                },
              ]}
            >
              <CscrsIcon name="check-circle" size={18} color={colors.success} />
              <Text style={[styles.bannerText, { color: colors.success }]}>
                {saveSuccess}
              </Text>
            </View>
          )}

          {/* Error Banner */}
          {saveError && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.destructive + '15',
                  borderColor: colors.destructive + '40',
                  borderRadius: radii.md,
                  marginTop: spacing[3],
                },
              ]}
            >
              <CscrsIcon name="alert-circle" size={18} color={colors.destructive} />
              <Text style={[styles.bannerText, { color: colors.destructive }]}>
                {saveError}
              </Text>
            </View>
          )}

          {/* User Overview Card with Avatar */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
                marginTop: spacing[3],
                alignItems: 'center',
              },
            ]}
          >
            <View style={styles.avatarWrapper}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primary + '18' },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Photo Action Overlay Button */}
              <TouchableOpacity
                style={[
                  styles.cameraOverlayBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handlePhotoActions}
                disabled={isPhotoLoading}
                accessibilityLabel={t('profileAvatar', 'changePhoto')}
              >
                {isPhotoLoading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <CscrsIcon name="camera" size={14} color={colors.primaryForeground} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.name, { color: colors.foreground }]}>
              {displayName}
            </Text>
            <Text style={[styles.email, { color: colors.mutedForeground }]}>
              {displayEmail}
            </Text>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {displayRole.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Personal Information Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
                marginTop: spacing[4],
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text
                style={[styles.cardSectionTitle, { color: colors.foreground }]}>
                {t('citizenProfile', 'personalInfo')}
              </Text>
              {!isEditing && (
                <TouchableOpacity
                  style={[
                    styles.editIconBtn,
                    { borderColor: colors.primary },
                  ]}
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                >
                  <CscrsIcon name="edit-2" size={13} color={colors.primary} />
                  <Text
                    style={[styles.editIconBtnText, { color: colors.primary }]}>
                    {t('citizenProfile', 'editProfile')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              /* Inline Edit Mode */
              <View style={styles.editForm}>
                <View style={styles.fieldGroup}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    {t('citizenProfile', 'name')} *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                        color: colors.foreground,
                        borderRadius: radii.md,
                      },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter full name"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    {t('citizenProfile', 'phone')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                        color: colors.foreground,
                        borderRadius: radii.md,
                      },
                    ]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.editBtnRow}>
                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      { borderColor: colors.border, borderRadius: radii.md },
                    ]}
                    onPress={handleCancelEdit}
                    disabled={saving}
                  >
                    <Text
                      style={[styles.cancelBtnText, { color: colors.foreground }]}>
                      {t('citizenProfile', 'cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: radii.md,
                      },
                    ]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primaryForeground}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.saveBtnText,
                          { color: colors.primaryForeground },
                        ]}>
                        {t('citizenProfile', 'saveChanges')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Display View Mode */
              <View style={styles.infoFields}>
                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {t('citizenProfile', 'name')}
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.foreground }]}>
                    {displayName}
                  </Text>
                </View>

                <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {t('citizenProfile', 'email')}
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.foreground }]}>
                    {displayEmail}
                  </Text>
                </View>

                <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {t('citizenProfile', 'phone')}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: displayPhone
                          ? colors.foreground
                          : colors.mutedForeground,
                      },
                    ]}>
                    {displayPhone || t('citizenProfile', 'notProvided')}
                  </Text>
                </View>

                <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {t('citizenProfile', 'role')}
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.foreground }]}>
                    {displayRole}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Security & Account Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
                marginTop: spacing[4],
              },
            ]}
          >
            <Text style={[styles.cardSectionTitle, { color: colors.foreground }]}>
              {t('citizenProfile', 'accountSection')}
            </Text>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconRow}>
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: colors.primary + '15' },
                  ]}
                >
                  <CscrsIcon name="lock" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                    {t('changePassword', 'title')}
                  </Text>
                  <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>
                    {t('changePassword', 'subtitle')}
                  </Text>
                </View>
              </View>
              <CscrsIcon name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Municipal Feedback & Support Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
                marginTop: spacing[4],
              },
            ]}
          >
            <Text style={[styles.cardSectionTitle, { color: colors.foreground }]}>
              {t('citizenProfile', 'supportSection')}
            </Text>

            {/* Give Feedback */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('CitizenFeedback')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconRow}>
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: '#F59E0B18' },
                  ]}
                >
                  <CscrsIcon name="star" size={16} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                    {t('feedback', 'title')}
                  </Text>
                  <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>
                    {t('feedback', 'subtitle')}
                  </Text>
                </View>
              </View>
              <CscrsIcon name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

            {/* Report Platform Issue */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('PlatformIssueReport')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconRow}>
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: colors.destructive + '15' },
                  ]}
                >
                  <CscrsIcon name="alert-circle" size={16} color={colors.destructive} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                    {t('platformIssue', 'title')}
                  </Text>
                  <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>
                    {t('platformIssue', 'subtitle')}
                  </Text>
                </View>
              </View>
              <CscrsIcon name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Preferences Card (Theme & Language) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.xl,
                marginTop: spacing[4],
              },
            ]}
          >
            <Text
              style={[styles.cardSectionTitle, { color: colors.foreground }]}
            >
              {t('citizenProfile', 'preferences')}
            </Text>

            {/* Theme Toggle */}
            <View style={styles.preferenceRow}>
              <View style={styles.prefLabelCol}>
                <Text
                  style={[styles.prefTitle, { color: colors.foreground }]}
                >
                  {t('citizenProfile', 'theme')}
                </Text>
                <Text
                  style={[styles.prefDesc, { color: colors.mutedForeground }]}
                >
                  {theme.isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <ThemeToggle />
            </View>

            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

            {/* Language Switcher */}
            <View style={styles.preferenceRow}>
              <View style={styles.prefLabelCol}>
                <Text
                  style={[styles.prefTitle, { color: colors.foreground }]}
                >
                  {t('citizenProfile', 'language')}
                </Text>
                <Text
                  style={[styles.prefDesc, { color: colors.mutedForeground }]}
                >
                  {language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.prefActionBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                  },
                ]}
                onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.prefActionBtnText, { color: colors.foreground }]}
                >
                  {language === 'en' ? 'हिन्दी' : 'English'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                borderColor: colors.destructive,
                borderRadius: radii.lg,
                marginTop: spacing[6],
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityLabel={t('citizenProfile', 'signOut')}
          >
            <CscrsIcon name="log-out" size={16} color={colors.destructive} />
            <Text
              style={[styles.logoutBtnText, { color: colors.destructive }]}
            >
              {t('citizenProfile', 'signOut')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 32,
  },
  errorCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorDetail: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  card: {
    padding: 18,
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  cameraOverlayBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  editIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  editIconBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoFields: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldDivider: {
    height: 1,
  },
  editForm: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  editBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  prefLabelCol: {
    gap: 2,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  prefDesc: {
    fontSize: 12,
  },
  prefActionBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  prefActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 14,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
