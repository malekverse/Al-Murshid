import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import QiblaScreen from '../screens/QiblaScreen';
import QuranScreen from '../screens/QuranScreen';
import SquadsScreen from '../screens/SquadsScreen';
import FajrAlarmScreen from '../screens/FajrAlarmScreen';
import { Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#022c22', // bg-emerald-950
          borderTopColor: '#064e3b', // border-emerald-900
        },
        tabBarActiveTintColor: '#fbbf24', // text-amber-400
        tabBarInactiveTintColor: '#a7f3d0', // text-emerald-200
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🕌</Text> 
        }} 
      />
      <Tab.Screen 
        name="QiblaTab" 
        component={QiblaScreen} 
        options={{ 
          tabBarLabel: 'Qibla',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🧭</Text> 
        }} 
      />
      <Tab.Screen 
        name="QuranTab" 
        component={QuranScreen} 
        options={{ 
          tabBarLabel: 'Quran',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📖</Text> 
        }} 
      />
      <Tab.Screen 
        name="SquadsTab" 
        component={SquadsScreen} 
        options={{ 
          tabBarLabel: 'Ummah',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text> 
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
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
