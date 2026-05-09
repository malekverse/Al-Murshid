import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';
import { getRamadanLog, saveRamadanLog, getRamadanSummary, getRamadanGoals, saveRamadanGoals, RamadanLog, RamadanGoals } from '../services/data/ramadanService';

function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function RamadanScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const [log, setLog] = useState<RamadanLog | null>(null);
  const [goals, setGoals] = useState<RamadanGoals | null>(null);
  const [summary, setSummary] = useState({ totalFasting: 0, totalQiyam: 0, totalPagesRead: 0, totalSadaqah: 0, totalDays: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fasting, setFasting] = useState(false);
  const [suhoorTime, setSuhoorTime] = useState('');
  const [iftarTime, setIftarTime] = useState('');
  const [pagesRead, setPagesRead] = useState(0);
  const [qiyam, setQiyam] = useState(false);
  const [sadaqah, setSadaqah] = useState(0);
  const [duaNotes, setDuaNotes] = useState('');

  // Goals form
  const [quranGoal, setQuranGoal] = useState(604);
  const [sadaqahGoal, setSadaqahGoal] = useState(0);
  const [showGoalForm, setShowGoalForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayLog, sum, existingGoals] = await Promise.all([
        getRamadanLog(today),
        getRamadanSummary(currentYear),
        getRamadanGoals(currentYear),
      ]);
      setLog(todayLog);
      setSummary(sum);
      setGoals(existingGoals);

      if (todayLog) {
        setFasting(todayLog.fasting === 1);
        setSuhoorTime(todayLog.suhoor_time || '');
        setIftarTime(todayLog.iftar_time || '');
        setPagesRead(todayLog.pages_read);
        setQiyam(todayLog.qiyam === 1);
        setSadaqah(todayLog.sadaqah);
        setDuaNotes(todayLog.dua_notes || '');
      } else {
        setFasting(true);
        setSuhoorTime('');
        setIftarTime(formatTime(new Date()));
        setPagesRead(0);
        setQiyam(false);
        setSadaqah(0);
        setDuaNotes('');
      }

      if (existingGoals) {
        setQuranGoal(existingGoals.quran_goal_pages);
        setSadaqahGoal(existingGoals.sadaqah_goal);
      }
    } catch (e) {
      console.warn('load Ramadan data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRamadanLog({
        date: today,
        fasting: fasting ? 1 : 0,
        suhoor_time: suhoorTime || undefined,
        iftar_time: iftarTime || undefined,
        pages_read: pagesRead,
        qiyam: qiyam ? 1 : 0,
        sadaqah,
        dua_notes: duaNotes || undefined,
      });
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save Ramadan log');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoals = async () => {
    try {
      await saveRamadanGoals({ year: currentYear, quran_goal_pages: quranGoal, sadaqah_goal: sadaqahGoal });
      setGoals({ year: currentYear, quran_goal_pages: quranGoal, sadaqah_goal: sadaqahGoal });
      setShowGoalForm(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save goals');
    }
  };

  const avgPagesPerDay = summary.totalDays > 0 ? (summary.totalPagesRead / summary.totalDays).toFixed(1) : '0';
  const goalProgress = goals && goals.quran_goal_pages > 0 ? Math.min(summary.totalPagesRead / goals.quran_goal_pages, 1) : 0;
  const sadaqahGoalProgress = goals && goals.sadaqah_goal > 0 ? Math.min(summary.totalSadaqah / goals.sadaqah_goal, 1) : 0;

  if (loading) {
    return (
      <View className="flex-1 bg-emerald-950 items-center justify-center">
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Go back">
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('ramadan.title')}</Text>
        <TouchableOpacity onPress={() => setShowGoalForm(!showGoalForm)} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Goals">
          <Ionicons name="flag" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>

        {/* Summary Cards */}
        <View className="flex-row flex-wrap mb-6">
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-800/50">
              <Ionicons name="moon" size={20} color="#c7d2fe" style={{ marginBottom: 6 }} />
              <Text className="text-indigo-200 text-lg font-bold">{summary.totalFasting}</Text>
              <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('ramadan.fastingDays')}</Text>
            </View>
          </View>
          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-800/50">
              <Ionicons name="star" size={20} color="#fbbf24" style={{ marginBottom: 6 }} />
              <Text className="text-teal-200 text-lg font-bold">{summary.totalQiyam}</Text>
              <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('ramadan.qiyamNights')}</Text>
            </View>
          </View>
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-800/50">
              <Ionicons name="book" size={20} color="#fbbf24" style={{ marginBottom: 6 }} />
              <Text className="text-amber-200 text-lg font-bold">{summary.totalPagesRead}</Text>
              <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('ramadan.pagesRead')}</Text>
            </View>
          </View>
          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-800/50">
              <Ionicons name="heart" size={20} color="#fca5a5" style={{ marginBottom: 6 }} />
              <Text className="text-red-200 text-lg font-bold">${summary.totalSadaqah.toFixed(0)}</Text>
              <Text className="text-emerald-400/60 text-xs uppercase tracking-wider">{t('ramadan.sadaqahGiven')}</Text>
            </View>
          </View>
        </View>

        {/* Goal Progress */}
        {goals && (
          <View className="rounded-3xl border border-amber-700/30 overflow-hidden mb-6">
            <LinearGradient colors={['#78350f', '#451a03']} style={StyleSheet.absoluteFillObject} />
            <View className="p-5">
              <Text className="text-amber-300 text-sm font-bold mb-4">{t('ramadan.goalProgress')}</Text>
              <View className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-amber-100/80 text-xs">{t('ramadan.quranGoal')}</Text>
                  <Text className="text-amber-300 text-xs font-bold">{summary.totalPagesRead}/{goals.quran_goal_pages}</Text>
                </View>
                <View className="w-full bg-amber-900/60 h-2.5 rounded-full overflow-hidden border border-amber-800/50">
                  <View className="h-full rounded-full bg-amber-500" style={{ width: ((goalProgress * 100).toFixed(0) + '%') as any }} />
                </View>
              </View>
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-amber-100/80 text-xs">{t('ramadan.sadaqahGoal')}</Text>
                  <Text className="text-amber-300 text-xs font-bold">${summary.totalSadaqah.toFixed(0)}/${goals.sadaqah_goal.toFixed(0)}</Text>
                </View>
                <View className="w-full bg-amber-900/60 h-2.5 rounded-full overflow-hidden border border-amber-800/50">
                  <View className="h-full rounded-full bg-emerald-500" style={{ width: ((sadaqahGoalProgress * 100).toFixed(0) + '%') as any }} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Goals Form */}
        {showGoalForm && (
          <View className="rounded-3xl border border-teal-700/40 overflow-hidden mb-6">
            <LinearGradient colors={['#0f766e', '#042f2e']} style={StyleSheet.absoluteFillObject} />
            <View className="p-5">
              <Text className="text-teal-200 text-sm font-bold mb-4">{t('ramadan.setGoals')}</Text>
              <Text className="text-emerald-300 text-xs mb-2">{t('ramadan.quranGoal')}</Text>
              <TextInput
                value={String(quranGoal)}
                onChangeText={(v) => setQuranGoal(parseInt(v) || 0)}
                keyboardType="numeric"
                className="bg-teal-900/40 border border-teal-700/50 rounded-xl px-4 py-3 text-teal-50 text-base mb-4"
              />
              <Text className="text-emerald-300 text-xs mb-2">{t('ramadan.sadaqahGoal')}</Text>
              <TextInput
                value={String(sadaqahGoal)}
                onChangeText={(v) => setSadaqahGoal(parseFloat(v) || 0)}
                keyboardType="decimal-pad"
                className="bg-teal-900/40 border border-teal-700/50 rounded-xl px-4 py-3 text-teal-50 text-base mb-4"
              />
              <TouchableOpacity onPress={handleSaveGoals} className="bg-teal-600 py-3 rounded-xl items-center active:opacity-80">
                <Text className="text-white font-bold">{t('ramadan.saveGoals')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Today's Log */}
        <View className="rounded-3xl border border-emerald-800/40 overflow-hidden mb-6">
          <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
          <View className="p-5">
            <Text className="text-emerald-200 text-sm font-bold mb-5">{t('ramadan.todayLog')}</Text>

            {/* Fasting Toggle */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="moon" size={18} color="#c7d2fe" style={{ marginRight: 8 }} />
                <Text className="text-emerald-100 text-base font-medium">{t('ramadan.fasting')}</Text>
              </View>
              <Switch value={fasting} onValueChange={setFasting} trackColor={{ false: '#064e3b', true: '#10b981' }} thumbColor="#ecfdf5" />
            </View>

            {/* Suhoor / Iftar Times */}
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-emerald-400 text-xs mb-1">{t('ramadan.suhoor')}</Text>
                <TextInput
                  value={suhoorTime}
                  onChangeText={setSuhoorTime}
                  placeholder="04:30"
                  placeholderTextColor="rgba(110, 231, 183, 0.3)"
                  className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base"
                  style={{ textAlign: isArabic ? 'right' : 'left' }}
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-emerald-400 text-xs mb-1">{t('ramadan.iftar')}</Text>
                <TextInput
                  value={iftarTime}
                  onChangeText={setIftarTime}
                  placeholder="18:45"
                  placeholderTextColor="rgba(110, 231, 183, 0.3)"
                  className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base"
                  style={{ textAlign: isArabic ? 'right' : 'left' }}
                />
              </View>
            </View>

            {/* Pages Read */}
            <Text className="text-emerald-400 text-xs mb-1">{t('ramadan.pagesRead')}</Text>
            <View className="flex-row items-center mb-4">
              <TouchableOpacity onPress={() => setPagesRead(Math.max(0, pagesRead - 1))} className="w-10 h-10 bg-emerald-900/60 rounded-xl items-center justify-center border border-emerald-700/50">
                <Ionicons name="remove" size={20} color="#6ee7b7" />
              </TouchableOpacity>
              <TextInput
                value={String(pagesRead)}
                onChangeText={(v) => setPagesRead(parseInt(v) || 0)}
                keyboardType="numeric"
                className="flex-1 mx-3 bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base text-center"
              />
              <TouchableOpacity onPress={() => setPagesRead(pagesRead + 1)} className="w-10 h-10 bg-emerald-900/60 rounded-xl items-center justify-center border border-emerald-700/50">
                <Ionicons name="add" size={20} color="#6ee7b7" />
              </TouchableOpacity>
            </View>

            {/* Qiyam Toggle */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="star" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
                <Text className="text-emerald-100 text-base font-medium">{t('ramadan.qiyam')}</Text>
              </View>
              <Switch value={qiyam} onValueChange={setQiyam} trackColor={{ false: '#064e3b', true: '#f59e0b' }} thumbColor="#ecfdf5" />
            </View>

            {/* Sadaqah */}
            <Text className="text-emerald-400 text-xs mb-1">{t('ramadan.sadaqah')}</Text>
            <TextInput
              value={String(sadaqah)}
              onChangeText={(v) => setSadaqah(parseFloat(v) || 0)}
              keyboardType="decimal-pad"
              className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-4"
            />

            {/* Du'a Notes */}
            <Text className="text-emerald-400 text-xs mb-1">{t('ramadan.duaNotes')}</Text>
            <TextInput
              value={duaNotes}
              onChangeText={setDuaNotes}
              multiline
              numberOfLines={3}
              placeholder={t('ramadan.duaNotesPlaceholder')}
              placeholderTextColor="rgba(110, 231, 183, 0.3)"
              className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-5"
              style={{ textAlignVertical: 'top', minHeight: 70, textAlign: isArabic ? 'right' : 'left' }}
            />

            <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-amber-500 py-3 rounded-xl items-center active:opacity-80">
              {saving ? (
                <ActivityIndicator color="#022c22" />
              ) : (
                <Text className="text-emerald-950 font-bold text-lg">{t('ramadan.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
