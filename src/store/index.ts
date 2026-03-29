import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppState {
  hasCompletedOnboarding: boolean;
  userLevel: number;
  sunnahStreak: number;
  completeOnboarding: () => void;
  incrementStreak: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userLevel: 1, // 1: The Seeker
      sunnahStreak: 0,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      incrementStreak: () => set((state) => ({ sunnahStreak: state.sunnahStreak + 1 })),
    }),
    {
      name: 'al-murshid-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
