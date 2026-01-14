import { create } from 'zustand';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
export type ThemeMode = 'light' | 'dark' | 'auto';

interface SettingsState {
  language: Language;
  themeMode: ThemeMode;
  notifications: boolean;
  emailNotifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;

  setLanguage: (language: Language) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleNotifications: () => void;
  toggleEmailNotifications: () => void;
  toggleSoundEffects: () => void;
  toggleHapticFeedback: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  themeMode: 'auto',
  notifications: true,
  emailNotifications: true,
  soundEffects: true,
  hapticFeedback: true,

  setLanguage: (language) => set({ language }),

  setThemeMode: (themeMode) => set({ themeMode }),

  toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),

  toggleEmailNotifications: () => set((state) => ({ emailNotifications: !state.emailNotifications })),

  toggleSoundEffects: () => set((state) => ({ soundEffects: !state.soundEffects })),

  toggleHapticFeedback: () => set((state) => ({ hapticFeedback: !state.hapticFeedback })),
}));
