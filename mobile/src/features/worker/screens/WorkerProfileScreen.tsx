import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, CscrsIcon, ThemeToggle } from '@cscrs/design-system';
import {
  getWorkerProfile,
  updateWorkerProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  WorkerProfileData,
} from '@cscrs/api';
import * as Location from 'expo-location';
import { resolveApiUrl } from '@cscrs/config';
import { clearStoredRole } from '@cscrs/storage';
import { useAuthSession } from '../../../core/auth';
import { useI18n } from '../../../core/i18n';
import { RootStackParamList } from '../../../app/navigation/types';

export const WorkerProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { colors, spacing, radii } = theme;
  const { language, setLanguage, t } = useI18n();
  const { user, logout } = useAuthSession();

  const [profile, setProfile] = useState<WorkerProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Live Location State
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocLoading, setIsLocLoading] = useState<boolean>(false);

  const fetchWorkerLocation = useCallback(async () => {
    try {
      setIsLocLoading(true);
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      }
    } catch {
      // Ignore location error
    } finally {
      setIsLocLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkerLocation();
  }, [fetchWorkerLocation]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkerProfile();
      setProfile(data);
    } catch {
      // Tolerate error, use fallback user
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
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
    setEditName('');
    setEditPhone('');
    setSaveError(null);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedPhone = editPhone.trim();

    // Client-side validation mirroring backend constraints
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setSaveError(t('workerProfile', 'nameError'));
      return;
    }

    if (trimmedPhone.length > 0 && (trimmedPhone.length < 10 || trimmedPhone.length > 15)) {
      setSaveError(t('workerProfile', 'phoneError'));
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateWorkerProfile({
        name: trimmedName,
        phone: trimmedPhone.length > 0 ? trimmedPhone : undefined,
      });

      // Refresh authoritative profile from backend
      const freshData = await getWorkerProfile();
      setProfile(freshData);

      setSaveSuccess(t('workerProfile', 'updateSuccess'));
      setIsEditing(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSaveError(t('workerProfile', 'phoneConflictError'));
      } else {
        setSaveError(
          err?.response?.data?.detail ?? t('workerProfile', 'updateError')
        );
      }
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
          await fetchProfile();
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
      await fetchProfile();
      setSaveSuccess(t('profileAvatar', 'removeSuccess'));
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail ?? 'Failed to remove photo');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleSignOut = () => {
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

  const isAvailable = profile?.is_available !== false;
  const displayName = profile?.name || user?.name || 'Municipal Worker';
  const displayEmail = profile?.email || user?.email || 'worker@cscrs.gov.in';
  const displayPhone = profile?.phone || null;

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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing[5],
            paddingTop: spacing[4],
            paddingBottom: spacing[8] + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('workerProfile', 'title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('workerProfile', 'subtitle')}
          </Text>
        </View>

        {/* Feedback Banners */}
        {saveSuccess && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: colors.success + '20',
                borderColor: colors.success,
                borderRadius: radii.lg,
              },
            ]}
          >
            <CscrsIcon name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.feedbackText, { color: colors.success }]}>
              {saveSuccess}
            </Text>
            <TouchableOpacity onPress={() => setSaveSuccess(null)}>
              <CscrsIcon name="x" size={14} color={colors.success} />
            </TouchableOpacity>
          </View>
        )}

        {saveError && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: colors.destructive + '15',
                borderColor: colors.destructive,
                borderRadius: radii.lg,
              },
            ]}
          >
            <CscrsIcon name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.feedbackText, { color: colors.destructive }]}>
              {saveError}
            </Text>
            <TouchableOpacity onPress={() => setSaveError(null)}>
              <CscrsIcon name="x" size={14} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEditing ? (
          /* =================================================== */
          /* INLINE EDIT MODE                                    */
          /* =================================================== */
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('workerProfile', 'editProfile')}
            </Text>

            {/* Editable Name Field */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {t('workerProfile', 'nameLabel')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: radii.md,
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('workerProfile', 'namePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                autoCorrect={false}
              />
            </View>

            {/* Editable Phone Field */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {t('workerProfile', 'phoneLabel')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: radii.md,
                  },
                ]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder={t('workerProfile', 'phonePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>

            {/* Read-Only Official Details in Edit Mode */}
            <View
              style={[
                styles.readOnlyBlock,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text style={[styles.readOnlyHeading, { color: colors.mutedForeground }]}>
                {t('workerProfile', 'readOnlyHeading')}
              </Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                  {t('workerProfile', 'emailLabel')}
                </Text>
                <Text style={[styles.fieldVal, { color: colors.mutedForeground }]}>
                  {displayEmail}
                </Text>
              </View>

              {profile?.employee_code ? (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                    {t('workerProfile', 'employeeCodeLabel')}
                  </Text>
                  <Text style={[styles.fieldVal, { color: colors.mutedForeground }]}>
                    {profile.employee_code}
                  </Text>
                </View>
              ) : null}

              {profile?.department_name ? (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                    {t('workerProfile', 'departmentLabel')}
                  </Text>
                  <Text style={[styles.fieldVal, { color: colors.mutedForeground }]}>
                    {profile.department_name}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Form Actions */}
            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                  {t('workerProfile', 'cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                    {t('workerProfile', 'saveChanges')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* =================================================== */
          /* VIEW MODE CARDS                                     */
          /* =================================================== */
          <>
            {/* Identity Card */}
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
              <View style={styles.identityRow}>
                <View style={styles.avatarWrapper}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: colors.primary, borderRadius: radii.full },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

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
                      <CscrsIcon name="camera" size={12} color={colors.primaryForeground} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.identityInfo}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>
                    {displayName}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                    {displayEmail}
                  </Text>

                  {displayPhone ? (
                    <View style={styles.phoneRow}>
                      <CscrsIcon name="phone" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
                        {displayPhone}
                      </Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: colors.primary + '20', borderRadius: radii.sm },
                    ]}
                  >
                    <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                      MUNICIPAL WORKER
                    </Text>
                  </View>
                </View>
              </View>

              {/* Edit Profile Action Button */}
              <TouchableOpacity
                style={[
                  styles.editActionBtn,
                  {
                    borderColor: colors.primary,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleStartEdit}
                activeOpacity={0.8}
              >
                <CscrsIcon name="edit-2" size={14} color={colors.primary} />
                <Text style={[styles.editActionText, { color: colors.primary }]}>
                  {t('workerProfile', 'editProfile')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Departmental Details Card */}
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
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('workerProfile', 'departmentInfoHeading')}
              </Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                  {t('workerProfile', 'departmentLabel')}
                </Text>
                <Text style={[styles.fieldVal, { color: colors.foreground }]}>
                  {profile?.department_name ||
                    (profile?.department_id != null
                      ? `Department #${profile.department_id}`
                      : t('workerProfile', 'departmentNotAssigned'))}
                </Text>
              </View>

              {profile?.department_id != null && profile?.department_name ? (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                    {t('workerProfile', 'departmentIdLabel')}
                  </Text>
                  <Text style={[styles.fieldVal, { color: colors.foreground }]}>
                    #{profile.department_id}
                  </Text>
                </View>
              ) : null}

              {profile?.employee_code ? (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                    {t('workerProfile', 'employeeCodeLabel')}
                  </Text>
                  <Text style={[styles.fieldVal, { color: colors.foreground }]}>
                    {profile.employee_code}
                  </Text>
                </View>
              ) : null}

              {profile?.designation ? (
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                    {t('workerProfile', 'designationLabel')}
                  </Text>
                  <Text style={[styles.fieldVal, { color: colors.foreground }]}>
                    {profile.designation}
                  </Text>
                </View>
              ) : null}

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                  {t('workerProfile', 'dispatchStatusLabel')}
                </Text>
                <View
                  style={[
                    styles.availBadge,
                    {
                      backgroundColor: isAvailable
                        ? colors.success + '20'
                        : colors.warning + '20',
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.availText,
                      { color: isAvailable ? colors.success : colors.warning },
                    ]}
                  >
                    {isAvailable
                      ? t('workerProfile', 'available')
                      : t('workerProfile', 'onAssignment')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Live Coordinates Card */}
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CscrsIcon name="map-pin" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                    {t('workerProfile', 'currentLocationHeading')}
                  </Text>
                </View>
                <TouchableOpacity onPress={fetchWorkerLocation} disabled={isLocLoading}>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                    {isLocLoading ? t('common', 'loading') : '↻ GPS'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldKey, { color: colors.mutedForeground }]}>
                  {t('workerProfile', 'currentCoordinates')}
                </Text>
                <Text style={[styles.fieldVal, { color: colors.foreground }]}>
                  {currentLocation
                    ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                    : isLocLoading
                    ? t('common', 'loading')
                    : 'GPS location not acquired'}
                </Text>
              </View>
            </View>

            {/* Security Card (Change Password) */}
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
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
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
          </>
        )}

        {/* App Preferences */}
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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('citizenProfile', 'preferences')}
          </Text>

          {/* Theme Toggle */}
          <View style={styles.prefRow}>
            <View>
              <Text style={[styles.prefKey, { color: colors.foreground }]}>
                {t('citizenProfile', 'theme')}
              </Text>
              <Text style={[styles.prefDesc, { color: colors.mutedForeground }]}>
                {theme.isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <ThemeToggle />
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          {/* Language Toggle */}
          <View style={styles.prefRow}>
            <Text style={[styles.prefKey, { color: colors.foreground }]}>
              {t('citizenProfile', 'language')}
            </Text>
            <TouchableOpacity
              style={[
                styles.prefBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                },
              ]}
              onPress={() => {
                setLanguage(language === 'en' ? 'hi' : 'en');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.prefBtnText, { color: colors.foreground }]}>
                {language === 'en' ? 'English (EN)' : 'हिन्दी (HI)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
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
          <CscrsIcon name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.signOutBtnText, { color: colors.destructive }]}>
            {t('citizenProfile', 'signOut')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  cameraOverlayBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  identityInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 13,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    gap: 8,
  },
  editActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldBlock: {
    gap: 6,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  readOnlyBlock: {
    padding: 12,
    gap: 8,
    marginVertical: 12,
  },
  readOnlyHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldKey: {
    fontSize: 13,
  },
  fieldVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  availText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  prefKey: {
    fontSize: 14,
    fontWeight: '600',
  },
  prefDesc: {
    fontSize: 12,
  },
  prefBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  prefBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldDivider: {
    height: 1,
    marginVertical: 8,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 14,
    gap: 8,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
