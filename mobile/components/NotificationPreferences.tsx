import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDemoStore } from '../stores/demoStore';
import { NotificationCategory, NotificationSettings } from '../lib/notifications';
import { trackEvent } from '../lib/analytics';
import { EventNames } from '../lib/trackingEvents';

interface NotificationPreferencesProps {
  userId?: string;
  onClose?: () => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  onClose,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(null!);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      // Default notification settings since notificationStore doesn't exist
      const defaultSettings: NotificationSettings = {
        enabled: true,
        categories: {
          story_invitation: true,
          story_update: true,
          comment_reply: true,
          mention: true,
          system: true,
        },
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
        sound: true,
        badge: true,
        preview: true,
      };
      setSettings(defaultSettings);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      if (userId) {
        trackEvent(EventNames.USER_SETTINGS_CHANGED.name, {
          section: 'notifications',
          changes: 'notification_preferences',
        });
      }
      onClose?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings };
    (newSettings as any)[key] = !(newSettings as any)[key];
    setSettings(newSettings);
  };

  const handleCategoryToggle = (category: NotificationCategory) => {
    const newSettings = { ...settings };
    newSettings.categories[category] = !newSettings.categories[category];
    setSettings(newSettings);
  };

  const handleQuietHoursToggle = () => {
    const newSettings = { ...settings };
    newSettings.quietHours.enabled = !newSettings.quietHours.enabled;
    setSettings(newSettings);
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    const newSettings = { ...settings };
    newSettings.quietHours[type] = value;
    setSettings(newSettings);
  };

  const renderCategoryItem = (
    category: NotificationCategory,
    title: string,
    description: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryIcon}>
        <Ionicons name={icon} size={24} color="#4A5568" />
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <Text style={styles.categoryDescription}>{description}</Text>
      </View>
      <Switch
        value={settings.categories[category]}
        onValueChange={() => handleCategoryToggle(category)}
        trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
        thumbColor={settings.categories[category] ? '#4299E1' : '#F7FAFC'}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#4A5568" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master toggle */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Push Notifications</Text>
            <Switch
              value={settings.enabled}
              onValueChange={() => handleToggle('enabled')}
              trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
              thumbColor={settings.enabled ? '#4299E1' : '#F7FAFC'}
            />
          </View>
          <Text style={styles.rowDescription}>
            Receive notifications about your stories and activities
          </Text>
        </View>

        {/* Notification categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          {renderCategoryItem(
            NotificationCategory.STORY_INVITATION,
            'Story Invitations',
            'Get notified when you\'re invited to collaborate on a story',
            'person-add'
          )}
          {renderCategoryItem(
            NotificationCategory.STORY_UPDATE,
            'Story Updates',
            'Get notified when there are updates to stories you\'re in',
            'document-text'
          )}
          {renderCategoryItem(
            NotificationCategory.COMMENT_REPLY,
            'Comment Replies',
            'Get notified when someone replies to your comments',
            'chatbubbles'
          )}
          {renderCategoryItem(
            NotificationCategory.MENTION,
            'Mentions',
            'Get notified when someone mentions you in a story',
            'at'
          )}
          {renderCategoryItem(
            NotificationCategory.SYSTEM,
            'System Notifications',
            'Get notified about app updates and important information',
            'notifications'
          )}
        </View>

        {/* Quiet hours */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowQuietHoursModal(true)}
          >
            <Text style={styles.rowLabel}>Quiet Hours</Text>
            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
          </TouchableOpacity>
          <Text style={styles.rowDescription}>
            {settings.quietHours.enabled
              ? `Quiet hours are set from ${settings.quietHours.start} to ${settings.quietHours.end}`
              : 'No quiet hours set'}
          </Text>
        </View>

        {/* Other preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Preferences</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notification Sound</Text>
            <Switch
              value={settings.sound}
              onValueChange={() => handleToggle('sound')}
              trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
              thumbColor={settings.sound ? '#4299E1' : '#F7FAFC'}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Show Badge</Text>
            <Switch
              value={settings.badge}
              onValueChange={() => handleToggle('badge')}
              trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
              thumbColor={settings.badge ? '#4299E1' : '#F7FAFC'}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Preview Content</Text>
            <Switch
              value={settings.preview}
              onValueChange={() => handleToggle('preview')}
              trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
              thumbColor={settings.preview ? '#4299E1' : '#F7FAFC'}
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quiet Hours Modal */}
      <Modal
        visible={showQuietHoursModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuietHoursModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowQuietHoursModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Set Quiet Hours</Text>

                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>From:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={settings.quietHours.start}
                    onChangeText={(value) => handleTimeChange('start', value)}
                    placeholder="HH:mm"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>To:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={settings.quietHours.end}
                    onChangeText={(value) => handleTimeChange('end', value)}
                    placeholder="HH:mm"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={styles.modalToggleContainer}>
                  <Text style={styles.modalToggleLabel}>Enable Quiet Hours</Text>
                  <Switch
                    value={settings.quietHours.enabled}
                    onValueChange={handleQuietHoursToggle}
                    trackColor={{ false: '#E2E8F0', true: '#4299E1' }}
                    thumbColor={settings.quietHours.enabled ? '#4299E1' : '#F7FAFC'}
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => setShowQuietHoursModal(false)}
                >
                  <Text style={styles.modalSaveButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  rowLabel: {
    fontSize: 16,
    color: '#4A5568',
  },
  rowDescription: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    color: '#4A5568',
    marginRight: 12,
    minWidth: 40,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    textAlign: 'center',
  },
  modalToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalToggleLabel: {
    fontSize: 16,
    color: '#4A5568',
  },
  modalSaveButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default NotificationPreferences;