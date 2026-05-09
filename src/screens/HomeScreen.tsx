import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useAppStore } from '../store';
import { getNextPrayer, getPrayerTimes, detectCalcMethod } from '../utils/prayerTimes';
import { useFatherlyCoach } from '../hooks/useFatherlyCoach';
import { schedulePrayerNotifications } from '../services/notificationService';
import { scheduleSmartReminders } from '../services/smartReminderService';
import { logPrayer as logPrayerService } from '../services/data/prayerService';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { LinearGradient } from 'expo-linear-gradient';
import { flipIcon } from '../utils/rtl';
import dailyHadith from '../data/dailyHadith.json';

const DAILY_HADITH_COUNT = dailyHadith.length;

function getDailyHadith() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dailyHadith[dayOfYear % DAILY_HADITH_COUNT];
}

export default function HomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const { insight } = useFatherlyCoach();

  const [nextPrayer, setNextPrayer] = useState<string>('Loading...');
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [hijriDate, setHijriDate] = useState('');
  const [countdown, setCountdown] = useState('');
  const [prayerTimesList, setPrayerTimesList] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState('');
  const [coord, setCoord] = useState<{ lat: number; lng: number; method: any } | null>(null);

  // Animation Refs
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(20)).current;

  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const slideAnim2 = useRef(new Animated.Value(20)).current;

  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const slideAnim3 = useRef(new Animated.Value(20)).current;

  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    // Staggered Entrance Animations
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim1, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim1, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim2, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim3, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim3, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ])
    ]).start();

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied. Tap to set manually.');
          setIsLoadingLocation(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Auto-detect calculation method from country
        let method: any = 'MuslimWorldLeague';
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (place?.isoCountryCode) {
            method = detectCalcMethod(place.isoCountryCode);
          }
        } catch {}

        const currentNext = getNextPrayer(latitude, longitude, new Date(), method);
        setNextPrayerName(currentNext === 'none' || currentNext === 'sunrise' ? '' : currentNext);
        setNextPrayer(currentNext === 'none' ? 'Isha (Tomorrow)' : currentNext);
        setLocationError(null);

        // Schedule notifications for all prayer times
        const allTimes = getPrayerTimes(latitude, longitude, new Date(), method);
        if (allTimes) {
          schedulePrayerNotifications(allTimes).catch((e) => console.warn('schedulePrayerNotifications failed:', e));
          scheduleSmartReminders(allTimes).catch((e) => console.warn('scheduleSmartReminders failed:', e));
          // Store formatted prayer times for the widget
          const formatted: Record<string, string> = {};
          const labels = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
          for (const key of labels) {
            const d = allTimes[key as keyof typeof allTimes];
            if (d) {
              formatted[key] = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          }
          setPrayerTimesList(formatted);
        }
        setCoord({ lat: latitude, lng: longitude, method });
      } catch (err) {
        console.error("Location error:", err);
        setLocationError('Unable to fetch location. Tap to retry.');
      } finally {
        setIsLoadingLocation(false);
      }
    })();

    // Fetch accurate Hijri date from Aladhan API
    (async () => {
      try {
        const now = new Date();
        const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const res = await fetchWithTimeout(`https://api.aladhan.com/v1/gToH/${dateStr}`);
        const json = await res.json();
        if (json.code === 200) {
          const h = json.data.hijri;
          // Use Arabic month name if language is Arabic
          const monthName = isArabic ? h.month.ar : h.month.en;
          setHijriDate(`${h.day} ${monthName} ${h.year} ${isArabic ? 'هـ' : 'AH'}`);
        }
      } catch {
        // Fallback to Intl if API fails
        const locale = isArabic ? 'ar-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura';
        setHijriDate(new Intl.DateTimeFormat(locale, {
          day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date()));
      }
    })();
  }, []);

  // Countdown timer + current time, updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (coord) {
        const next = getNextPrayer(coord.lat, coord.lng, now, coord.method);
        if (next !== 'none' && next !== 'sunrise') {
          const times = getPrayerTimes(coord.lat, coord.lng, now, coord.method);
          if (times) {
            const nextTime = times[next as keyof typeof times];
            if (nextTime instanceof Date) {
              const diff = nextTime.getTime() - now.getTime();
              if (diff > 0) {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setCountdown(
                  hours > 0
                    ? `${hours}h ${minutes}m ${seconds}s`
                    : `${minutes}m ${seconds}s`
                );
              } else {
                setCountdown(t('home.now'));
              }
            }
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [coord]);

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-amber-400 text-lg font-semibold">{t('greeting')}</Text>
            <Text className="text-white text-3xl font-bold mt-1 tracking-tight">{t('appName')}</Text>
            <Text className="text-emerald-200 text-sm mt-1 font-medium">{hijriDate}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              className="bg-emerald-900/80 w-12 h-12 rounded-full border border-emerald-800 mr-3 items-center justify-center shadow-lg"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={24} color="#fbbf24" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ProgressTracker')}
              className="rounded-full border border-emerald-700/50 shadow-lg overflow-hidden"
            >
              <LinearGradient
                colors={['#065f46', '#022c22']}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="px-4 py-2 flex-row items-center">
                <Ionicons name="flame" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                <Text className="text-amber-300 font-bold text-base">{sunnahStreak}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current State Widget: Spiritual Energy */}
        <Animated.View style={{ opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProgressTracker')}
            className="mb-8 active:opacity-80"
          >
            <View className="flex-row justify-between items-end mb-3">
              <Text className="text-emerald-300 text-sm font-bold uppercase tracking-widest">{t('home.spiritualEnergy')}</Text>
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
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Tools */}
        <Animated.View style={{ opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }} className="mb-8">
          <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4">{t('home.quickTools')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ZakatCalculator')}
              className="w-40 mr-4 rounded-3xl overflow-hidden shadow-lg border border-amber-500/30"
            >
              <LinearGradient
                colors={['#064e3b', '#022c22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="p-4">
                <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mb-3 border border-amber-500/30">
                  <Ionicons name="calculator" size={20} color="#fbbf24" />
                </View>
                <Text className="text-emerald-50 font-bold text-base mb-1">{t('home.zakat')}</Text>
                <Text className="text-emerald-300/80 text-xs font-medium">{t('home.zakatSubtitle')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('HijriCalendar')}
              className="w-40 mr-4 rounded-3xl overflow-hidden shadow-lg border border-teal-700/40"
            >
              <LinearGradient
                colors={['#0f766e', '#042f2e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="p-4">
                <View className="w-10 h-10 rounded-full bg-teal-500/20 items-center justify-center mb-3 border border-teal-500/30">
                  <Ionicons name="calendar" size={20} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-50 font-bold text-base mb-1">{t('home.hijriCalendar')}</Text>
                <Text className="text-emerald-300/80 text-xs font-medium">{t('home.hijriCalendarSubtitle')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Locator')}
              className="w-40 mr-4 rounded-3xl overflow-hidden shadow-lg border border-emerald-700/40"
            >
              <LinearGradient
                colors={['#064e3b', '#022c22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="p-4">
                <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mb-3 border border-emerald-500/30">
                  <Ionicons name="location" size={20} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-50 font-bold text-base mb-1">{t('home.nearby')}</Text>
                <Text className="text-emerald-300/80 text-xs font-medium">{t('home.nearbySubtitle')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('SunnahSleep')}
              className="w-40 mr-4 rounded-3xl overflow-hidden shadow-lg border border-indigo-700/40"
            >
              <LinearGradient
                colors={['#3730a3', '#1e1b4b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="p-4">
                <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mb-3 border border-indigo-500/30">
                  <Ionicons name="moon" size={20} color="#c7d2fe" />
                </View>
                <Text className="text-emerald-50 font-bold text-base mb-1">{t('home.sleepSunnah')}</Text>
                <Text className="text-indigo-300/80 text-xs font-medium">{t('home.sleepSunnahSubtitle')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Ramadan')}
              className="w-40 mr-4 rounded-3xl overflow-hidden shadow-lg border border-amber-500/30"
            >
              <LinearGradient
                colors={['#78350f', '#451a03']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="p-4">
                <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mb-3 border border-amber-500/30">
                  <Ionicons name="star" size={20} color="#fbbf24" />
                </View>
                <Text className="text-emerald-50 font-bold text-base mb-1">{t('tabs.ramadan')}</Text>
                <Text className="text-amber-300/80 text-xs font-medium">{t('home.ramadanSubtitle')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Sadaqah')}
              className="w-40 mr-4 rounded-3xl overflow-hidden shadow-lg border border-green-700/40"
            >
              <LinearGradient
                colors={['#065f46', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="p-4">
                <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mb-3 border border-emerald-500/30">
                  <Ionicons name="gift" size={20} color="#34d399" />
                </View>
                <Text className="text-emerald-50 font-bold text-base mb-1">{t('sadaqah.title')}</Text>
                <Text className="text-emerald-300/80 text-xs font-medium">{t('home.sadaqahSubtitle')}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Prayer Times Widget */}
        <Animated.View style={{ opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }} className="rounded-3xl mb-6 shadow-2xl border border-emerald-700/40 overflow-hidden">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-5">
            {/* Header with next prayer + countdown */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={18} color="#6ee7b7" style={{ marginRight: 6 }} />
                <Text className="text-emerald-300 text-sm font-bold uppercase tracking-widest">{t('home.nextPrayer')}</Text>
              </View>
              <Text className="text-emerald-400/60 text-xs font-mono">{currentTime}</Text>
            </View>

            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#fbbf24" style={{ alignSelf: 'center', marginVertical: 12 }} />
            ) : locationError ? (
              <TouchableOpacity className="bg-red-900/30 p-3 rounded-lg border border-red-800/50 mb-3">
                <Text className="text-red-300 text-xs font-medium text-center">{locationError}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-amber-400 text-3xl font-extrabold capitalize tracking-tight">{nextPrayer}</Text>
                    <Text className="text-emerald-300 text-lg font-bold font-mono mt-1">{countdown}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PrayerTimes')}
                    className="bg-emerald-800/80 w-12 h-12 items-center justify-center rounded-full border border-emerald-700/50"
                    accessibilityLabel="View prayer times"
                  >
                    <Ionicons name={flipIcon('chevron-forward') as any} size={24} color="#6ee7b7" />
                  </TouchableOpacity>
                </View>

                {/* All prayer times */}
                {Object.keys(prayerTimesList).length > 0 && (
                  <View className="rounded-xl bg-emerald-900/40 border border-emerald-800/40 p-3">
                    <Text className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">{t('home.prayerTimes')}</Text>
                    {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
                      const time = prayerTimesList[key];
                      if (!time) return null;
                      const isNext = key === nextPrayer;
                      return (
                        <View key={key} className={`flex-row justify-between items-center py-1.5 ${isNext ? '' : ''}`}>
                          <View className="flex-row items-center">
                            {isNext && <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />}
                            <Text className={`text-sm capitalize ${isNext ? 'text-amber-300 font-bold' : 'text-emerald-200/70'}`}>
                              {key}
                            </Text>
                          </View>
                          <Text className={`text-sm font-mono ${isNext ? 'text-amber-300 font-bold' : 'text-emerald-200/70'}`}>
                            {time}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>

        {/* Daily Hadith */}
        <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }} className="rounded-3xl mb-6 shadow-2xl border border-amber-700/30 relative overflow-hidden">
          <LinearGradient
            colors={['#78350f', '#451a03']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="sunny" size={16} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text className="text-amber-300 text-sm font-bold uppercase tracking-widest">{t('home.dailyHadith')}</Text>
            </View>
            <Text className="text-amber-100 text-right leading-relaxed mb-3" style={{ fontFamily: 'sans-serif', fontSize: 16, lineHeight: 30 }}>
              {getDailyHadith().ar}
            </Text>
            <Text className="text-amber-100/80 text-sm italic leading-relaxed mb-3">
              {getDailyHadith().en}
            </Text>
            <Text className="text-amber-400/60 text-xs font-medium">— {getDailyHadith().source}</Text>
          </View>
        </Animated.View>

        {/* Deen Widget: Verse of the Hour */}
        <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }} className="rounded-3xl mb-6 shadow-2xl border border-teal-700/40 relative overflow-hidden">
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
              <Text className="text-teal-200 text-sm font-bold uppercase tracking-widest">{t('home.verseOfTheHour')}</Text>
            </View>
            <Text className="text-amber-300 text-3xl font-serif text-right leading-relaxed mb-4" style={{ fontFamily: 'sans-serif' }}>
              "إِنَّ مَعَ الْعُسْرِ يُسْرًا"
            </Text>
            <Text className="text-teal-50 text-base italic font-medium leading-relaxed">
              {isArabic ? '(الشرح: 6)' : '"Indeed, with hardship [will be] ease." (94:6)'}
            </Text>
          </View>
        </Animated.View>

        {/* AI Mentor Insight */}
        <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AICoach')}
            className="bg-emerald-900/40 rounded-3xl p-6 mb-8 shadow-lg border border-amber-500/20 active:opacity-80"
          >
            <View className="flex-row items-center mb-3">
              <View className="bg-amber-500/20 p-2 rounded-full mr-3">
                <Ionicons name="chatbubbles-outline" size={20} color="#fbbf24" />
              </View>
              <Text className="text-amber-400 font-bold text-base tracking-wide">{t('home.alMurshidSays')}</Text>
              <View className="flex-1" />
              <Ionicons name={flipIcon('chevron-forward') as any} size={18} color="#fbbf24" />
            </View>
            <Text className="text-emerald-100 text-base italic leading-relaxed font-medium">
              "{insight}"
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Button */}
        <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }}>
          <TouchableOpacity
            onPress={() => nextPrayerName && logPrayerService(nextPrayerName)}
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
              <Text className="text-emerald-950 font-extrabold text-lg tracking-wide">{t('home.logCurrentPrayer')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
