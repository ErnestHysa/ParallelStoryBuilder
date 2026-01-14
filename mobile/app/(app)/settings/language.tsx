import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, Language } from '@/stores/settingsStore';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

const LanguageSettingsScreen: React.FC = () => {
  const router = useRouter();
  const { language, setLanguage } = useSettingsStore();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === language) return;

    Alert.alert(
      'Change Language',
      `Are you sure you want to change the language to ${LANGUAGES.find(l => l.code === newLanguage)?.nativeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setIsChanging(true);
            try {
              setLanguage(newLanguage);
              Alert.alert('Language Changed', `Language has been changed to ${LANGUAGES.find(l => l.code === newLanguage)?.nativeName}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to change language');
            } finally {
              setIsChanging(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Language',
          headerStyle: { backgroundColor: '#E91E63' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Language</Text>
          <View style={styles.currentLanguageCard}>
            <View style={styles.languageInfo}>
              <Text style={styles.currentLanguageName}>
                {LANGUAGES.find(l => l.code === language)?.nativeName}
              </Text>
              <Text style={styles.currentLanguageNative}>
                {LANGUAGES.find(l => l.code === language)?.name}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        </View>

        {/* Available Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Languages</Text>

          {LANGUAGES.filter(l => l.code !== language).map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.languageItem}
              onPress={() => handleLanguageChange(lang.code)}
              disabled={isChanging}
            >
              <View style={styles.languageIcon}>
                <Ionicons name="globe" size={20} color="#E91E63" />
              </View>
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{lang.nativeName}</Text>
                <Text style={styles.languageNative}>{lang.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Language Settings</Text>
          <Text style={styles.infoText}>
            Changing the language will update the text throughout the app. Some content may not be translated yet.
          </Text>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#757575" />
            <Text style={styles.infoItemText}>Version 1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="build" size={20} color="#757575" />
            <Text style={styles.infoItemText}>Build 1</Text>
          </View>
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
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  currentLanguageCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  languageInfo: {
    flex: 1,
  },
  currentLanguageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  currentLanguageNative: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  languageItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fce4ec',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  languageNative: {
    fontSize: 14,
    color: '#757575',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoItemText: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 16,
  },
});

export default LanguageSettingsScreen;
