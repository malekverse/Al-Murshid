import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPrayerTimes, detectCalcMethod, CALC_METHOD_LABELS } from '../utils/prayerTimes';
import type { CalcMethodKey } from '../utils/prayerTimes';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

interface PrayerTime {
  name: string;
  arabic: string;
  time: Date | null;
  icon: string;
  color: string;
}

export default function PrayerTimesScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [currentPrayer, setCurrentPrayer] = useState('');
  const [calcMethod, setCalcMethod] = useState<CalcMethodKey>('MuslimWorldLeague');
  const [hijriDate, setHijriDate] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError(t('prayerTimes.locationRequired'));
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Reverse geocode for city name & country
        let detectedMethod: CalcMethodKey = 'MuslimWorldLeague';
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (place) {
            setCityName(place.city || place.region || 'Your Location');
            detectedMethod = detectCalcMethod(place.isoCountryCode);
            setCalcMethod(detectedMethod);
          }
        } catch {
          setCityName('Your Location');
        }

        const times = getPrayerTimes(latitude, longitude, new Date(), detectedMethod);
        const now = new Date();

        const prayerList: PrayerTime[] = [
          { name: 'Fajr', arabic: 'الفجر', time: times.fajr, icon: 'moon', color: '#93c5fd' },
          { name: 'Sunrise', arabic: 'الشروق', time: times.sunrise, icon: 'sunny', color: '#fbbf24' },
          { name: 'Dhuhr', arabic: 'الظهر', time: times.dhuhr, icon: 'sunny', color: '#f59e0b' },
          { name: 'Asr', arabic: 'العصر', time: times.asr, icon: 'partly-sunny', color: '#fb923c' },
          { name: 'Maghrib', arabic: 'المغرب', time: times.maghrib, icon: 'cloudy-night', color: '#f97316' },
          { name: 'Isha', arabic: 'العشاء', time: times.isha, icon: 'moon', color: '#c4b5fd' },
        ];

        setPrayers(prayerList);

        // Determine current prayer
        if (now < times.fajr) setCurrentPrayer('');
        else if (now < times.sunrise) setCurrentPrayer('Fajr');
        else if (now < times.dhuhr) setCurrentPrayer('Sunrise');
        else if (now < times.asr) setCurrentPrayer('Dhuhr');
        else if (now < times.maghrib) setCurrentPrayer('Asr');
        else if (now < times.isha) setCurrentPrayer('Maghrib');
        else setCurrentPrayer('Isha');

      } catch (err) {
        setLocationError(t('prayerTimes.locationError'));
      } finally {
        setIsLoading(false);
      }
    })();

    // Fetch accurate Hijri date from Aladhan API
    (async () => {
      try {
        const now = new Date();
        const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
        const json = await res.json();
        if (json.code === 200) {
          const h = json.data.hijri;
          const monthName = i18n.language === 'ar' ? h.month.ar : h.month.en;
          setHijriDate(`${h.day} ${monthName} ${h.year} ${i18n.language === 'ar' ? 'هـ' : 'AH'}`);
        }
      } catch {
        // Fallback to Intl if API fails
        const locale = i18n.language === 'ar' ? 'ar-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura';
        setHijriDate(new Intl.DateTimeFormat(locale, {
          day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date()));
      }
    })();
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const gregorianDate = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('prayerTimes.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>

        {/* Date & Location Header */}
        <View className="rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6 items-center">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location" size={14} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text className="text-amber-400 text-sm font-bold">{cityName || t('loading')}</Text>
            </View>
            <Text className="text-emerald-50 text-lg font-bold mb-1">{hijriDate}</Text>
            <Text className="text-emerald-300/70 text-sm font-medium">{gregorianDate}</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#fbbf24" />
            <Text className="text-emerald-300 mt-4 font-medium">{t('prayerTimes.calculating')}</Text>
          </View>
        ) : locationError ? (
          <View className="items-center py-16 px-4">
            <Ionicons name="location-outline" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
            <Text className="text-emerald-100 text-center text-lg font-medium">{locationError}</Text>
          </View>
        ) : (
          <View>
            {/* Prayer Cards */}
            {prayers.map((prayer, idx) => {
              const isCurrent = prayer.name === currentPrayer;
              const isSunrise = prayer.name === 'Sunrise';

              return (
                <View
                  key={idx}
                  className={`mb-4 rounded-3xl overflow-hidden shadow-lg border ${isCurrent ? 'border-amber-500/50' : 'border-emerald-800/40'}`}
                >
                  <LinearGradient
                    colors={isCurrent ? ['#064e3b', '#0f766e'] : ['#064e3b', '#022c22']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {isCurrent && (
                    <View className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-3xl">
                      <LinearGradient
                        colors={['#f59e0b', '#fbbf24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </View>
                  )}
                  <View className="p-5 flex-row items-center">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 shadow-md border ${isCurrent ? 'bg-amber-500/20 border-amber-500/40' : 'bg-emerald-800/50 border-emerald-700/50'}`}>
                      <Ionicons name={prayer.icon as any} size={22} color={prayer.color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className={`font-bold text-lg ${isCurrent ? 'text-amber-400' : 'text-emerald-50'}`}>
                          {i18n.language === 'ar' ? prayer.arabic : prayer.name}
                        </Text>
                        {isCurrent && (
                          <View className="ml-2 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                            <Text className="text-amber-400 text-[10px] font-bold uppercase">{t('prayerTimes.current')}</Text>
                          </View>
                        )}
                        {isSunrise && (
                          <View className="ml-2 bg-emerald-800/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
                            <Text className="text-emerald-400 text-[10px] font-bold uppercase">{t('prayerTimes.noPrayer')}</Text>
                          </View>
                        )}
                      </View>
                      {i18n.language !== 'ar' && (
                        <Text className="text-emerald-400/60 text-xs font-medium mt-0.5">{prayer.arabic}</Text>
                      )}
                    </View>
                    <Text className={`text-2xl font-extrabold tracking-tight ${isCurrent ? 'text-amber-400' : 'text-emerald-100'}`}>
                      {formatTime(prayer.time)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Calculation Method */}
            <View className="mt-4 items-center">
              <Text className="text-emerald-500/50 text-xs font-medium">{t('prayerTimes.calculation')}: {CALC_METHOD_LABELS[calcMethod]}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
