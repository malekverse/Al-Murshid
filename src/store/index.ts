import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppState {
  hasCompletedOnboarding: boolean;
  userLevel: number;
  sunnahStreak: number;
  language: 'en' | 'ar';
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  incrementStreak: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userLevel: 1, // 1: The Seeker
      sunnahStreak: 0,
      language: 'en',
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false, sunnahStreak: 0 }),
      incrementStreak: () => set((state) => ({ sunnahStreak: state.sunnahStreak + 1 })),
      setLanguage: (lang: 'en' | 'ar') => set({ language: lang }),
    }),
    {
      name: 'al-murshid-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
