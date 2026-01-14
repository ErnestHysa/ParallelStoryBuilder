import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

const AVATAR_OPTIONS = [
  { id: 'default', url: null, emoji: '👤', label: 'Default Avatar' },
  { id: 'cat', url: 'https://example.com/avatar-cat.png', emoji: '🐱', label: 'Cat' },
  { id: 'dog', url: 'https://example.com/avatar-dog.png', emoji: '🐶', label: 'Dog' },
  { id: 'dragon', url: 'https://example.com/avatar-dragon.png', emoji: '🐉', label: 'Dragon' },
  { id: 'heart', url: 'https://example.com/avatar-heart.png', emoji: '❤️', label: 'Heart' },
  { id: 'star', url: 'https://example.com/avatar-star.png', emoji: '⭐', label: 'Star' },
];

export default function ProfileSettingsScreen() {
  const { profile, refreshProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setIsLoading(true);

    try {
      // Update profile using auth store
      if (profile) {
        await useAuthStore.getState().updateProfile({
          display_name: displayName.trim(),
          ...(avatarUrl && { avatar_url: avatarUrl }),
        });
      }

      Alert.alert(
        'Success',
        'Your profile has been updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectAvatar = (option: typeof AVATAR_OPTIONS[0]) => {
    setAvatarUrl(option.url || null);
  };

  const useCustomAvatar = () => {
    if (customAvatarUrl.trim()) {
      setAvatarUrl(customAvatarUrl.trim());
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#757575" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarPreview}>
            {avatarUrl ? (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarEmoji}>
                  {AVATAR_OPTIONS.find(a => a.url === avatarUrl)?.emoji || '👤'}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}
          </View>
          <Text style={styles.avatarHint}>
            Choose from preset avatars or use a custom URL
          </Text>

          {/* Preset Avatars */}
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.avatarOption,
                  avatarUrl === option.url && styles.selectedAvatar,
                ]}
                onPress={() => selectAvatar(option)}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarOptionEmoji}>{option.emoji}</Text>
                <Text style={styles.avatarOptionLabel}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Avatar URL */}
          <View style={styles.customAvatarSection}>
            <Text style={styles.customAvatarTitle}>Custom URL</Text>
            <Input
              placeholder="https://example.com/your-avatar.png"
              value={customAvatarUrl}
              onChangeText={setCustomAvatarUrl}
              style={styles.customAvatarInput}
            />
            <Button
              variant="ghost"
              onPress={useCustomAvatar}
              style={styles.customAvatarButton}
              disabled={!customAvatarUrl.trim()}
            >
              Use Custom Avatar
            </Button>
          </View>
        </View>

        {/* Display Name Section */}
        <View style={styles.nameSection}>
          <Text style={styles.sectionTitle}>Display Name</Text>
          <Input
            placeholder="Enter your display name"
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.nameInput}
          />
          <Text style={styles.nameHint}>
            This name will be visible to other users
          </Text>
        </View>

        {/* Email Section (Read-only) */}
        {profile && (
          <View style={styles.emailSection}>
            <Text style={styles.sectionTitle}>Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{profile.email}</Text>
              <Feather name="lock" size={16} color="#757575" />
            </View>
            <Text style={styles.emailHint}>
              Email cannot be changed
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.saveButton}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  avatarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarHint: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedAvatar: {
    backgroundColor: '#E91E63',
  },
  avatarOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  avatarOptionLabel: {
    fontSize: 12,
    color: '#757575',
  },
  selectedAvatarText: {
    color: '#FFFFFF',
  },
  customAvatarSection: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  customAvatarTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  customAvatarInput: {
    marginBottom: 12,
  },
  customAvatarButton: {
    alignSelf: 'flex-start',
  },
  nameSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  nameInput: {
    marginBottom: 12,
  },
  nameHint: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  emailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
  },
  emailHint: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  actions: {
    marginBottom: 24,
  },
  saveButton: {
    width: '100%',
  },
});