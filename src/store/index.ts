import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrayerLogEntry {
  prayerName: string;
  date: string;
  timestamp: number;
}

export interface UserState {
  id: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  authProvider: string;
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
  user: UserState | null;
  isOnline: boolean;
  lastSyncAt: string | null;
  tamperDetected: boolean;
  isUserInitiatedSignOut: boolean;
  darkMode: boolean;

  completeOnboarding: () => void;
  resetOnboarding: () => void;
  incrementStreak: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  logPrayer: (prayerName: string) => void;
  addNoorPoints: (points: number) => void;
  incrementDhikr: () => void;
  setOpenRouterApiKey: (key: string) => void;
  setUser: (user: UserState | null) => void;
  setOnlineStatus: (online: boolean) => void;
  setSyncInfo: (lastSyncAt: string | null, tamperDetected: boolean) => void;
  setUserInitiatedSignOut: (val: boolean) => void;
  updateProfile: (updates: Partial<UserState>) => void;
  setDarkMode: (val: boolean) => void;
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
      user: null,
      isOnline: false,
      lastSyncAt: null,
      tamperDetected: false,
      isUserInitiatedSignOut: false,
      darkMode: true,

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        sunnahStreak: 0,
        noorPoints: 0,
        prayerLog: [],
        totalDhikrCount: 0,
        user: null,
      }),
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
      setUser: (user: UserState | null) => set({ user }),
      setOnlineStatus: (online: boolean) => set({ isOnline: online }),
      setSyncInfo: (lastSyncAt: string | null, tamperDetected: boolean) =>
        set({ lastSyncAt, tamperDetected }),
      setUserInitiatedSignOut: (val: boolean) => set({ isUserInitiatedSignOut: val }),
      updateProfile: (updates: Partial<UserState>) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
      setDarkMode: (val: boolean) => set({ darkMode: val }),
    }),
    {
      name: 'al-murshid-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
