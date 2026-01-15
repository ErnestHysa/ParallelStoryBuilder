/**
 * NotificationSettings Component
 *
 * Complete notification settings UI with:
 * - Permission request prompt
 * - Category-specific toggles
 * - Quiet hours configuration
 * - Smart time selection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Card } from './Card';
import { Switch } from './Switch';
import { Button } from './Button';
import {
  notificationScheduler,
  scheduleDailyIntention,
  setNotificationQuietHours,
  getNotificationQuietHours,
  type QuietHours,
} from '@/lib/notificationScheduler';
import { getBestDailyIntentionTime } from '@/lib/notificationTemplates';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  onDismiss?: () => void;
}

export function NotificationSettings({ onDismiss }: NotificationSettingsProps) {
  const { permissions, requestPermissions, isLoading } = useNotifications({
    autoInitialize: false,
  });

  const [settings, setSettings] = useState({
    enabled: permissions.granted,
    dailyIntention: true,
    yourTurn: true,
    newChapter: true,
    partnerJoined: true,
    achievements: true,
    weeklySummary: false,
  });

  const [quietHours, setQuietHoursState] = useState<QuietHours>({
    enabled: false,
    startHour: 22,
    endHour: 8,
  });

  const [dailyTime, setDailyTime] = useState(9); // Default 9 AM
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current quiet hours
    const currentQuietHours = getNotificationQuietHours();
    setQuietHoursState(currentQuietHours);

    // Load best time suggestion
    const bestTimes = getBestDailyIntentionTime();
    if (bestTimes.length > 0) {
      setDailyTime(bestTimes[0].hour);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermissions();
    if (granted) {
      setSettings(prev => ({ ...prev, enabled: true }));
      // Initialize the scheduler
      await notificationScheduler.initialize();
    }
  };

  const handleToggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));

    // If enabling daily intention, schedule it
    if (key === 'dailyIntention' && newValue) {
      await scheduleDailyIntention(dailyTime);
    } else if (key === 'dailyIntention' && !newValue) {
      await notificationScheduler.cancelCategory('daily_intention');
    }

    // If disabling all, show confirmation
    if (key === 'enabled' && newValue === false) {
      Alert.alert(
        'Disable Notifications',
        'You won\'t receive any reminders about daily intentions, story updates, or partner activity.',
        [
          { text: 'Cancel', onPress: () => setSettings(prev => ({ ...prev, enabled: true })) },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await notificationScheduler.cancelAll();
            },
          },
        ]
      );
    }
  };

  const handleToggleQuietHours = async () => {
    const newValue = !quietHours.enabled;
    const updated = { ...quietHours, enabled: newValue };
    setQuietHoursState(updated);
    await setNotificationQuietHours(updated);
  };

  const handleTimeSelect = (hour: number) => {
    setDailyTime(hour);

    // Reschedule daily intention if enabled
    if (settings.dailyIntention) {
      notificationScheduler.cancelCategory('daily_intention');
      scheduleDailyIntention(hour);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save quiet hours
      await setNotificationQuietHours(quietHours);

      // Schedule daily intention if enabled
      if (settings.enabled && settings.dailyIntention) {
        await scheduleDailyIntention(dailyTime);
      }

      setTimeout(() => {
        setIsSaving(false);
        onDismiss?.();
      }, 500);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  if (!permissions.granted) {
    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.permissionPrompt}>
          <View style={styles.permissionIcon}>
            <Feather name="bell" size={32} color="#E91E63" />
          </View>
          <Text style={styles.permissionTitle}>Enable Notifications</Text>
          <Text style={styles.permissionDescription}>
            Get reminded about daily intentions, when it\'s your turn to write, and when your partner updates your story.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Daily intention reminders</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Turn notifications</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Partner activity alerts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Achievement celebrations</Text>
            </View>
          </View>

          <Button
            onPress={handleRequestPermission}
            isLoading={isLoading}
            style={styles.enableButton}
          >
            Enable Notifications
          </Button>

          <TouchableOpacity
            onPress={onDismiss}
            style={styles.skipButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Master Toggle */}
      <Card variant="outlined" style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="bell" size={20} color="#212121" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive reminders and updates
              </Text>
            </View>
          </View>
          <Switch value={settings.enabled} onValueChange={handleToggleSetting} />
        </View>
      </Card>

      {/* Notification Categories */}
      {settings.enabled && (
        <>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <Card variant="outlined" style={styles.card}>
            {/* Daily Intention */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="heart" size={20} color="#E91E63" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Daily Intention</Text>
                  <Text style={styles.settingDescription}>
                    Reminder to set your daily intention
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.dailyIntention}
                onValueChange={() => handleToggleSetting('dailyIntention')}
              />
            </View>

            {/* Time Selector for Daily Intention */}
            {settings.dailyIntention && (
              <View style={styles.timeSelector}>
                <Text style={styles.timeLabel}>Reminder Time</Text>
                <View style={styles.timeOptions}>
                  {[7, 8, 9, 12, 18, 20].map((hour) => {
                    const bestTimes = getBestDailyIntentionTime();
                    const isBestTime = bestTimes.some(bt => bt.hour === hour);
                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeOption,
                          dailyTime === hour && styles.timeOptionSelected,
                          isBestTime && styles.timeOptionBest,
                        ]}
                        onPress={() => handleTimeSelect(hour)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            dailyTime === hour && styles.timeOptionTextSelected,
                          ]}
                        >
                          {formatTime(hour)}
                        </Text>
                        {isBestTime && dailyTime === hour && (
                          <Text style={styles.bestBadge}>Best</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Your Turn */}
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingInfo}>
                <Feather name="edit-2" size={20} color="#9C27B0" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Your Turn</Text>
                  <Text style={styles.settingDescription}>
                    When it's your turn to write
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.yourTurn}
                onValueChange={() => handleToggleSetting('yourTurn')}
              />
            </View>

            {/* New Chapter */}
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingInfo}>
                <Feather name="book-open" size={20} color="#2196F3" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>New Chapters</Text>
                  <Text style={styles.settingDescription}>
                    When your partner writes
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.newChapter}
                onValueChange={() => handleToggleSetting('newChapter')}
              />
            </View>

            {/* Partner Joined */}
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingInfo}>
                <Feather name="user-plus" size={20} color="#4CAF50" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Partner Activity</Text>
                  <Text style={styles.settingDescription}>
                    When partner joins or is active
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.partnerJoined}
                onValueChange={() => handleToggleSetting('partnerJoined')}
              />
            </View>

            {/* Achievements */}
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingInfo}>
                <Feather name="award" size={20} color="#FFC107" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Achievements</Text>
                  <Text style={styles.settingDescription}>
                    Milestone celebrations
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.achievements}
                onValueChange={() => handleToggleSetting('achievements')}
              />
            </View>

            {/* Weekly Summary */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="bar-chart-2" size={20} color="#00BCD4" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Weekly Summary</Text>
                  <Text style={styles.settingDescription}>
                    Your weekly writing recap
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.weeklySummary}
                onValueChange={() => handleToggleSetting('weeklySummary')}
              />
            </View>
          </Card>

          {/* Quiet Hours */}
          <Text style={styles.sectionTitle}>Quiet Hours</Text>

          <Card variant="outlined" style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="moon" size={20} color="#673AB7" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                  <Text style={styles.settingDescription}>
                    Pause notifications while sleeping
                  </Text>
                </View>
              </View>
              <Switch value={quietHours.enabled} onValueChange={handleToggleQuietHours} />
            </View>

            {quietHours.enabled && (
              <View style={styles.quietHoursSelector}>
                <Text style={styles.quietHoursLabel}>
                  Silence notifications from {quietHours.startHour}:00 to {quietHours.endHour}:00
                </Text>
                <View style={styles.quietHoursOptions}>
                  {[
                    { start: 22, end: 8, label: '10 PM - 8 AM' },
                    { start: 23, end: 7, label: '11 PM - 7 AM' },
                    { start: 0, end: 9, label: '12 AM - 9 AM' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={`${option.start}-${option.end}`}
                      style={[
                        styles.quietHoursOption,
                        quietHours.startHour === option.start && quietHours.endHour === option.end &&
                          styles.quietHoursOptionSelected,
                      ]}
                      onPress={async () => {
                        const updated = { ...quietHours, startHour: option.start, endHour: option.end };
                        setQuietHoursState(updated);
                        await setNotificationQuietHours(updated);
                      }}
                    >
                      <Text
                        style={[
                          styles.quietHoursOptionText,
                          quietHours.startHour === option.start && quietHours.endHour === option.end &&
                            styles.quietHoursOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Save Button */}
          <Button onPress={handleSave} isLoading={isSaving} style={styles.saveButton}>
            Save Settings
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    marginTop: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  timeSelector: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 12,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  timeOptionBest: {
    borderColor: '#4CAF50',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  bestBadge: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  quietHoursSelector: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quietHoursLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  quietHoursOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  quietHoursOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  quietHoursOptionSelected: {
    backgroundColor: '#673AB7',
  },
  quietHoursOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212121',
  },
  quietHoursOptionTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 24,
  },

  // Permission prompt styles
  permissionPrompt: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#212121',
    marginLeft: 12,
  },
  enableButton: {
    width: '100%',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
});

export default NotificationSettings;
