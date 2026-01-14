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
import { SettingItem } from '@/components/SettingItem';
import { Button } from '@/components/Button';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  storyUpdates: boolean;
  partnerInvitations: boolean;
  inspirations: boolean;
  aiSuggestions: boolean;
  marketingEmails: boolean;
  soundEnabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  storyUpdates: true,
  partnerInvitations: true,
  inspirations: true,
  aiSuggestions: true,
  marketingEmails: false,
  soundEnabled: true,
};

export default function NotificationSettingsScreen() {
  const { profile, isConfigured } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load preferences from storage or database
    // This would typically come from Supabase or local storage
    const loadPreferences = async () => {
      try {
        // TODO: Implement preference loading from Supabase
        // For now, using default preferences
        const saved = await getStoredPreferences();
        if (saved) {
          setPreferences({ ...defaultPreferences, ...saved });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    if (isConfigured) {
      loadPreferences();
    }
  }, [isConfigured]);

  const getStoredPreferences = async (): Promise<Partial<NotificationPreferences>> => {
    // This would typically read from secure storage or Supabase
    // For demo purposes, returning empty object
    return {};
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setIsLoading(true);

    try {
      // Save to local storage (using AsyncStorage would be better)
      // For demo, just show success
      Alert.alert(
        'Success',
        'Notification preferences saved successfully!'
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save preferences. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
  };

  const handleSave = async () => {
    await savePreferences(preferences);
  };

  const restoreDefaults = () => {
    Alert.alert(
      'Restore Defaults',
      'Are you sure you want to restore default notification settings?',
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

  const notificationGroups = [
    {
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      items: [
        {
          key: 'pushNotifications' as keyof NotificationPreferences,
          title: 'Push Notifications',
          description: 'Enable push notifications',
          enabled: preferences.pushNotifications,
        },
        {
          key: 'soundEnabled' as keyof NotificationPreferences,
          title: 'Notification Sound',
          description: 'Play sound with notifications',
          enabled: preferences.soundEnabled,
        },
      ],
    },
    {
      title: 'Email Notifications',
      description: 'Receive updates via email',
      items: [
        {
          key: 'emailNotifications' as keyof NotificationPreferences,
          title: 'Email Notifications',
          description: 'Enable email notifications',
          enabled: preferences.emailNotifications,
        },
        {
          key: 'marketingEmails' as keyof NotificationPreferences,
          title: 'Marketing Emails',
          description: 'Receive product updates and news',
          enabled: preferences.marketingEmails,
        },
      ],
    },
    {
      title: 'Story Notifications',
      description: 'Notifications about your stories',
      items: [
        {
          key: 'storyUpdates' as keyof NotificationPreferences,
          title: 'Story Updates',
          description: 'Notify when stories are updated',
          enabled: preferences.storyUpdates,
        },
        {
          key: 'partnerInvitations' as keyof NotificationPreferences,
          title: 'Partner Invitations',
          description: 'Notify when someone joins your story',
          enabled: preferences.partnerInvitations,
        },
        {
          key: 'inspirations' as keyof NotificationPreferences,
          title: 'New Inspirations',
          description: 'Notify when inspirations are added',
          enabled: preferences.inspirations,
        },
        {
          key: 'aiSuggestions' as keyof NotificationPreferences,
          title: 'AI Suggestions',
          description: 'Receive AI-powered writing suggestions',
          enabled: preferences.aiSuggestions,
        },
      ],
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
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {!isConfigured && (
          <View style={styles.demoNotice}>
            <Text style={styles.demoText}>
              Demo mode: Notification settings are saved locally
            </Text>
          </View>
        )}

        {/* Notification Groups */}
        {notificationGroups.map((group, groupIndex) => (
          <View key={group.title} style={styles.notificationGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>

            {group.items.map((item) => (
              <View key={item.key} style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDescription}>
                    {item.description}
                  </Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => togglePreference(item.key)}
                  disabled={isLoading}
                />
              </View>
            ))}
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>
            Notification Summary
          </Text>
          <View style={styles.summaryGrid}>
            {Object.entries(preferences).map(([key, value]) => {
              const config = {
                emailNotifications: 'Email',
                pushNotifications: 'Push',
                storyUpdates: 'Stories',
                partnerInvitations: 'Partners',
                inspirations: 'Inspirations',
                aiSuggestions: 'AI Suggestions',
                marketingEmails: 'Marketing',
                soundEnabled: 'Sound',
              }[key];

              return (
                <View key={key} style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>{config}</Text>
                  <Text style={[
                    styles.summaryItemValue,
                    value ? styles.summaryEnabled : styles.summaryDisabled,
                  ]}>
                    {value ? 'On' : 'Off'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <SettingItem
            title="Restore Defaults"
            description="Reset all notification settings to defaults"
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
            Save Preferences
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
  demoNotice: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  demoText: {
    fontSize: 14,
    color: '#757575',
  },
  notificationGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  notificationLeft: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#757575',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '50%',
    marginBottom: 12,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryEnabled: {
    color: '#4CAF50',
  },
  summaryDisabled: {
    color: '#BDBDBD',
  },
  actions: {
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 16,
  },
});