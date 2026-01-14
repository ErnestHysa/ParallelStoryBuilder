import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/Button';

interface SecuritySettings {
  biometricEnabled: boolean;
  sessionTimeout: number;
  autoLock: boolean;
  twoFactorEnabled: boolean;
}

const defaultSettings: SecuritySettings = {
  biometricEnabled: false,
  sessionTimeout: 30,
  autoLock: true,
  twoFactorEnabled: false,
};

export default function SecuritySettingsScreen() {
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSetting = (key: keyof SecuritySettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, save to secure storage or backend
      await new Promise(resolve => setTimeout(resolve, 500));
      Alert.alert('Success', 'Security settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save security settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon!');
  };

  const handleEnable2FA = () => {
    Alert.alert('Two-Factor Authentication', '2FA setup coming soon!');
  };

  const getSecurityScore = () => {
    let score = 50;
    if (settings.biometricEnabled) score += 15;
    if (settings.twoFactorEnabled) score += 20;
    if (settings.autoLock) score += 10;
    if (settings.sessionTimeout <= 15) score += 5;
    return Math.min(100, score);
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

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
          <Text style={styles.title}>Security</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Security Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Security Score</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{securityScore}%</Text>
            <Text style={styles.scoreLevel}>{securityLevel}</Text>
          </View>
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face recognition
              </Text>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={(value) => toggleSetting('biometricEnabled', value)}
              disabled={isLoading}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>
                Add an extra layer of security
              </Text>
            </View>
            <Switch
              value={settings.twoFactorEnabled}
              onValueChange={(value) => {
                if (value) {
                  handleEnable2FA();
                } else {
                  toggleSetting('twoFactorEnabled', value);
                }
              }}
              disabled={isLoading}
            />
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Feather name="chevron-right" size={16} color="#757575" />
          </TouchableOpacity>
        </View>

        {/* Session Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Auto-Lock</Text>
              <Text style={styles.settingDescription}>
                Lock app when not in use
              </Text>
            </View>
            <Switch
              value={settings.autoLock}
              onValueChange={(value) => toggleSetting('autoLock', value)}
              disabled={isLoading}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Session Timeout</Text>
              <Text style={styles.settingDescription}>
                Current: {settings.sessionTimeout} minutes
              </Text>
            </View>
            <View style={styles.timeoutButtons}>
              {([5, 15, 30, 60] as const).map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.timeoutButton,
                    settings.sessionTimeout === minutes && styles.timeoutButtonActive,
                  ]}
                  onPress={() => toggleSetting('sessionTimeout', minutes)}
                >
                  <Text
                    style={[
                      styles.timeoutButtonText,
                      settings.sessionTimeout === minutes && styles.timeoutButtonTextActive,
                    ]}
                  >
                    {minutes}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Protection</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Data export feature coming soon!')}
          >
            <Text style={styles.actionButtonText}>Export My Data</Text>
            <Feather name="download" size={16} color="#757575" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() =>
              Alert.alert(
                'Clear Data',
                'This will clear all locally stored data. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => Alert.alert('Data Cleared', 'Local data has been cleared.'),
                  },
                ]
              )
            }
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Clear Local Data
            </Text>
            <Feather name="trash-2" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.actions}>
          <Button
            onPress={handleSave}
            variant="primary"
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
  scoreCard: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreLevel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
  },
  timeoutButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeoutButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  timeoutButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeoutButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#212121',
  },
  dangerButton: {
    // No special style needed for container
  },
  dangerButtonText: {
    color: '#F44336',
  },
  actions: {
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 8,
  },
});
