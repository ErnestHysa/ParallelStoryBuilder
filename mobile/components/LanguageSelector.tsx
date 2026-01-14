import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18nHelpers, LanguageCode, supportedLanguages } from '@/lib/i18n';

// Country flag emojis mapping
const FLAG_EMOJIS: Record<LanguageCode, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  zh: '🇨🇳',
  ja: '🇯🇵',
};

interface LanguageSelectorProps {
  visible?: boolean;
  onClose?: () => void;
  currentLanguage?: LanguageCode;
  onLanguageChange?: (language: LanguageCode) => void;
  style?: any;
  containerStyle?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible = false,
  onClose,
  currentLanguage: propCurrentLanguage,
  onLanguageChange,
  style,
  containerStyle,
}) => {
  const { t } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    propCurrentLanguage || i18nHelpers.getCurrentLanguage() as LanguageCode
  );
  const [modalVisible, setModalVisible] = useState(visible);

  // Update modal visibility when prop changes
  useEffect(() => {
    setModalVisible(visible);
  }, [visible]);

  // Handle language selection
  const handleLanguageSelect = async (language: LanguageCode) => {
    setCurrentLanguage(language);
    await i18nHelpers.setLanguage(language);
    onLanguageChange?.(language);
    onClose?.();
  };

  // Render language item
  const renderLanguageItem = ({ item }: { item: { code: LanguageCode; name: string; nativeName: string } }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        currentLanguage === item.code && styles.selectedLanguageItem,
      ]}
      onPress={() => handleLanguageSelect(item.code as LanguageCode)}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{FLAG_EMOJIS[item.code as LanguageCode]}</Text>
      <View style={styles.languageInfo}>
        <Text style={[styles.languageName, currentLanguage === item.code && styles.selectedText]}>
          {item.nativeName}
        </Text>
        <Text style={[styles.languageCode, currentLanguage === item.code && styles.selectedText]}>
          {item.code.toUpperCase()}
        </Text>
      </View>
      {currentLanguage === item.code && (
        <Ionicons name="checkmark" size={20} color="#E91E63" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={[styles.triggerButton, containerStyle]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{FLAG_EMOJIS[currentLanguage]}</Text>
        <Text style={styles.triggerText}>
          {supportedLanguages.find(lang => lang.code === currentLanguage)?.nativeName}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      {/* Language selection modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setModalVisible(false);
          onClose?.();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setModalVisible(false);
                onClose?.();
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('select_language')}</Text>
            <View style={styles.headerButton} />
          </View>

          <FlatList
            data={supportedLanguages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: 0 } as any}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

// Standalone language picker for use in settings
export const LanguagePicker: React.FC<{
  currentLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}> = ({ currentLanguage, onLanguageChange }) => {
  const { t } = useTranslation('settings');

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{t('language')}</Text>
      <LanguageSelector
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
        containerStyle={styles.pickerTrigger}
      />
    </View>
  );
};

// Hook for using language selection in components
export const useLanguageSelector = () => {
  const { t } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    i18nHelpers.getCurrentLanguage() as LanguageCode
  );

  const changeLanguage = async (language: LanguageCode) => {
    await i18nHelpers.setLanguage(language);
    setCurrentLanguage(language);
  };

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages,
    t,
  };
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  triggerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguageItem: {
    backgroundColor: '#fce4ec',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  languageCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedText: {
    color: '#E91E63',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  pickerTrigger: {
    width: '100%',
  },
});

export default LanguageSelector;