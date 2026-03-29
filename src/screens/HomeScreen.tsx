import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useAppStore } from '../store';
import { getPrayerTimes, getNextPrayer } from '../utils/prayerTimes';
import { useFatherlyCoach } from '../hooks/useFatherlyCoach';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const incrementStreak = useAppStore((state) => state.incrementStreak);
  const { insight } = useFatherlyCoach();
  
  const [nextPrayer, setNextPrayer] = useState<string>('Loading...');
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentNext = getNextPrayer(location.coords.latitude, location.coords.longitude);
      setNextPrayer(currentNext === 'none' ? 'Isha (Tomorrow)' : currentNext);
    })();
  }, []);

  const hijriDate = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <View className="flex-1 bg-emerald-950 px-6 pt-16">
      <StatusBar style="light" />
      {/* Header */}
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-amber-400 text-lg font-semibold">{t('greeting', 'As-salamu alaykum')}</Text>
          <Text className="text-white text-3xl font-bold mt-1">Al-Murshid</Text>
          <Text className="text-emerald-200 text-sm mt-1">{hijriDate}</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.navigate('FajrAlarm')}
            className="bg-emerald-900 w-10 h-10 rounded-full border border-emerald-800 mr-3 items-center justify-center"
          >
            <Text className="text-amber-400 text-lg">⚙️</Text>
          </TouchableOpacity>
          <View className="bg-emerald-900 px-4 py-2 rounded-full border border-emerald-800">
            <Text className="text-amber-300 font-bold">🔥 Streak: {sunnahStreak}</Text>
          </View>
        </View>
      </View>

      {/* Current State Widget: Spiritual Energy */}
      <View className="mb-6">
        <View className="flex-row justify-between items-end mb-2">
          <Text className="text-emerald-300 text-sm font-semibold uppercase tracking-wider">Spiritual Energy</Text>
          <Text className="text-emerald-100 text-xs">{sunnahStreak * 10}%</Text>
        </View>
        <View className="w-full bg-emerald-900 h-2 rounded-full overflow-hidden border border-emerald-800/50">
          <View 
            className="bg-amber-400 h-full rounded-full" 
            style={{ width: `${Math.min(sunnahStreak * 10, 100)}%` }} 
          />
        </View>
      </View>

      {/* Prayer Times Widget */}
      <View className="bg-emerald-900 rounded-3xl p-6 mb-6 shadow-lg border border-emerald-800/50 flex-row justify-between items-center">
        <View>
          <Text className="text-emerald-300 text-sm font-semibold uppercase tracking-wider mb-1">Next Prayer</Text>
          <Text className="text-amber-400 text-3xl font-bold capitalize">{nextPrayer}</Text>
          {locationError && <Text className="text-red-400 text-xs mt-1">{locationError}</Text>}
        </View>
        <TouchableOpacity className="bg-emerald-800 p-3 rounded-full">
          <Text className="text-emerald-100 text-xs">View All</Text>
        </TouchableOpacity>
      </View>

      {/* Deen Widget: Verse of the Hour */}
      <View className="bg-emerald-900 rounded-3xl p-6 mb-6 shadow-lg border border-emerald-800/50">
        <Text className="text-emerald-300 text-sm font-semibold uppercase tracking-wider mb-2">Verse of the Hour</Text>
        <Text className="text-amber-400 text-2xl font-serif text-right leading-loose mb-4" style={{ fontFamily: 'sans-serif' }}>
          "إِنَّ مَعَ الْعُسْرِ يُسْرًا"
        </Text>
        <Text className="text-emerald-100 text-base italic">
          "Indeed, with hardship [will be] ease." (94:6)
        </Text>
      </View>

      {/* AI Mentor Insight */}
      <View className="bg-emerald-800/70 rounded-3xl p-6 mb-6 shadow-lg border justify-center border-amber-500/30">
        <View className="flex-row items-center mb-2">
          <Text className="text-amber-400 text-lg mr-2">👳‍♂️</Text>
          <Text className="text-amber-400 font-bold text-base">Al-Murshid Says...</Text>
        </View>
        <Text className="text-emerald-50 text-base italic leading-relaxed">
          "{insight}"
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        onPress={incrementStreak}
        className="bg-amber-500 rounded-full py-4 items-center shadow-lg active:bg-amber-600 mt-auto mb-12"
      >
        <Text className="text-emerald-950 font-bold text-lg">Log Current Prayer</Text>
      </TouchableOpacity>
    </View>
  );
}
