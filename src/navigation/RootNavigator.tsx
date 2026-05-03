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
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#022c22', // bg-emerald-950
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#fbbf24', // text-amber-400
        tabBarInactiveTintColor: '#34d399', // text-emerald-400
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="QiblaTab" 
        component={QiblaScreen} 
        options={{ 
          tabBarLabel: 'Qibla',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="QuranTab" 
        component={QuranScreen} 
        options={{ 
          tabBarLabel: 'Quran',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="SquadsTab" 
        component={SquadsScreen} 
        options={{ 
          tabBarLabel: 'Ummah',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
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
