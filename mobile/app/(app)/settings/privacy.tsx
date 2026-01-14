import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { SettingItem } from '@/components/SettingItem';

interface PrivacyPreferences {
  onlineStatus: boolean;
  storyVisibility: 'public' | 'private' | 'partners';
  analyticsCollection: boolean;
  crashReports: boolean;
  personalizedAds: boolean;
  dataCollection: boolean;
}

const defaultPreferences: PrivacyPreferences = {
  onlineStatus: true,
  storyVisibility: 'partners',
  analyticsCollection: false,
  crashReports: true,
  personalizedAds: false,
  dataCollection: false,
};

export default function PrivacySettingsScreen() {
  const { profile, isConfigured } = useAuthStore();
  const [preferences, setPreferences] = useState<PrivacyPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load preferences from storage
    const loadPreferences = async () => {
      try {
        // TODO: Implement preference loading from Supabase
        const saved = await getStoredPreferences();
        if (saved) {
          setPreferences({ ...defaultPreferences, ...saved });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, [isConfigured]);

  const getStoredPreferences = async (): Promise<Partial<PrivacyPreferences>> => {
    // This would typically read from secure storage
    return {};
  };

  const savePreferences = async (newPreferences: PrivacyPreferences) => {
    setIsLoading(true);

    try {
      // Save to local storage (using AsyncStorage would be better)
      // For demo, just show success
      Alert.alert(
        'Success',
        'Privacy settings saved successfully!'
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save privacy settings. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key: keyof PrivacyPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
  };

  const setStoryVisibility = (visibility: 'public' | 'private' | 'partners') => {
    const newPreferences = {
      ...preferences,
      storyVisibility: visibility,
    };
    setPreferences(newPreferences);
  };

  const handleSave = async () => {
    await savePreferences(preferences);
  };

  const restoreDefaults = () => {
    Alert.alert(
      'Restore Defaults',
      'Are you sure you want to restore default privacy settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () => setPreferences(defaultPreferences),
        },
      ]
    );
  };

  const downloadData = async () => {
    Alert.alert(
      'Download Your Data',
      'Coming soon! You\'ll be able to download all your story data.'
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Navigate to account deletion flow
            Alert.alert(
              'Account Deletion',
              'Account deletion will be implemented in a future update.'
            );
          },
        },
      ]
    );
  };

  const storyVisibilityOptions = [
    {
      value: 'public' as const,
      label: 'Public',
      description: 'Anyone can view your stories',
    },
    {
      value: 'partners' as const,
      label: 'Partners Only',
      description: 'Only your writing partners can view',
    },
    {
      value: 'private' as const,
      label: 'Private',
      description: 'Only you can view your stories',
    },
  ];

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
          <Text style={styles.title}>Privacy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Story Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Visibility</Text>

          <View style={styles.storyVisibilityContainer}>
            {storyVisibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.storyVisibilityOption,
                  preferences.storyVisibility === option.value && styles.selectedStoryVisibility,
                ]}
                onPress={() => setStoryVisibility(option.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.storyVisibilityRadio,
                  preferences.storyVisibility === option.value && styles.selectedStoryVisibilityRadio,
                ]}>
                  {preferences.storyVisibility === option.value && (
                    <View style={styles.storyVisibilityRadioInner} />
                  )}
                </View>
                <View style={styles.storyVisibilityText}>
                  <Text style={styles.storyVisibilityLabel}>
                    {option.label}
                  </Text>
                  <Text style={styles.storyVisibilityDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Status</Text>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <Text style={styles.privacyTitle}>Show Online Status</Text>
              <Text style={styles.privacyDescription}>
                Let others see when you're active
              </Text>
            </View>
            <Switch
              value={preferences.onlineStatus}
              onValueChange={() => togglePreference('onlineStatus')}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Data Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <Text style={styles.privacyTitle}>Analytics Collection</Text>
              <Text style={styles.privacyDescription}>
                Help improve the app by sharing usage data
              </Text>
            </View>
            <Switch
              value={preferences.analyticsCollection}
              onValueChange={() => togglePreference('analyticsCollection')}
              disabled={isLoading}
            />
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <Text style={styles.privacyTitle}>Crash Reports</Text>
              <Text style={styles.privacyDescription}>
                Send crash reports to help fix issues
              </Text>
            </View>
            <Switch
              value={preferences.crashReports}
              onValueChange={() => togglePreference('crashReports')}
              disabled={isLoading}
            />
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <Text style={styles.privacyTitle}>Personalized Ads</Text>
              <Text style={styles.privacyDescription}>
                See ads tailored to your interests
              </Text>
            </View>
            <Switch
              value={preferences.personalizedAds}
              onValueChange={() => togglePreference('personalizedAds')}
              disabled={isLoading}
            />
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyLeft}>
              <Text style={styles.privacyTitle}>Data Collection</Text>
              <Text style={styles.privacyDescription}>
                Collect additional data for personalization
              </Text>
            </View>
            <Switch
              value={preferences.dataCollection}
              onValueChange={() => togglePreference('dataCollection')}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <SettingItem
            title="Download Your Data"
            description="Export all your story data"
            icon="download"
            onPress={downloadData}
            disabled={isLoading}
            rightComponent={
              <Feather name="external-link" size={16} color="#757575" />
            }
          />

          <SettingItem
            title="Delete Account"
            description="Permanently delete your account and data"
            icon="trash-2"
            onPress={deleteAccount}
            style={styles.deleteAccountItem}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <SettingItem
            title="Restore Defaults"
            description="Reset all privacy settings to defaults"
            icon="refresh-cw"
            onPress={restoreDefaults}
            disabled={isLoading}
          />

          <Button
            variant="primary"
            onPress={handleSave}
            style={styles.saveButton}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Save Settings
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  storyVisibilityContainer: {
    gap: 12,
  },
  storyVisibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedStoryVisibility: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  storyVisibilityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    marginRight: 12,
  },
  selectedStoryVisibilityRadio: {
    borderColor: '#FFFFFF',
  },
  storyVisibilityRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    margin: 4,
  },
  storyVisibilityText: {
    flex: 1,
  },
  storyVisibilityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  selectedStoryVisibilityLabel: {
    color: '#FFFFFF',
  },
  storyVisibilityDescription: {
    fontSize: 14,
    color: '#757575',
  },
  selectedStoryVisibilityDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  privacyLeft: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#757575',
  },
  deleteAccountItem: {
    marginTop: 8,
  },
  deleteAccountTitle: {
    color: '#F44336',
  },
  actions: {
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 16,
  },
});