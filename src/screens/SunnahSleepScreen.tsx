import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, LayoutAnimation, UIManager, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { flipIcon } from '../utils/rtl';
import { logSleep } from '../services/data/sleepService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SleepHabit {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  hadithAr: string;
  hadithEn: string;
  source: string;
}

export default function SunnahSleepScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  
  // Sleep Logger State
  const [hoursSlept, setHoursSlept] = useState(6.5);
  const isShortSleep = hoursSlept < 7;
  
  // Qailulah Timer State
  const [isQailulahTime, setIsQailulahTime] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes

  // Habit Expansion
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  // Animation for progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const hour = new Date().getHours();
    setIsQailulahTime(hour >= 12 && hour <= 16); // Approx Dhuhr to Asr
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const [habits, setHabits] = useState<SleepHabit[]>([
    { 
      id: '1', title: 'Wudu Before Bed', subtitle: 'Purification before sleep', completed: false,
      hadithAr: 'إِذَا أَخَذْتَ مَضْجَعَكَ فَتَوَضَّأْ وُضُوءَكَ لِلصَّلَاةِ',
      hadithEn: '"Whenever you go to bed, perform ablution like that for the prayer."',
      source: 'Sahih al-Bukhari 247'
    },
    { 
      id: '2', title: 'Dusting the Bed', subtitle: '3 times with the edge of garment', completed: false,
      hadithAr: 'إِذَا أَوَى أَحَدُكُمْ إِلَى فِرَاشِهِ فَلْيَنْفُضْ فِرَاشَهُ بِدَاخِلَةِ إِزَارِهِ',
      hadithEn: '"When anyone of you goes to bed, he should shake out his bed with the inside of his lower garment..."',
      source: 'Sahih al-Bukhari 6320'
    },
    { 
      id: '3', title: 'Ayatul Kursi', subtitle: 'Protection through the night', completed: false,
      hadithAr: 'مَنْ قَرَأَ آيَةَ الْكُرْسِيِّ... لَمْ يَقْرَبْهُ شَيْطَانٌ حَتَّى يُصْبِحَ',
      hadithEn: '"Whoever recites Ayatul Kursi... no devil will come near him until morning."',
      source: 'Sahih al-Bukhari 2311'
    },
    { 
      id: '4', title: 'Surah Al-Mulk', subtitle: 'Protection from grave trials', completed: false,
      hadithAr: 'سُورَةٌ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ... هِيَ الْمَانِعَةُ',
      hadithEn: '"Surah Al-Mulk is the protector from the torment of the grave."',
      source: 'Sunan al-Tirmidhi 2890'
    },
    { 
      id: '5', title: 'Right Side', subtitle: 'Sleep on your right side', completed: false,
      hadithAr: 'ثُمَّ اضْطَجِعْ عَلَى شِقِّكَ الْأَيْمَنِ',
      hadithEn: '"Then lie on your right side."',
      source: 'Sahih al-Bukhari 247'
    },
  ]);

  const toggleHabit = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newHabits = habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
    setHabits(newHabits);
  };

  const expandHabit = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedHabitId(expandedHabitId === id ? null : id);
  };

  const changeSleep = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHoursSlept(prev => Math.max(0, Math.min(24, prev + amount)));
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!timerActive && timeLeft === 0) setTimeLeft(20 * 60); // Reset if finished
    setTimerActive(!timerActive);
  };

  // Check if running inside Expo Go (native modules not available)
  const isExpoGo = (() => {
    try {
      const Constants = require('expo-constants').default;
      return Constants?.executionEnvironment === 'storeClient' || !!Constants?.expoGoConfig;
    } catch {
      return false;
    }
  })();

  const syncSleepData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isExpoGo) {
      Alert.alert(t('sleep.customBuildTitle'), t('sleep.customBuildDesc'), [{ text: "OK" }]);
      return;
    }
    
    if (Platform.OS === 'ios') {
      try {
        const AppleHealthKit = require('react-native-health').default;
        const permissions = {
          permissions: {
            read: [AppleHealthKit.Constants.Permissions.SleepAnalysis],
            write: [],
          },
        };
        
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            Alert.alert(t('sleep.permissionDenied'));
            return;
          }
          
          const yesterday = new Date();
          yesterday.setHours(yesterday.getHours() - 24);
          
          const options = {
            startDate: yesterday.toISOString(),
            endDate: new Date().toISOString(),
          };
          
          AppleHealthKit.getSleepSamples(options, (err: Object, results: any[]) => {
            if (err) {
              Alert.alert(t('sleep.fetchError'));
              return;
            }
            if (results && results.length > 0) {
              let totalMinutes = 0;
              results.forEach((sample: any) => {
                 if (sample.value === 'ASLEEP') {
                   const start = new Date(sample.startDate).getTime();
                   const end = new Date(sample.endDate).getTime();
                   totalMinutes += (end - start) / (1000 * 60);
                 }
              });
              if (totalMinutes > 0) {
                 setHoursSlept(totalMinutes / 60);
                 Alert.alert(t('sleep.imported', { hours: (totalMinutes / 60).toFixed(1), source: 'Apple Health' }));
              } else {
                 Alert.alert(t('sleep.noData'));
              }
            } else {
              Alert.alert(t('sleep.noData'));
            }
          });
        });
      } catch (e) {
        Alert.alert(t('sleep.nativeBuildRequired', { platform: 'ios' }));
      }
    } else if (Platform.OS === 'android') {
      try {
        const { initialize, requestPermission, readRecords } = require('react-native-health-connect');
        const isInitialized = await initialize();
        if (!isInitialized) {
           Alert.alert(t('sleep.healthConnectNotFound'));
           return;
        }
        
        await requestPermission([{ accessType: 'read', recordType: 'SleepSession' }]);
        
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const result = await readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: yesterday.toISOString(),
            endTime: new Date().toISOString(),
          }
        });
        
        if (result.records && result.records.length > 0) {
          let totalMinutes = 0;
          result.records.forEach((record: any) => {
             const start = new Date(record.startTime).getTime();
             const end = new Date(record.endTime).getTime();
             totalMinutes += (end - start) / (1000 * 60);
          });
          setHoursSlept(totalMinutes / 60);
          Alert.alert(t('sleep.imported', { hours: (totalMinutes / 60).toFixed(1), source: 'Health Connect' }));
        } else {
          Alert.alert(t('sleep.noData'));
        }
      } catch (e) {
        Alert.alert(t('sleep.nativeBuildRequired', { platform: 'android' }));
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const completedCount = habits.filter(h => h.completed).length;
  const progress = habits.length > 0 ? completedCount / habits.length : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false, // width/flex animation doesn't support native driver well
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

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
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('sleep.title')}</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Sleep tracker">
          <Ionicons name="moon" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        
        {/* Sleep Tracker Widget */}
        <View className={`rounded-3xl p-6 mb-8 shadow-2xl border relative overflow-hidden ${isShortSleep ? 'border-amber-500/40' : 'border-emerald-700/40'}`}>
          <LinearGradient
            colors={isShortSleep ? ['#78350f', '#451a03'] : ['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="moon" size={100} color="rgba(251, 191, 36, 0.05)" style={{ position: 'absolute', right: -20, top: -20 }} />
          
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold tracking-wide">{t('sleep.log')}</Text>
            <TouchableOpacity onPress={syncSleepData} className="bg-emerald-800/80 px-3 py-1.5 rounded-xl border border-emerald-600 flex-row items-center">
              <Ionicons name="sync" size={14} color="#6ee7b7" style={{ marginRight: 4 }} />
              <Text className="text-emerald-100 text-xs font-bold">{t('sleep.sync')}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between mb-6 bg-black/20 rounded-2xl p-2 border border-white/10">
            <TouchableOpacity onPress={() => changeSleep(-0.5)} className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center">
              <Ionicons name="remove" size={24} color="#fbbf24" />
            </TouchableOpacity>
            
            <View className="items-center">
              <Text className="text-amber-400 text-4xl font-extrabold">{hoursSlept.toFixed(1)}</Text>
              <Text className="text-emerald-200/80 text-xs font-bold uppercase tracking-widest">{t('sleep.hours')}</Text>
            </View>

            <TouchableOpacity onPress={() => changeSleep(0.5)} className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center">
              <Ionicons name="add" size={24} color="#fbbf24" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => logSleep(hoursSlept)}
            className="bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-full items-center mb-4"
          >
            <Text className="text-amber-400 text-xs font-bold">{t('sleep.saveSleep', { points: Math.round(hoursSlept) })}</Text>
          </TouchableOpacity>

          {isShortSleep ? (
            <View className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 mb-4">
              <View className="flex-row items-start mb-2">
                <Ionicons name="alert-circle" size={18} color="#fbbf24" style={{ marginRight: 8, marginTop: 2 }} />
                <Text className="text-amber-300 font-bold flex-1 text-base">{t('sleep.deficit')}</Text>
              </View>
              <Text className="text-amber-100/80 text-sm leading-relaxed">
                {t('sleep.deficitDesc')}
              </Text>
            </View>
          ) : (
            <View className="bg-teal-500/10 p-4 rounded-2xl border border-teal-500/30 mb-4 flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="#6ee7b7" style={{ marginRight: 12 }} />
              <Text className="text-teal-200 font-medium flex-1">{t('sleep.healthy')}</Text>
            </View>
          )}

          {/* Qailulah Timer */}
          {(isQailulahTime || isShortSleep) && (
            <View className="bg-black/30 rounded-2xl p-4 border border-emerald-500/20 items-center mt-2">
              <Text className="text-emerald-300/80 text-xs font-bold uppercase tracking-widest mb-3">{t('sleep.timer')}</Text>
              
              <Text className="text-white text-5xl font-mono tracking-widest font-light mb-4">
                {formatTime(timeLeft)}
              </Text>

              <TouchableOpacity 
                onPress={toggleTimer}
                className={`w-full py-3 rounded-xl items-center shadow-lg flex-row justify-center ${timerActive ? 'bg-red-900/80 border border-red-700' : 'bg-amber-500 border border-amber-400'}`}
              >
                <Ionicons name={timerActive ? 'pause' : 'play'} size={20} color={timerActive ? '#fca5a5' : '#78350f'} style={{ marginRight: 8 }} />
                <Text className={`font-bold text-base ${timerActive ? 'text-red-200' : 'text-amber-950'}`}>
                  {timerActive ? t('sleep.pause') : timeLeft === 0 ? t('sleep.restart') : t('sleep.start')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Evening Routine Checklist */}
        <View className="mb-6">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('sleep.sunnahs')}</Text>
            <View className="bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-800">
              <Text className="text-emerald-400 text-sm font-bold">{completedCount} / {habits.length}</Text>
            </View>
          </View>

          {/* Animated Progress Bar */}
          <View className="w-full h-2.5 bg-emerald-900/80 rounded-full mb-6 overflow-hidden border border-emerald-800">
            <Animated.View 
              className="h-full rounded-full"
              style={{ width: progressWidth, backgroundColor: '#34d399' }}
            />
          </View>

          <View className="space-y-3">
            {habits.map((habit) => {
              const isExpanded = expandedHabitId === habit.id;
              
              return (
                <View key={habit.id} className={`rounded-2xl border overflow-hidden shadow-sm ${habit.completed ? 'bg-teal-900/40 border-teal-700/50' : 'bg-emerald-900/40 border-emerald-800/50'}`}>
                  <TouchableOpacity
                    onPress={() => toggleHabit(habit.id)}
                    className="p-4 flex-row items-center"
                  >
                    <View className={`w-7 h-7 rounded-full border items-center justify-center mr-4 shadow-sm ${habit.completed ? 'bg-teal-500 border-teal-400' : 'bg-emerald-950 border-emerald-600'}`}>
                      {habit.completed && <Ionicons name="checkmark" size={18} color="#042f2e" />}
                    </View>
                    <View className="flex-1 mr-2">
                      <Text className={`font-bold text-base tracking-wide ${habit.completed ? 'text-teal-100' : 'text-emerald-50'}`}>
                        {habit.title}
                      </Text>
                      <Text className={`text-xs mt-0.5 font-medium ${habit.completed ? 'text-teal-300/70' : 'text-emerald-400/60'}`}>
                        {habit.subtitle}
                      </Text>
                    </View>
                    
                    <TouchableOpacity onPress={() => expandHabit(habit.id)} className="p-2 bg-black/20 rounded-full">
                      <Ionicons name={isExpanded ? "chevron-up" : "information"} size={16} color={habit.completed ? '#5eead4' : '#6ee7b7'} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Expanded Hadith Content */}
                  {isExpanded && (
                    <View className={`px-4 pb-5 pt-1 border-t ${habit.completed ? 'border-teal-800/30' : 'border-emerald-800/30'}`}>
                      <Text className="text-amber-400 text-lg text-right font-medium leading-loose mb-3 mt-2" style={{ fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'sans-serif' }}>
                        {habit.hadithAr}
                      </Text>
                      <Text className="text-emerald-100/90 text-sm leading-relaxed italic mb-3">
                        {habit.hadithEn}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="book" size={12} color="#6ee7b7" style={{ marginRight: 6 }} />
                        <Text className="text-emerald-400/70 text-xs font-bold uppercase tracking-widest">
                          {habit.source}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
