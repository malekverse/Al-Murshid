import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '../store';
import { getLevelTitle, LEVEL_MILESTONES } from '../types';
import { getDailyGoal, saveDailyGoal, getTodayProgress, getWeekProgress, DailyGoal, DayProgress } from '../services/data/goalsService';
import { flipIcon } from '../utils/rtl';

export default function GoalsDashboardScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const sunnahStreak = useAppStore((s) => s.sunnahStreak);
  const noorPoints = useAppStore((s) => s.noorPoints);
  const userLevel = useAppStore((s) => s.userLevel);
  const totalDhikrCount = useAppStore((s) => s.totalDhikrCount);

  const [todayProgress, setTodayProgress] = useState<DayProgress | null>(null);
  const [weekData, setWeekData] = useState<DayProgress[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalInputs, setGoalInputs] = useState({ prayers: '5', dhikr: '100', quran: '1', sadaqah: '0', sleep: '7' });
  const [loading, setLoading] = useState(true);

  const lang = i18n.language as 'en' | 'ar';

  useFocusEffect(useCallback(() => {
    loadAll();
  }, []));

  const loadAll = async () => {
    setLoading(true);
    try {
      const [progress, week, goal] = await Promise.all([
        getTodayProgress(),
        getWeekProgress(7),
        getDailyGoal(new Date().toISOString().split('T')[0]),
      ]);
      setTodayProgress(progress);
      setWeekData(week);
      setDailyGoal(goal);
    } catch {}
    setLoading(false);
  };

  const handleSaveGoals = async () => {
    const today = new Date().toISOString().split('T')[0];
    await saveDailyGoal({
      date: today,
      target_prayers: parseInt(goalInputs.prayers, 10) || 5,
      target_dhikr: parseInt(goalInputs.dhikr, 10) || 100,
      target_quran_pages: parseInt(goalInputs.quran, 10) || 1,
      target_sadaqah: parseFloat(goalInputs.sadaqah) || 0,
      target_sleep_hours: parseFloat(goalInputs.sleep) || 7,
      target_physical_exercise: 0,
    });
    setShowGoalForm(false);
    await loadAll();
  };

  const nextMilestone = LEVEL_MILESTONES.find((m) => m > noorPoints) || LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1];
  const prevMilestone = LEVEL_MILESTONES[Math.max(0, userLevel - 1)];
  const levelProgress = nextMilestone > prevMilestone ? ((noorPoints - prevMilestone) / (nextMilestone - prevMilestone)) * 100 : 100;

  const goal = dailyGoal;
  const progress = todayProgress;

  const bar = (current: number, target: number, color: string) => {
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return (
      <View className="h-2.5 rounded-full bg-emerald-900/60 overflow-hidden border border-emerald-800/40">
        <View style={{ width: `${pct}%` as any, backgroundColor: color, height: '100%' as any, borderRadius: 999 }} />
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }} />

      <ScrollView className="flex-1 px-4 pt-16" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-800/60 items-center justify-center border border-emerald-700/50 mr-4">
              <Ionicons name={flipIcon('arrow-back') as any} size={20} color={isDark ? '#6ee7b7' : '#fff'} />
            </TouchableOpacity>
            <View>
              <Text className="text-emerald-50 text-2xl font-bold">{t('goals.title')}</Text>
              <Text className="text-emerald-300 text-sm font-medium">{getLevelTitle(userLevel, lang)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (goal) {
                setGoalInputs({
                  prayers: String(goal.target_prayers),
                  dhikr: String(goal.target_dhikr),
                  quran: String(goal.target_quran_pages),
                  sadaqah: String(goal.target_sadaqah),
                  sleep: String(goal.target_sleep_hours),
                });
              }
              setShowGoalForm(true);
            }}
            className="bg-emerald-700/60 px-4 py-2 rounded-full border border-emerald-600/50"
          >
            <Text className="text-emerald-200 text-sm font-bold">{t('goals.setGoals')}</Text>
          </TouchableOpacity>
        </View>

        {/* Level & Streak Card */}
        <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-4">
          <LinearGradient colors={['#065f46', '#064e3b']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View className="p-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-emerald-200 text-sm font-medium">{t('goals.level')} {userLevel}</Text>
              <Text className="text-amber-400 font-bold">{noorPoints} / {nextMilestone} {t('goals.points')}</Text>
            </View>
            {bar(noorPoints - prevMilestone, nextMilestone - prevMilestone, '#fbbf24')}
            <View className="flex-row justify-between items-center mt-4">
              <View className="items-center">
                <Ionicons name="flame" size={22} color="#f97316" />
                <Text className="text-emerald-100 text-lg font-bold mt-1">{sunnahStreak}</Text>
                <Text className="text-emerald-400/60 text-xs">{t('goals.dayStreak')}</Text>
              </View>
              <View className="items-center">
                <Ionicons name="star" size={22} color="#fbbf24" />
                <Text className="text-emerald-100 text-lg font-bold mt-1">{noorPoints}</Text>
                <Text className="text-emerald-400/60 text-xs">{t('goals.noorPoints')}</Text>
              </View>
              <View className="items-center">
                <Ionicons name="book" size={22} color="#6ee7b7" />
                <Text className="text-emerald-100 text-lg font-bold mt-1">{totalDhikrCount}</Text>
                <Text className="text-emerald-400/60 text-xs">{t('goals.totalDhikr')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Progress */}
        {progress && (
          <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-4">
            <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View className="p-5">
              <Text className="text-emerald-50 text-lg font-bold mb-4">{t('goals.todayProgress')}</Text>

              <GoalRow label={t('goals.prayers')} current={progress.prayersLogged} target={goal?.target_prayers || 5} icon="time" color="#10b981" />
              <GoalRow label={t('goals.dhikr')} current={progress.dhikrCount} target={goal?.target_dhikr || 100} icon="text" color="#34d399" />
              <GoalRow label={t('goals.quranPages')} current={progress.quranPagesRead} target={goal?.target_quran_pages || 1} icon="book" color="#6ee7b7" />
              <GoalRow label={t('goals.sadaqah')} current={progress.sadaqahTotal} target={goal?.target_sadaqah || 0} icon="gift" color="#a7f3d0" />
              <GoalRow label={t('goals.sleep')} current={progress.sleepHours} target={goal?.target_sleep_hours || 7} icon="moon" color="#818cf8" />
            </View>
          </View>
        )}

        {/* Weekly Overview */}
        <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-8">
          <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View className="p-5">
            <Text className="text-emerald-50 text-lg font-bold mb-4">{t('goals.weeklyOverview')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {weekData.map((day) => {
                const dayLabel = new Date(day.date).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'short' });
                const pct = (goal?.target_prayers || 5) > 0 ? Math.min(100, (day.prayersLogged / (goal?.target_prayers || 5)) * 100) : 0;
                return (
                  <View key={day.date} className="items-center mr-3">
                    <Text className="text-emerald-400 text-xs font-medium mb-2">{dayLabel}</Text>
                    <View className="w-8 h-24 rounded-full bg-emerald-900/60 overflow-hidden border border-emerald-800/40 justify-end">
                      <View style={{ height: `${pct}%` as any, backgroundColor: '#10b981', borderRadius: 999, minHeight: pct > 0 ? 4 : 0 }} />
                    </View>
                    <Text className="text-emerald-300 text-xs font-bold mt-1">{day.prayersLogged}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Goal Setting Modal */}
        {showGoalForm && (
          <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-8">
            <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View className="p-5">
              <Text className="text-emerald-50 text-lg font-bold mb-4">{t('goals.setDailyTargets')}</Text>
              <GoalInput label={t('goals.prayers')} value={goalInputs.prayers} onChange={(v) => setGoalInputs({ ...goalInputs, prayers: v })} />
              <GoalInput label={t('goals.dhikr')} value={goalInputs.dhikr} onChange={(v) => setGoalInputs({ ...goalInputs, dhikr: v })} />
              <GoalInput label={t('goals.quranPages')} value={goalInputs.quran} onChange={(v) => setGoalInputs({ ...goalInputs, quran: v })} />
              <GoalInput label={t('goals.sadaqah')} value={goalInputs.sadaqah} onChange={(v) => setGoalInputs({ ...goalInputs, sadaqah: v })} />
              <GoalInput label={t('goals.sleep')} value={goalInputs.sleep} onChange={(v) => setGoalInputs({ ...goalInputs, sleep: v })} />
              <View className="flex-row gap-2 mt-4">
                <TouchableOpacity onPress={() => setShowGoalForm(false)} className="flex-1 bg-emerald-800/60 rounded-xl py-3 items-center border border-emerald-700/50">
                  <Text className="text-emerald-300 font-bold">{t('goals.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveGoals} className="flex-1 bg-emerald-600 rounded-xl py-3 items-center">
                  <Text className="text-emerald-50 font-bold">{t('goals.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function GoalRow({ label, current, target, icon, color }: { label: string; current: number; target: number; icon: string; color: string }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between items-center mb-1.5">
        <View className="flex-row items-center">
          <Ionicons name={icon as any} size={14} color={color} style={{ marginRight: 6 }} />
          <Text className="text-emerald-200 text-sm font-medium">{label}</Text>
        </View>
        <Text className="text-emerald-50 text-sm font-bold">{current} / {target}</Text>
      </View>
      <View className="h-2.5 rounded-full bg-emerald-900/60 overflow-hidden border border-emerald-800/40">
        <View style={{ width: `${pct}%` as any, backgroundColor: color, height: '100%' as any, borderRadius: 999 }} />
      </View>
    </View>
  );
}

function GoalInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-emerald-300 text-sm font-medium flex-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        className="bg-emerald-900/50 text-emerald-50 rounded-xl px-4 py-2 border border-emerald-700/50 w-24 text-center"
      />
    </View>
  );
}
