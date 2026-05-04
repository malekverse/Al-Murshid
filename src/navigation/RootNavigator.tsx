import React from 'react';
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
import LocatorScreen from '../screens/LocatorScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import KnowledgeDuelScreen from '../screens/KnowledgeDuelScreen';
import ProgressTrackerScreen from '../screens/ProgressTrackerScreen';
import SmartAdhkarScreen from '../screens/SmartAdhkarScreen';
import SunnahSleepScreen from '../screens/SunnahSleepScreen';
import ProofOfSalahScreen from '../screens/ProofOfSalahScreen';
import CommunityHeatmapScreen from '../screens/CommunityHeatmapScreen';
import NamesOfAllahScreen from '../screens/NamesOfAllahScreen';
import KhatmahScreen from '../screens/KhatmahScreen';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarShowIcon: true,
        tabBarStyle: {
          backgroundColor: '#022c22', // bg-emerald-950
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
        tabBarActiveTintColor: '#fbbf24', // text-amber-400
        tabBarInactiveTintColor: '#34d399', // text-emerald-400
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'none',
          marginTop: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#fbbf24', // text-amber-400
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
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="QuranTab"
        component={QuranScreen}
        options={{
          tabBarLabel: 'Quran',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="AzkarTab"
        component={AzkarScreen}
        options={{
          tabBarLabel: 'Azkar',
          tabBarIcon: ({ color }) => <Ionicons name="moon" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="QiblaTab"
        component={QiblaScreen}
        options={{
          tabBarLabel: 'Qibla',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="SquadsTab"
        component={SquadsScreen}
        options={{
          tabBarLabel: 'Ummah',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="FajrAlarm" component={FajrAlarmScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="DigitalTasbih" component={DigitalTasbihScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="ZakatCalculator" component={ZakatCalculatorScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="HijriCalendar" component={HijriCalendarScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AICoach" component={AICoachScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Muhasabah" component={MuhasabahScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Locator" component={LocatorScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="KnowledgeDuel" component={KnowledgeDuelScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="ProgressTracker" component={ProgressTrackerScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="SmartAdhkar" component={SmartAdhkarScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="SunnahSleep" component={SunnahSleepScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="ProofOfSalah" component={ProofOfSalahScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="CommunityHeatmap" component={CommunityHeatmapScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="NamesOfAllah" component={NamesOfAllahScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Khatmah" component={KhatmahScreen} options={{ presentation: 'modal' }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
