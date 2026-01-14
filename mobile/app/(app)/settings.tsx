import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { SettingItem } from '@/components/SettingItem';

const SETTINGS_ITEMS = [
  {
    title: 'Profile',
    description: 'Edit your display name and avatar',
    icon: 'user',
    route: 'settings/profile',
  },
  {
    title: 'Notifications',
    description: 'Manage notification preferences',
    icon: 'bell',
    route: 'settings/notifications',
  },
  {
    title: 'Privacy',
    description: 'Online status and sharing settings',
    icon: 'lock',
    route: 'settings/privacy',
  },
];

export default function SettingsScreen() {
  const { profile, signOut, isConfigured } = useAuthStore();
  const [demoMode, setDemoMode] = useState(!isConfigured);

  useEffect(() => {
    setDemoMode(!isConfigured);
  }, [isConfigured]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.display_name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {profile?.email || 'Not signed in'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          {SETTINGS_ITEMS.map((item) => (
            <SettingItem
              key={item.route}
              title={item.title}
              description={item.description}
              icon={item.icon as 'user' | 'bell' | 'lock' | 'download' | 'globe' | 'info' | 'help-circle' | 'shield'}
              onPress={() => router.push(item.route as any)}
            />
          ))}

          <SettingItem
            title="Export All Stories"
            description="Download your stories in different formats"
            icon="download"
            onPress={() => {
              // Navigate to a future export all feature
              Alert.alert(
                'Feature Coming Soon',
                'Export all stories feature will be available in a future update.'
              );
            }}
            rightComponent={
              <Feather name="external-link" size={16} color="#757575" />
            }
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingItem
            title="Theme"
            description="Customize app appearance"
            icon="sliders"
            onPress={() => {
              Alert.alert(
                'Theme Coming Soon',
                'Theme customization will be available in a future update.'
              );
            }}
            rightComponent={
              <Feather name="external-link" size={16} color="#757575" />
            }
          />

          <SettingItem
            title="Language"
            description="Change app language"
            icon="globe"
            onPress={() => {
              Alert.alert(
                'Language Coming Soon',
                'Language selection will be available in a future update.'
              );
            }}
            rightComponent={
              <Feather name="external-link" size={16} color="#757575" />
            }
          />
        </View>

        {/* About Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>About</Text>

          <SettingItem
            title="Version"
            description="1.0.0"
            icon="info"
            showArrow={false}
          />

          <SettingItem
            title="Help & Support"
            description="Get help or contact support"
            icon="help-circle"
            onPress={() => {
              Alert.alert(
                'Contact Support',
                'For support, please email us at support@parallelstory.app'
              );
            }}
          />

          <SettingItem
            title="Privacy Policy"
            description="Read our privacy policy"
            icon="shield"
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'Visit our website to read the complete privacy policy.'
              );
            }}
          />
        </View>

        {/* Demo Mode Notice */}
        {demoMode && (
          <View style={styles.demoNotice}>
            <View style={styles.demoBadge}>
              <Feather name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.demoBadgeText}>Demo Mode</Text>
            </View>
            <Text style={styles.demoText}>
              You're running in demo mode. Some features may be limited.
            </Text>
          </View>
        )}

        {/* Sign Out Button */}
        {isConfigured && (
          <Button
            variant="danger"
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ by Parallel Story Builder Team
          </Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#757575',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  demoNotice: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoBadgeText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  signOutButton: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#BDBDBD',
    textAlign: 'center',
  },
});