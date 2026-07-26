import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getDb } from '../store/db';
import { useAppStore } from '../store';
import { getLevel, getLevelTitle } from '../types';
import { getMilestoneProgress } from '../services/data/gamificationService';
import { getBehaviorProfile, getWeeklyReflectionMoodTrend } from '../services/behavioralAnalyticsService';
import { flipIcon } from '../utils/rtl';
import LoadingState from '../components/LoadingState';

interface PrayerStat {
  prayerName: string;
  count: number;
}

interface SleepStat {
  avgHours: number;
  totalLogs: number;
}

interface BehaviorProfile {
  mostConsistentPrayer: string;
  leastConsistentPrayer: string;
  averageSleepHours: number;
  typicalWakeUp: string;
  reflectionFrequency: number;
  overallImanScore: number;
}

interface MoodTrend {
  period: string;
  count: number;
}

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const noorPoints = useAppStore((s) => s.noorPoints);
  const sunnahStreak = useAppStore((s) => s.sunnahStreak);

  const [prayerStats, setPrayerStats] = useState<PrayerStat[]>([]);
  const [totalPrayers, setTotalPrayers] = useState(0);
  const [sleepStat, setSleepStat] = useState<SleepStat>({ avgHours: 0, totalLogs: 0 });
  const [thisWeekPrayers, setThisWeekPrayers] = useState(0);
  const [behaviorProfile, setBehaviorProfile] = useState<BehaviorProfile | null>(null);
  const [moodTrends, setMoodTrends] = useState<MoodTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const level = useMemo(() => getLevel(noorPoints), [noorPoints]);
  const levelTitle = useMemo(() => getLevelTitle(level, i18n.language as 'en' | 'ar'), [level, i18n.language]);
  const milestone = useMemo(() => getMilestoneProgress(), []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const db = getDb();
    try {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const prayerRows: any[] = await db.getAllAsync(
        'SELECT prayerName, COUNT(*) as count FROM prayer_logs GROUP BY prayerName ORDER BY count DESC'
      );
      setPrayerStats(prayerRows);

      const totalRow: any[] = await db.getAllAsync('SELECT COUNT(*) as total FROM prayer_logs');
      setTotalPrayers(totalRow[0]?.total || 0);

      const weekRow: any[] = await db.getAllAsync(
        'SELECT COUNT(*) as total FROM prayer_logs WHERE timestamp > ?', weekAgo
      );
      setThisWeekPrayers(weekRow[0]?.total || 0);

      const sleepRow: any[] = await db.getAllAsync(
        'SELECT AVG(hoursSlept) as avg, COUNT(*) as total FROM sleep_logs'
      );
      if (sleepRow[0]) {
        setSleepStat({ avgHours: sleepRow[0].avg || 0, totalLogs: sleepRow[0].total || 0 });
      }

      setBehaviorProfile(await getBehaviorProfile());
      setMoodTrends(await getWeeklyReflectionMoodTrend());
    } catch (e) {
      console.warn('loadStats failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerColors = ['#f59e0b', '#6ee7b7', '#93c5fd', '#fbbf24', '#fca5a5'];

  if (loading) {
    return <LoadingState message={t('misc.loadingData')} />;
  }

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Go back">
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('analytics.title')}</Text>
        <TouchableOpacity onPress={loadStats} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={20} color="#6ee7b7" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        {/* Level Progress */}
        <View className="rounded-3xl border border-amber-500/20 overflow-hidden mb-6">
          <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-emerald-200 text-sm font-bold uppercase tracking-widest">{t('analytics.levelProgress')}</Text>
              <Text className="text-amber-400 font-bold">{levelTitle}</Text>
            </View>
            <View className="w-full bg-emerald-900/60 h-3 rounded-full overflow-hidden border border-emerald-800 mb-2">
              <View className="h-full rounded-full overflow-hidden" style={{ width: ((milestone.progress * 100).toFixed(0) + '%') as any }}>
                <LinearGradient colors={['#f59e0b', '#fbbf24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              </View>
            </View>
            <Text className="text-emerald-400/60 text-xs text-center">
              {noorPoints} / {milestone.next} {t('analytics.noor')} • {t('analytics.nextLevelAt', { points: milestone.next })}
            </Text>
          </View>
        </View>

        {/* Prayer Stats */}
        <View className="rounded-3xl border border-emerald-800/40 overflow-hidden mb-6">
          <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-emerald-200 text-sm font-bold uppercase tracking-widest">{t('analytics.prayerAnalytics')}</Text>
              <Text className="text-amber-400 font-bold">{totalPrayers} {t('analytics.total')}</Text>
            </View>
            <View className="flex-row items-center justify-between mb-4 bg-emerald-900/40 p-3 rounded-2xl border border-emerald-800/50">
              <Text className="text-emerald-300 text-sm font-medium">{t('analytics.thisWeek')}</Text>
              <Text className="text-white font-bold text-lg">{thisWeekPrayers}</Text>
            </View>
            {prayerStats.length === 0 ? (
              <View className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-800/40">
                <Text className="text-emerald-400/60 text-sm text-center">{t('misc.noData')}</Text>
              </View>
            ) : prayerNames.map((name, idx) => {
              const stat = prayerStats.find((s) => s.prayerName.toLowerCase() === name);
              const maxCount = Math.max(...prayerStats.map(s => s.count), 1);
              const barWidth = stat ? (stat.count / maxCount) * 100 : 0;
              return (
                <View key={name} className="flex-row items-center mb-3">
                  <Text className="text-emerald-300 text-sm font-medium w-20 capitalize">{name}</Text>
                  <View className="flex-1 h-5 bg-emerald-900/60 rounded-full overflow-hidden mx-2 border border-emerald-800/50">
                    <View style={{ width: (barWidth + '%') as any, backgroundColor: prayerColors[idx] }} className="h-full rounded-full" />
                  </View>
                  <Text className="text-emerald-100 text-sm font-bold w-8 text-right">{stat?.count || 0}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Behavioral Profile */}
        {behaviorProfile && (
          <View className="rounded-3xl border border-teal-800/40 overflow-hidden mb-6">
            <LinearGradient colors={['#0f766e', '#042f2e']} style={StyleSheet.absoluteFillObject} />
            <View className="p-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="analytics" size={20} color="#6ee7b7" style={{ marginRight: 8 }} />
                <Text className="text-teal-200 text-sm font-bold uppercase tracking-widest">{t('analytics.behavioralProfile')}</Text>
              </View>

              {/* Iman Score Gauge */}
              <View className="bg-teal-900/40 p-4 rounded-2xl border border-teal-800/50 mb-4 items-center">
                <Text className="text-teal-300 text-xs font-medium uppercase tracking-wider mb-2">{t('analytics.imanScore')}</Text>
                <View className="w-full bg-teal-900/60 h-4 rounded-full overflow-hidden border border-teal-800 mb-1">
                  <View className="h-full rounded-full overflow-hidden" style={{ width: (behaviorProfile.overallImanScore + '%') as any }}>
                    <LinearGradient colors={['#6ee7b7', '#34d399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                  </View>
                </View>
                <Text className="text-teal-300 text-lg font-bold">{behaviorProfile.overallImanScore}%</Text>
              </View>

              {/* Profile Grid */}
              <View className="flex-row flex-wrap">
                <View className="w-1/2 pr-2 mb-3">
                  <View className="bg-teal-900/30 p-3 rounded-xl border border-teal-800/40">
                    <Text className="text-teal-400/70 text-xs mb-1">{t('analytics.bestPrayer')}</Text>
                    <Text className="text-white font-bold capitalize">{behaviorProfile.mostConsistentPrayer}</Text>
                  </View>
                </View>
                <View className="w-1/2 pl-2 mb-3">
                  <View className="bg-teal-900/30 p-3 rounded-xl border border-teal-800/40">
                    <Text className="text-teal-400/70 text-xs mb-1">{t('analytics.needsWork')}</Text>
                    <Text className="text-amber-300 font-bold capitalize">{behaviorProfile.leastConsistentPrayer}</Text>
                  </View>
                </View>
                <View className="w-1/2 pr-2 mb-3">
                  <View className="bg-teal-900/30 p-3 rounded-xl border border-teal-800/40">
                    <Text className="text-teal-400/70 text-xs mb-1">{t('analytics.avgSleep')}</Text>
                    <Text className="text-white font-bold">{behaviorProfile.averageSleepHours.toFixed(1)}h</Text>
                  </View>
                </View>
                <View className="w-1/2 pl-2 mb-3">
                  <View className="bg-teal-900/30 p-3 rounded-xl border border-teal-800/40">
                    <Text className="text-teal-400/70 text-xs mb-1">{t('analytics.wakeUp')}</Text>
                    <Text className="text-white font-bold">{behaviorProfile.typicalWakeUp}</Text>
                  </View>
                </View>
              </View>

              {/* Reflection Trend */}
              {moodTrends.length > 0 && (
                <View className="bg-teal-900/30 p-3 rounded-xl border border-teal-800/40 mt-1">
                  <Text className="text-teal-400/70 text-xs mb-2">Reflections (4 weeks)</Text>
                  <View className="flex-row items-end justify-between h-16">
                    {moodTrends.map((t, i) => {
                      const maxCount = Math.max(...moodTrends.map(m => m.count), 1);
                      const barHeight = (t.count / maxCount) * 100;
                      return (
                        <View key={i} className="items-center flex-1">
                          <Text className="text-teal-300 text-xs mb-1">{t.count}</Text>
                          <View className="w-full mx-1 bg-teal-500/30 rounded-t-md border border-teal-500/40" style={{ height: Math.max(barHeight * 0.6, 4) + '%' as any }} />
                          <Text className="text-teal-400/60 text-[10px] mt-1">{t.period.replace('Week ', 'W')}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Sleep Stats */}
        <View className="rounded-3xl border border-indigo-800/40 overflow-hidden mb-6">
          <LinearGradient colors={['#312e81', '#1e1b4b']} style={StyleSheet.absoluteFillObject} />
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="moon" size={20} color="#c7d2fe" style={{ marginRight: 8 }} />
              <Text className="text-indigo-200 text-sm font-bold uppercase tracking-widest">{t('analytics.sleepAnalytics')}</Text>
            </View>
            {sleepStat.totalLogs > 0 ? (
              <>
                <View className="flex-row gap-2 mb-3">
                  <View className="flex-1 bg-indigo-900/40 p-4 rounded-2xl border border-indigo-800/50 items-center">
                    <Text className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">{t('analytics.avgHours')}</Text>
                    <Text className="text-white font-bold text-2xl">{sleepStat.avgHours.toFixed(1)}</Text>
                  </View>
                  <View className="flex-1 bg-indigo-900/40 p-4 rounded-2xl border border-indigo-800/50 items-center">
                    <Text className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">{t('analytics.nightsLogged')}</Text>
                    <Text className="text-white font-bold text-2xl">{sleepStat.totalLogs}</Text>
                  </View>
                </View>
                <View className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-800/40 flex-row items-center">
                  <Ionicons name={sleepStat.avgHours >= 7 ? 'checkmark-circle' : 'alert-circle'} size={18} color={sleepStat.avgHours >= 7 ? '#6ee7b7' : '#fbbf24'} style={{ marginRight: 8 }} />
                  <Text className="text-indigo-200/80 text-sm">{sleepStat.avgHours >= 7 ? t('analytics.aboveTarget') : t('analytics.belowTarget')}</Text>
                </View>
              </>
            ) : (
              <Text className="text-indigo-400/60 text-sm text-center py-4">{t('analytics.noSleepData')}</Text>
            )}
          </View>
        </View>

        {/* Quick Stats Row */}
        <View className="flex-row space-x-4 mb-6">
          <View className="flex-1 bg-emerald-900/40 p-5 rounded-3xl border border-emerald-800/50 items-center">
            <Ionicons name="flame" size={24} color="#fbbf24" style={{ marginBottom: 6 }} />
            <Text className="text-amber-400 font-bold text-xl">{sunnahStreak}</Text>
            <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('analytics.streak')}</Text>
          </View>
          <View className="flex-1 bg-emerald-900/40 p-5 rounded-3xl border border-emerald-800/50 items-center">
            <Ionicons name="star" size={24} color="#fbbf24" style={{ marginBottom: 6 }} />
            <Text className="text-amber-400 font-bold text-xl">{noorPoints}</Text>
            <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('analytics.noor')}</Text>
          </View>
          <View className="flex-1 bg-emerald-900/40 p-5 rounded-3xl border border-emerald-800/50 items-center">
            <Ionicons name="analytics" size={24} color="#fbbf24" style={{ marginBottom: 6 }} />
            <Text className="text-amber-400 font-bold text-xl">{level}</Text>
            <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('analytics.level')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
