import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SettingsScreen: React.FC = () => {
  const router = useRouter();

  const settingsOptions = [
    {
      id: 'language',
      title: 'Language',
      icon: 'language',
      subtitle: 'Change app language',
      route: 'language',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person',
      subtitle: 'Edit your profile information',
      route: 'profile',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      subtitle: 'Manage notification preferences',
      route: 'notifications',
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: 'lock-closed',
      subtitle: 'Privacy settings and data control',
      route: 'privacy',
    },
    {
      id: 'security',
      title: 'Security',
      icon: 'shield-checkmark',
      subtitle: 'Security and authentication settings',
      route: 'security',
    },
  ];

  const handlePress = (route: string) => {
    router.push(`/settings/${route}` as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => handlePress(option.route)}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Ionicons name={option.icon as any} size={24} color="#E91E63" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  option: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000' as const,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      } as const,
      android: {
        elevation: 2,
      } as const,
    }),
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fce4ec',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 24,
    alignItems: 'center' as const,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default SettingsScreen;