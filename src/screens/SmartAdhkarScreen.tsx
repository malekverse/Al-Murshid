import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { flipIcon } from '../utils/rtl';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const azkarData = require('../data/azkar.json');

interface ContextualDua {
  id: string;
  context: string;
  trigger: string;
  title: string;
  arabic: string;
  translation: string;
  icon: string;
  color: string;
}

export default function SmartAdhkarScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [speed, setSpeed] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const analyzeContext = async () => {
      // 1. Get Time of Day
      const hour = new Date().getHours();
      let currentPeriod: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
      if (hour >= 5 && hour < 12) currentPeriod = 'morning';
      else if (hour >= 12 && hour < 17) currentPeriod = 'afternoon';
      else if (hour >= 17 && hour < 20) currentPeriod = 'evening';
      else currentPeriod = 'night';

      if (isMounted) setTimeOfDay(currentPeriod);

      // 2. Location & Weather with robust fallback and timeout
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {

          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 3000)
          );

          let loc: any;
          try {
            loc = await Promise.race([locationPromise, timeoutPromise]);
          } catch (error) {
            loc = await Location.getLastKnownPositionAsync();
          }

          if (loc && isMounted) {
            const speedKmh = loc.coords.speed !== null && loc.coords.speed > 0 ? loc.coords.speed * 3.6 : 0;
            setSpeed(speedKmh);

            // Accurate Weather via Open-Meteo (No API Key Required)
            try {
              const weatherRes = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&current_weather=true`);
              const weatherData = await weatherRes.json();
              if (weatherData && weatherData.current_weather && isMounted) {
                setWeatherCode(weatherData.current_weather.weathercode);
              }
            } catch (wErr) {
              console.warn('Weather fetch error:', wErr);
            }
          }
        }
      } catch (e) {
        console.warn('Context analysis error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    analyzeContext();

    return () => {
      isMounted = false;
    };
  }, []);

  const getRandomAdhkar = (category: string) => {
    const list = azkarData[category];
    if (!list) return null;
    const flatList = Array.isArray(list) ? list.flat().filter((i: any) => i && i.content && i.content !== 'stop') : [];
    if (flatList.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * flatList.length);
    return flatList[randomIndex];
  };

  const getSuggestedDuas = (): ContextualDua[] => {
    const suggestions: ContextualDua[] = [];

    // Travel Context (> 20 km/h)
    if (speed !== null && speed > 20) {
      suggestions.push({
        id: 'travel',
        context: 'Movement Detected',
        trigger: `${Math.round(speed)} km/h`,
        title: 'Dua for Traveling',
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
        translation: 'Glory be to Him who has subjected this to us, and we could not have otherwise subdued it.',
        icon: 'car',
        color: '#3b82f6'
      });
    }

    // Weather Context (Rain)
    if (weatherCode >= 51 && weatherCode <= 99) {
      suggestions.push({
        id: 'rain',
        context: 'Weather: Precipitation',
        trigger: 'Current Location',
        title: 'Dua for Rain',
        arabic: 'اللَّهُمَّ صَيِّباً نَافِعاً',
        translation: 'O Allah, (bring) beneficial rain clouds.',
        icon: 'rainy',
        color: '#60a5fa'
      });
    }

    // Time Context pulled directly from accurate azkar.json
    if (timeOfDay === 'morning') {
      const morningAdhkar = getRandomAdhkar('أذكار الصباح');
      if (morningAdhkar) {
        suggestions.push({
          id: 'morning',
          context: 'Time of Day',
          trigger: 'Morning',
          title: 'Morning Adhkar',
          arabic: morningAdhkar.content,
          translation: morningAdhkar.description || 'Authentic Morning Supplication',
          icon: 'partly-sunny',
          color: '#fbbf24'
        });
      }
    } else if (timeOfDay === 'night' || timeOfDay === 'evening') {
      const eveningAdhkar = getRandomAdhkar('أذكار المساء') || getRandomAdhkar('أذكار النوم');
      if (eveningAdhkar) {
        suggestions.push({
          id: 'evening',
          context: 'Time of Day',
          trigger: timeOfDay === 'night' ? 'Night' : 'Evening',
          title: timeOfDay === 'night' ? 'Before Sleep' : 'Evening Adhkar',
          arabic: eveningAdhkar.content,
          translation: eveningAdhkar.description || 'Authentic Evening Supplication',
          icon: 'moon',
          color: '#818cf8'
        });
      }
    }

    // General Context
    if (suggestions.length === 0 || Math.random() > 0.5) {
      const randomTasbih = getRandomAdhkar('تسابيح');
      if (randomTasbih) {
        suggestions.push({
          id: 'tasbih',
          context: 'Spiritual State',
          trigger: 'Daily Remembrance',
          title: 'Virtuous Tasbih',
          arabic: randomTasbih.content,
          translation: randomTasbih.description || 'Words beloved to the Most Merciful.',
          icon: 'heart-half',
          color: '#ec4899'
        });
      }
    }

    return suggestions;
  };

  const suggestions = getSuggestedDuas();

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('smartAdhkar.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>

        <View className="mb-8 mt-2">
          <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">{t('smartAdhkar.contextualAdhkar')}</Text>
          <Text className="text-emerald-200 text-sm mt-2 font-medium leading-relaxed">
            {t('smartAdhkar.description')}
          </Text>
        </View>

        {/* Sensor Status Bar */}
        <View className="flex-row gap-1 mb-8">
          <View className="bg-emerald-900/60 flex-1 p-3 rounded-2xl border border-emerald-800/50 items-center shadow-sm">
            <Ionicons name="speedometer" size={20} color="#6ee7b7" style={{ marginBottom: 4 }} />
            <Text className="text-emerald-400 text-xs font-bold uppercase">{speed !== null ? `${Math.round(speed)} km/h` : t('smartAdhkar.detecting')}</Text>
          </View>
          <View className="bg-emerald-900/60 flex-1 p-3 rounded-2xl border border-emerald-800/50 items-center shadow-sm">
            <Ionicons name="time" size={20} color="#fbbf24" style={{ marginBottom: 4 }} />
            <Text className="text-amber-400 text-xs font-bold uppercase">{timeOfDay}</Text>
          </View>
          <View className="bg-emerald-900/60 flex-1 p-3 rounded-2xl border border-emerald-800/50 items-center shadow-sm">
            <Ionicons name="cloud" size={20} color="#93c5fd" style={{ marginBottom: 4 }} />
            <Text className="text-blue-300 text-xs font-bold uppercase">{weatherCode >= 51 && weatherCode <= 99 ? 'Rain' : 'Clear'}</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#fbbf24" />
            <Text className="text-emerald-300 mt-4 font-medium">{t('smartAdhkar.analyzing')}</Text>
          </View>
        ) : (
          <View className="space-y-6">
            <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-2 px-1">{t('smartAdhkar.suggestedForYou')}</Text>

            {suggestions.map((dua) => (
              <View key={dua.id} className="rounded-3xl shadow-xl border border-emerald-700/40 overflow-hidden mb-6">
                <LinearGradient
                  colors={['#064e3b', '#022c22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Context Badge */}
                <View className="bg-emerald-950/80 px-4 py-2 flex-row items-center justify-between border-b border-emerald-800/50">
                  <View className="flex-row items-center">
                    <Ionicons name={dua.icon as any} size={14} color={dua.color} style={{ marginRight: 6 }} />
                    <Text className="text-emerald-200 text-xs font-bold uppercase tracking-widest">{dua.context}</Text>
                  </View>
                  <Text className="text-emerald-400/80 text-[10px] font-bold">{dua.trigger}</Text>
                </View>

                <View className="p-6">
                  <Text className="text-amber-400 text-lg font-bold mb-6">{dua.title}</Text>

                  <Text className="text-emerald-50 text-2xl text-right leading-loose mb-6" style={{ fontFamily: 'sans-serif' }}>
                    {dua.arabic}
                  </Text>

                  <View className="h-px w-full bg-emerald-800/50 mb-4" />

                  <Text className="text-emerald-300/80 text-sm font-medium leading-relaxed italic text-right">
                    {dua.translation}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
