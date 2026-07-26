import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  SessionExpired: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  FajrAlarm: undefined;
  DigitalTasbih: undefined;
  ZakatCalculator: undefined;
  HijriCalendar: undefined;
  AICoach: undefined;
  Muhasabah: undefined;
  ReflectionHistory: undefined;
  Analytics: undefined;
  Locator: undefined;
  PrayerTimes: undefined;
  Settings: undefined;
  KnowledgeDuel: undefined;
  ProgressTracker: undefined;
  SmartAdhkar: undefined;
  SunnahSleep: undefined;
  Ramadan: undefined;
  Sadaqah: undefined;
  GoalsDashboard: undefined;
  ProofOfSalah: undefined;
  CommunityHeatmap: undefined;
  NamesOfAllah: undefined;
  Khatmah: undefined;
  QuranBookmarks: undefined;
  AdhkarCategory: { categoryTitle: string; categoryName: string };
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabParamList = {
  HomeTab: undefined;
  QuranTab: undefined;
  AzkarTab: undefined;
  QiblaTab: undefined;
  SquadsTab: undefined;
};

export type TabScreenProps<T extends keyof TabParamList> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<TabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
