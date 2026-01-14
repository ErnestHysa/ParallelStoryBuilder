import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../i18n/en.json';
import es from '../i18n/es.json';
import fr from '../i18n/fr.json';
import de from '../i18n/de.json';
import pt from '../i18n/pt.json';
import zh from '../i18n/zh.json';
import ja from '../i18n/ja.json';

// Translation namespaces
export const namespaces = ['common', 'auth', 'story', 'profile', 'settings'] as const;
export type Namespace = typeof namespaces[number];

// Supported languages with their codes and native names
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
] as const;

// Language codes type
export type LanguageCode = typeof supportedLanguages[number]['code'];

// Resources for all languages
const resources = {
  en: {
    common: en.common,
    auth: en.auth,
    story: en.story,
    profile: en.profile,
    settings: en.settings,
  },
  es: {
    common: es.common,
    auth: es.auth,
    story: es.story,
    profile: es.profile,
    settings: es.settings,
  },
  fr: {
    common: fr.common,
    auth: fr.auth,
    story: fr.story,
    profile: fr.profile,
    settings: fr.settings,
  },
  de: {
    common: de.common,
    auth: de.auth,
    story: de.story,
    profile: de.profile,
    settings: de.settings,
  },
  pt: {
    common: pt.common,
    auth: pt.auth,
    story: pt.story,
    profile: pt.profile,
    settings: pt.settings,
  },
  zh: {
    common: zh.common,
    auth: zh.auth,
    story: zh.story,
    profile: zh.profile,
    settings: zh.settings,
  },
  ja: {
    common: ja.common,
    auth: ja.auth,
    story: ja.story,
    profile: ja.profile,
    settings: ja.settings,
  },
};

// Custom logger for i18next
const logger = {
  debug: (message: string, ...args: any[]) => console.debug(`[i18n] ${message}`, ...args),
  log: (message: string, ...args: any[]) => console.log(`[i18n] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[i18n] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[i18n] ${message}`, ...args),
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',

    debug: __DEV__,

    ns: namespaces,
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes by default
      formatSeparator: ',',
      format: (value: any, format?: string, lng?: string) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          return new Intl.NumberFormat(lng || i18n.language, {
            style: 'currency',
            currency: lng === 'zh' ? 'CNY' : lng === 'ja' ? 'JPY' : 'USD'
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng || i18n.language).format(new Date(value));
        }
        if (format === 'number') {
          return new Intl.NumberFormat(lng || i18n.language).format(value);
        }
        return value;
      }
    },

    react: {
      useSuspense: false,
    },

    // Custom backend for AsyncStorage persistence
    backend: {
      init: (services: any, backendOptions: any) => {},
      read: async (language: string, namespace: string) => {
        try {
          const stored = await AsyncStorage.getItem(`i18n_${language}_${namespace}`);
          return stored ? JSON.parse(stored) : null;
        } catch (error) {
          logger.error('Failed to read translations from storage', error);
          return null;
        }
      },
      save: async (language: string, namespace: string, data: any) => {
        try {
          await AsyncStorage.setItem(`i18n_${language}_${namespace}`, JSON.stringify(data));
        } catch (error) {
          logger.error('Failed to save translations to storage', error);
        }
      },
    },

    // Detect language from device
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Pluralization rules
    pluralSeparator: '_',
    contextSeparator: '_',
    missingInterpolationHandler: (text: string, value: any, options: any) => {
      logger.warn(`Missing translation: ${text}`);
      return text;
    },
  });

// Custom functions for i18n
export const i18nHelpers = {
  // Get current language
  getCurrentLanguage: () => i18n.language,

  // Set language and persist it
  setLanguage: async (language: LanguageCode) => {
    try {
      await AsyncStorage.setItem('i18nextLng', language);
      i18n.changeLanguage(language);
    } catch (error) {
      logger.error('Failed to set language', error);
    }
  },

  // Get available languages
  getSupportedLanguages: () => supportedLanguages,

  // Format date based on current language
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
  },

  // Format number based on current language
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(number);
  },

  // Format currency based on current language
  formatCurrency: (amount: number, currency?: string) => {
    const currencyCode = currency ||
      (i18n.language === 'zh' ? 'CNY' :
       i18n.language === 'ja' ? 'JPY' :
       'USD');
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  },

  // Check if translation exists
  exists: (key: string, options?: { ns?: Namespace }) => {
    return i18n.exists(key, options);
  },

  // Get translation with fallback
  t: (key: string, options?: any) => {
    return i18n.t(key, options);
  },

  // Get translation for plural
  tPlural: (key: string, count: number, options?: any) => {
    return i18n.t(key, { count, ...options });
  },
};

// Auto-detect device language on app start
const detectDeviceLanguage = async () => {
  try {
    // Get saved language from storage
    const savedLanguage = await AsyncStorage.getItem('i18nextLng');

    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      // Use saved language if it's supported
      i18n.changeLanguage(savedLanguage);
    } else {
      // Use device language if supported
      const deviceLanguage = Localization.locale.split('-')[0];
      const supportedLanguage = supportedLanguages.find(lang =>
        lang.code === deviceLanguage
      );

      if (supportedLanguage) {
        i18n.changeLanguage(supportedLanguage.code);
        await AsyncStorage.setItem('i18nextLng', supportedLanguage.code);
      }
    }
  } catch (error) {
    logger.error('Failed to detect device language', error);
  }
};

// Initialize language detection
detectDeviceLanguage();

export default i18n;