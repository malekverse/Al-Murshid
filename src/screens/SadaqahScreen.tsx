import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { saveSadaqahLog, getSadaqahSummary, getCategories, SadaqahSummary } from '../services/data/sadaqahService';

export default function SadaqahScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [summary, setSummary] = useState<SadaqahSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [currency] = useState('USD');
  const [saving, setSaving] = useState(false);

  const categories = getCategories();

  useFocusEffect(useCallback(() => {
    loadSummary();
  }, []));

  const loadSummary = async () => {
    setLoading(true);
    try {
      const s = await getSadaqahSummary();
      setSummary(s);
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(t('sadaqah.invalidAmount'));
      return;
    }
    setSaving(true);
    try {
      await saveSadaqahLog({
        date: new Date().toISOString().split('T')[0],
        amount: amt,
        currency,
        category,
        notes: notes.trim() || undefined,
        timestamp: Date.now(),
      });
      setAmount('');
      setCategory('general');
      setNotes('');
      await loadSummary();
    } catch {}
    setSaving(false);
  };

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

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
      <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }} />

      <ScrollView className="flex-1 px-4 pt-16" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => (navigation as any).goBack()} className="w-10 h-10 rounded-full bg-emerald-800/60 items-center justify-center border border-emerald-700/50">
            <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
          </TouchableOpacity>
          <Text className="text-emerald-50 text-2xl font-bold ml-4">{t('sadaqah.title')}</Text>
        </View>

        {/* Summary Cards */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <SummaryCard label={t('sadaqah.today')} value={formatCurrency(summary?.todayTotal || 0)} color="#10b981" />
          <SummaryCard label={t('sadaqah.thisWeek')} value={formatCurrency(summary?.thisWeekTotal || 0)} color="#34d399" />
          <SummaryCard label={t('sadaqah.thisMonth')} value={formatCurrency(summary?.thisMonthTotal || 0)} color="#6ee7b7" />
          <SummaryCard label={t('sadaqah.thisYear')} value={formatCurrency(summary?.thisYearTotal || 0)} color="#a7f3d0" />
        </View>

        {/* All-time total */}
        <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-6">
          <LinearGradient colors={['#065f46', '#064e3b']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View className="p-6 items-center">
            <Text className="text-emerald-300 text-sm font-medium mb-1">{t('sadaqah.allTime')}</Text>
            <Text className="text-emerald-50 text-4xl font-bold">{formatCurrency(summary?.allTimeTotal || 0)}</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {summary && summary.categoryBreakdown.length > 0 && (
          <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-6">
            <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View className="p-4">
              <Text className="text-emerald-50 text-lg font-bold mb-3">{t('sadaqah.byCategory')}</Text>
              {summary.categoryBreakdown.map((cat) => (
                <View key={cat.category} className="flex-row items-center justify-between py-2 border-b border-emerald-800/40">
                  <Text className="text-emerald-200 text-sm capitalize">{cat.category}</Text>
                  <Text className="text-emerald-50 font-semibold">{formatCurrency(cat.total)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add Log Form */}
        <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-6">
          <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View className="p-4">
            <Text className="text-emerald-50 text-lg font-bold mb-4">{t('sadaqah.addLog')}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder={t('sadaqah.amountPlaceholder')}
              placeholderTextColor="#6ee7b7"
              keyboardType="decimal-pad"
              className="bg-emerald-900/50 text-emerald-50 rounded-xl px-4 py-3 mb-3 border border-emerald-700/50"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full mr-2 border ${category === cat ? 'bg-emerald-600 border-emerald-400' : 'bg-emerald-900/50 border-emerald-700/50'}`}
                >
                  <Text className={`text-sm ${category === cat ? 'text-emerald-50 font-bold' : 'text-emerald-300'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('sadaqah.notesPlaceholder')}
              placeholderTextColor="#6ee7b7"
              multiline
              className="bg-emerald-900/50 text-emerald-50 rounded-xl px-4 py-3 mb-3 border border-emerald-700/50 h-20"
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-emerald-600 rounded-xl py-3 items-center active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color="#ecfdf5" />
              ) : (
                <Text className="text-emerald-50 font-bold text-base">{t('sadaqah.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Logs */}
        {summary && summary.recentLogs.length > 0 && (
          <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-8">
            <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View className="p-4">
              <Text className="text-emerald-50 text-lg font-bold mb-3">{t('sadaqah.recentLogs')}</Text>
              {summary.recentLogs.map((log) => (
                <View key={log.id} className="flex-row items-center justify-between py-3 border-b border-emerald-800/40">
                  <View className="flex-1">
                    <Text className="text-emerald-200 text-sm font-semibold capitalize">{log.category}</Text>
                    <Text className="text-emerald-400/60 text-xs">{log.date}</Text>
                    {log.notes ? <Text className="text-emerald-400/40 text-xs mt-0.5" numberOfLines={1}>{log.notes}</Text> : null}
                  </View>
                  <Text className="text-emerald-50 font-bold">{formatCurrency(log.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="w-[48%] rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-3">
      <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View className="p-4">
        <Text className="text-emerald-400 text-xs font-medium mb-1">{label}</Text>
        <Text className="text-emerald-50 text-lg font-bold" style={{ color }}>{value}</Text>
      </View>
    </View>
  );
}
