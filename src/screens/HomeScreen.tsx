import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useAppStore } from '../store';
import { getPrayerTimes, getNextPrayer } from '../utils/prayerTimes';
import { useFatherlyCoach } from '../hooks/useFatherlyCoach';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const incrementStreak = useAppStore((state) => state.incrementStreak);
  const { insight } = useFatherlyCoach();
  
  const [nextPrayer, setNextPrayer] = useState<string>('Loading...');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied. Tap to set manually.');
          setIsLoadingLocation(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const currentNext = getNextPrayer(location.coords.latitude, location.coords.longitude);
        setNextPrayer(currentNext === 'none' ? 'Isha (Tomorrow)' : currentNext);
        setLocationError(null);
      } catch (err) {
        console.error("Location error:", err);
        setLocationError('Unable to fetch location. Tap to retry.');
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  const hijriDate = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-amber-400 text-lg font-semibold">{t('greeting', 'As-salamu alaykum')}</Text>
            <Text className="text-white text-3xl font-bold mt-1 tracking-tight">Al-Murshid</Text>
            <Text className="text-emerald-200 text-sm mt-1 font-medium">{hijriDate}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.navigate('FajrAlarm')}
              className="bg-emerald-900/80 w-12 h-12 rounded-full border border-emerald-800 mr-3 items-center justify-center shadow-lg"
            >
              <Ionicons name="settings-outline" size={24} color="#fbbf24" />
            </TouchableOpacity>
            
            <View className="rounded-full border border-emerald-700/50 shadow-lg overflow-hidden">
              <LinearGradient
                colors={['#065f46', '#022c22']}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="px-4 py-2 flex-row items-center">
                <Ionicons name="flame" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                <Text className="text-amber-300 font-bold text-base">{sunnahStreak}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current State Widget: Spiritual Energy */}
        <View className="mb-8">
          <View className="flex-row justify-between items-end mb-3">
            <Text className="text-emerald-300 text-sm font-bold uppercase tracking-widest">Spiritual Energy</Text>
            <Text className="text-amber-400 font-bold text-sm">{sunnahStreak * 10}%</Text>
          </View>
          <View className="w-full bg-emerald-900/60 h-3 rounded-full overflow-hidden border border-emerald-800">
            <View className="h-full rounded-full overflow-hidden" style={{ width: `${Math.min(sunnahStreak * 10, 100)}%` }}>
              <LinearGradient
                colors={['#f59e0b', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </View>
        </View>

        {/* Prayer Times Widget */}
        <View className="rounded-3xl mb-6 shadow-2xl border border-emerald-700/40 overflow-hidden">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6 flex-row justify-between items-center">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={18} color="#6ee7b7" style={{ marginRight: 6 }} />
                <Text className="text-emerald-300 text-sm font-bold uppercase tracking-widest">Next Prayer</Text>
              </View>
              
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#fbbf24" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
              ) : locationError ? (
                <TouchableOpacity className="mt-1 bg-red-900/30 p-2 rounded-lg border border-red-800/50">
                  <Text className="text-red-300 text-xs font-medium">{locationError}</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-amber-400 text-4xl font-extrabold capitalize tracking-tight">{nextPrayer}</Text>
              )}
            </View>
            <TouchableOpacity className="bg-emerald-800/80 w-12 h-12 items-center justify-center rounded-full border border-emerald-700/50">
              <Ionicons name="chevron-forward" size={24} color="#6ee7b7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Deen Widget: Verse of the Hour */}
        <View className="rounded-3xl mb-6 shadow-2xl border border-teal-700/40 relative overflow-hidden">
          <LinearGradient
            colors={['#0f766e', '#042f2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <Ionicons name="book-outline" size={100} color="rgba(255,255,255,0.03)" style={{ position: 'absolute', right: -20, bottom: -20 }} />
            <View className="flex-row items-center mb-4">
              <Ionicons name="star" size={16} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text className="text-teal-200 text-sm font-bold uppercase tracking-widest">Verse of the Hour</Text>
            </View>
            <Text className="text-amber-300 text-3xl font-serif text-right leading-relaxed mb-4" style={{ fontFamily: 'sans-serif' }}>
              "إِنَّ مَعَ الْعُسْرِ يُسْرًا"
            </Text>
            <Text className="text-teal-50 text-base italic font-medium leading-relaxed">
              "Indeed, with hardship [will be] ease." (94:6)
            </Text>
          </View>
        </View>

        {/* AI Mentor Insight */}
        <View className="bg-emerald-900/40 rounded-3xl p-6 mb-8 shadow-lg border border-amber-500/20">
          <View className="flex-row items-center mb-3">
            <View className="bg-amber-500/20 p-2 rounded-full mr-3">
              <Ionicons name="chatbubbles-outline" size={20} color="#fbbf24" />
            </View>
            <Text className="text-amber-400 font-bold text-base tracking-wide">Al-Murshid Says...</Text>
          </View>
          <Text className="text-emerald-100 text-base italic leading-relaxed font-medium">
            "{insight}"
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          onPress={incrementStreak}
          className="shadow-2xl active:opacity-80 rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="py-4 items-center flex-row justify-center">
            <Ionicons name="checkmark-circle" size={24} color="#022c22" style={{ marginRight: 8 }} />
            <Text className="text-emerald-950 font-extrabold text-lg tracking-wide">Log Current Prayer</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
