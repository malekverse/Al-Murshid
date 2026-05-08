import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrayerLogEntry {
  prayerName: string;
  date: string;
  timestamp: number;
}

export interface AppState {
  hasCompletedOnboarding: boolean;
  userLevel: number;
  sunnahStreak: number;
  language: 'en' | 'ar';
  noorPoints: number;
  prayerLog: PrayerLogEntry[];
  totalDhikrCount: number;
  openRouterApiKey: string;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  incrementStreak: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  logPrayer: (prayerName: string) => void;
  addNoorPoints: (points: number) => void;
  incrementDhikr: () => void;
  setOpenRouterApiKey: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userLevel: 1,
      sunnahStreak: 0,
      language: 'en',
      noorPoints: 0,
      prayerLog: [],
      totalDhikrCount: 0,
      openRouterApiKey: '',
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false, sunnahStreak: 0, noorPoints: 0, prayerLog: [], totalDhikrCount: 0 }),
      incrementStreak: () => set((state) => ({ sunnahStreak: state.sunnahStreak + 1 })),
      setLanguage: (lang: 'en' | 'ar') => set({ language: lang }),
      logPrayer: (prayerName: string) => set((state) => ({
        prayerLog: [
          ...state.prayerLog,
          { prayerName, date: new Date().toISOString().split('T')[0], timestamp: Date.now() },
        ],
        sunnahStreak: state.sunnahStreak + 1,
        noorPoints: state.noorPoints + 10,
      })),
      addNoorPoints: (points: number) => set((state) => ({ noorPoints: state.noorPoints + points })),
      incrementDhikr: () => set((state) => ({ totalDhikrCount: state.totalDhikrCount + 1 })),
      setOpenRouterApiKey: (key: string) => set({ openRouterApiKey: key }),
    }),
    {
      name: 'al-murshid-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
