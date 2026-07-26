import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAppStore } from '../store';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import QiblaScreen from '../screens/QiblaScreen';
import QuranScreen from '../screens/QuranScreen';
import SquadsScreen from '../screens/SquadsScreen';
import FajrAlarmScreen from '../screens/FajrAlarmScreen';
import AzkarScreen from '../screens/AzkarScreen';
import DigitalTasbihScreen from '../screens/DigitalTasbihScreen';
import ZakatCalculatorScreen from '../screens/ZakatCalculatorScreen';
import HijriCalendarScreen from '../screens/HijriCalendarScreen';
import AICoachScreen from '../screens/AICoachScreen';
import MuhasabahScreen from '../screens/MuhasabahScreen';
import ReflectionHistoryScreen from '../screens/ReflectionHistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import LocatorScreen from '../screens/LocatorScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import KnowledgeDuelScreen from '../screens/KnowledgeDuelScreen';
import ProgressTrackerScreen from '../screens/ProgressTrackerScreen';
import SmartAdhkarScreen from '../screens/SmartAdhkarScreen';
import SunnahSleepScreen from '../screens/SunnahSleepScreen';
import RamadanScreen from '../screens/RamadanScreen';
import SadaqahScreen from '../screens/SadaqahScreen';
import GoalsDashboardScreen from '../screens/GoalsDashboardScreen';
import ProofOfSalahScreen from '../screens/ProofOfSalahScreen';
import CommunityHeatmapScreen from '../screens/CommunityHeatmapScreen';
import NamesOfAllahScreen from '../screens/NamesOfAllahScreen';
import KhatmahScreen from '../screens/KhatmahScreen';
import QuranBookmarksScreen from '../screens/QuranBookmarksScreen';
import AdhkarCategoryScreen from '../screens/AdhkarCategoryScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';
import ErrorBoundary from '../components/ErrorBoundary';
import OfflineBanner from '../components/OfflineBanner';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, Text, TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function MainTabs() {
  const { t, i18n } = useTranslation();
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      direction={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      screenOptions={{
        swipeEnabled: true,
        tabBarShowIcon: true,
        tabBarStyle: {
          backgroundColor: '#022c22',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#34d399',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'none',
          marginTop: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#fbbf24',
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
        tabBarItemStyle: {
          padding: 0,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="QuranTab"
        component={QuranScreen}
        options={{
          tabBarLabel: t('tabs.quran'),
          tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="AzkarTab"
        component={AzkarScreen}
        options={{
          tabBarLabel: t('tabs.azkar'),
          tabBarIcon: ({ color }) => <Ionicons name="moon" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="QiblaTab"
        component={QiblaScreen}
        options={{
          tabBarLabel: t('tabs.qibla'),
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="SquadsTab"
        component={SquadsScreen}
        options={{
          tabBarLabel: t('tabs.ummah'),
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

function SessionExpiredScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-emerald-950 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-6 border-2 border-amber-500/30">
        <Text className="text-amber-400 text-4xl">!</Text>
      </View>
      <Text className="text-emerald-50 text-xl font-bold text-center mb-3">{t('auth.sessionExpired')}</Text>
      <Text className="text-emerald-300 text-sm text-center mb-8 leading-relaxed">
        {t('auth.sessionExpiredDesc')}
      </Text>
      <TouchableOpacity
        onPress={onContinue}
        className="bg-amber-500 px-8 py-3 rounded-full active:opacity-80"
      >
        <Text className="text-emerald-950 font-bold">{t('auth.continueToLogin')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function RootNavigator() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const user = useAppStore((state) => state.user);
  const prevUser = useRef(user);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (prevUser.current && !user) {
      setSessionExpired(true);
    }
    prevUser.current = user;
  }, [user]);

  if (!hasCompletedOnboarding) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Onboarding">{() => <ScreenWrapper><OnboardingScreen /></ScreenWrapper>}</Stack.Screen>
      </Stack.Navigator>
    );
  }

  if (sessionExpired) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="SessionExpired">
          {() => <ScreenWrapper><SessionExpiredScreen onContinue={() => setSessionExpired(false)} /></ScreenWrapper>}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Group>
          <Stack.Screen name="Login">{() => <ScreenWrapper><LoginScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Register">{() => <ScreenWrapper><RegisterScreen /></ScreenWrapper>}</Stack.Screen>
        </Stack.Group>
      </Stack.Navigator>
    );
  }

  return (
    <View className="flex-1">
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Group>
          <Stack.Screen name="MainTabs">{() => <ScreenWrapper><MainTabs /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="FajrAlarm" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><FajrAlarmScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="DigitalTasbih" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><DigitalTasbihScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="ZakatCalculator" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><ZakatCalculatorScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="HijriCalendar" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><HijriCalendarScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="AICoach" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><AICoachScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Muhasabah" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><MuhasabahScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="ReflectionHistory" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><ReflectionHistoryScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Analytics" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><AnalyticsScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Locator" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><LocatorScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="PrayerTimes" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><PrayerTimesScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Settings" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><SettingsScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="KnowledgeDuel" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><KnowledgeDuelScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="ProgressTracker" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><ProgressTrackerScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="SmartAdhkar" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><SmartAdhkarScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="SunnahSleep" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><SunnahSleepScreen /></ScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Ramadan" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><RamadanScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Sadaqah" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><SadaqahScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="GoalsDashboard" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><GoalsDashboardScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="ProofOfSalah" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><ProofOfSalahScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="CommunityHeatmap" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><CommunityHeatmapScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="NamesOfAllah" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><NamesOfAllahScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Khatmah" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><KhatmahScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="QuranBookmarks" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><QuranBookmarksScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="AdhkarCategory" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><AdhkarCategoryScreen /></ScreenWrapper>}</Stack.Screen>
          <Stack.Screen name="Profile" options={{ presentation: 'modal' }}>{() => <ScreenWrapper><ProfileScreen /></ScreenWrapper>}</Stack.Screen>
        </Stack.Group>
      </Stack.Navigator>
      <OfflineBanner />
    </View>
  );
}
