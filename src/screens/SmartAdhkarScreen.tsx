import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

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
  const navigation = useNavigation<any>();
  const [speed, setSpeed] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(800); // 800 is clear sky
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. Get Time of Day
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay('morning');
      else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
      else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
      else setTimeOfDay('night');

      // 2. Get Location/Speed
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          // Speed is in m/s, convert to km/h
          const speedKmh = loc.coords.speed !== null && loc.coords.speed > 0 ? loc.coords.speed * 3.6 : 0;
          setSpeed(speedKmh);
          
          // Mocking weather based on random chance since we don't have a weather API key here
          // In a real app, we'd reverse geocode and call OpenWeatherMap
          const randomWeather = Math.random() > 0.8 ? 500 : 800; // 20% chance of rain (500)
          setWeatherCode(randomWeather);
        }
      } catch (e) {
        console.warn('Location error in Smart Adhkar:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
        color: '#3b82f6' // blue
      });
    }

    // Weather Context (Rain)
    if (weatherCode >= 500 && weatherCode <= 531) {
      suggestions.push({
        id: 'rain',
        context: 'Weather: Raining',
        trigger: 'Current Location',
        title: 'Dua for Rain',
        arabic: 'اللَّهُمَّ صَيِّباً نَافِعاً',
        translation: 'O Allah, (bring) beneficial rain clouds.',
        icon: 'rainy',
        color: '#60a5fa' // light blue
      });
    }

    // Time Context
    if (timeOfDay === 'morning') {
      suggestions.push({
        id: 'morning',
        context: 'Time of Day',
        trigger: 'Morning',
        title: 'Morning Adhkar',
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
        translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
        icon: 'partly-sunny',
        color: '#fbbf24' // amber
      });
    } else if (timeOfDay === 'night' || timeOfDay === 'evening') {
      suggestions.push({
        id: 'evening',
        context: 'Time of Day',
        trigger: 'Evening',
        title: 'Evening Adhkar',
        arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
        translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.',
        icon: 'moon',
        color: '#818cf8' // indigo
      });
    }

    // General Context (Always show at least one)
    if (suggestions.length === 0 || Math.random() > 0.5) {
      suggestions.push({
        id: 'anxiety',
        context: 'Spiritual State',
        trigger: 'For Peace of Mind',
        title: 'Dua for Distress',
        arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
        translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
        icon: 'heart-half',
        color: '#ec4899' // pink
      });
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
        >
          <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">Smart Engine</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        
        <View className="mb-8 mt-2">
          <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">Contextual Adhkar</Text>
          <Text className="text-emerald-200 text-sm mt-2 font-medium leading-relaxed">
            Al-Murshid detects your environment to suggest the exact words of the Prophet ﷺ for your current moment.
          </Text>
        </View>

        {/* Sensor Status Bar */}
        <View className="flex-row justify-between mb-8">
          <View className="bg-emerald-900/60 flex-1 p-3 rounded-2xl border border-emerald-800/50 items-center mr-2 shadow-sm">
            <Ionicons name="speedometer" size={20} color="#6ee7b7" style={{ marginBottom: 4 }} />
            <Text className="text-emerald-400 text-xs font-bold uppercase">{speed !== null ? `${Math.round(speed)} km/h` : 'Detecting...'}</Text>
          </View>
          <View className="bg-emerald-900/60 flex-1 p-3 rounded-2xl border border-emerald-800/50 items-center mx-1 shadow-sm">
            <Ionicons name="time" size={20} color="#fbbf24" style={{ marginBottom: 4 }} />
            <Text className="text-amber-400 text-xs font-bold uppercase">{timeOfDay}</Text>
          </View>
          <View className="bg-emerald-900/60 flex-1 p-3 rounded-2xl border border-emerald-800/50 items-center ml-2 shadow-sm">
            <Ionicons name="cloud" size={20} color="#93c5fd" style={{ marginBottom: 4 }} />
            <Text className="text-blue-300 text-xs font-bold uppercase">{weatherCode >= 500 && weatherCode < 600 ? 'Rain' : 'Clear'}</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#fbbf24" />
            <Text className="text-emerald-300 mt-4 font-medium">Analyzing environment...</Text>
          </View>
        ) : (
          <View className="space-y-6">
            <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-2 px-1">Suggested for You</Text>
            
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
                  
                  <Text className="text-emerald-300/80 text-sm font-medium leading-relaxed italic">
                    "{dua.translation}"
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
