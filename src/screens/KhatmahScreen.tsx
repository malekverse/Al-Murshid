import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTranslation, Trans } from 'react-i18next';
import { flipIcon } from '../utils/rtl';
import { saveKhatmahProgress, getKhatmahProgress } from '../store/database';

const TOTAL_QURAN_PAGES = 604;

export default function KhatmahScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const GOAL_PRESETS = [
    { id: '30', days: 30 },
    { id: '60', days: 60 },
    { id: '90', days: 90 },
  ];

  const getGoalLabel = (id: string) => {
    switch (id) {
      case '30': return t('khatmah.days30');
      case '60': return t('khatmah.days60');
      case '90': return t('khatmah.days90');
      default: return id;
    }
  };

  const [activeGoal, setActiveGoal] = useState(GOAL_PRESETS[0]);
  const [pagesRead, setPagesRead] = useState(0);

  useEffect(() => {
    getKhatmahProgress().then((rows: any[]) => {
      const total = rows.reduce((sum: number, r: any) => sum + (r.pagesRead || 0), 0);
      setPagesRead(Math.min(total, TOTAL_QURAN_PAGES));
    }).catch((e) => console.warn('load khatmah progress failed:', e));
  }, []);
  const daysPassed = Math.floor((Date.now() - new Date(Date.now() - activeGoal.days * 24 * 60 * 60 * 1000 * 0.3).getTime()) / (1000 * 60 * 60 * 24));

  const percentComplete = Math.round((pagesRead / TOTAL_QURAN_PAGES) * 100);
  const daysRemaining = Math.max(0, activeGoal.days - daysPassed);
  const pagesPerDayRequired = Math.ceil((TOTAL_QURAN_PAGES - pagesRead) / Math.max(daysRemaining, 1));

  const logReading = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (pagesRead + 10 <= TOTAL_QURAN_PAGES) {
      setPagesRead(pagesRead + 10);
      saveKhatmahProgress(new Date().toISOString().split('T')[0], 10, Date.now()).catch((e) => console.warn('saveKhatmahProgress failed:', e));
    }
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="pt-16 px-6 flex-row justify-between items-center z-10 mb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md" accessibilityLabel="Go back">
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-emerald-50 text-lg font-bold tracking-wide">{t('khatmah.title')}</Text>
          <Text className="text-emerald-400 text-xs font-medium">{t('khatmah.goal')}</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md" accessibilityLabel="Options">
          <Ionicons name="options" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      {/* Goal Preset Switcher */}
      <View className="px-6 mb-4">
        <View className="flex-row bg-emerald-900/60 rounded-full p-1 border border-emerald-800/50">
          {GOAL_PRESETS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              onPress={() => setActiveGoal(goal)}
              className={`flex-1 py-2 rounded-full items-center ${activeGoal.id === goal.id ? 'bg-amber-500 shadow-lg' : ''}`}
            >
              <Text className={`text-xs font-bold ${activeGoal.id === goal.id ? 'text-emerald-950' : 'text-emerald-400'}`}>{getGoalLabel(goal.id)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 8 }}>
        {pagesRead === 0 ? (
          <View className="rounded-3xl border border-teal-700/40 overflow-hidden mb-6">
            <LinearGradient colors={['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
            <View className="p-8 items-center">
              <View className="w-20 h-20 rounded-full bg-teal-900/50 items-center justify-center mb-4 border border-teal-600/50">
                <Ionicons name="book-outline" size={40} color="#fbbf24" />
              </View>
              <Text className="text-emerald-50 text-xl font-bold text-center mb-2">{t('khatmah.welcomeTitle')}</Text>
              <Text className="text-teal-200/80 text-sm text-center leading-relaxed mb-6">{t('khatmah.welcomeDesc')}</Text>
              <View className="bg-teal-900/40 rounded-2xl p-4 border border-teal-700/40 w-full">
                <Text className="text-teal-100 text-sm font-bold mb-2">{t('khatmah.howToStart')}</Text>
                <View className="flex-row items-start mb-2">
                  <Text className="text-amber-400 font-bold mr-2">1.</Text>
                  <Text className="text-teal-200/80 text-sm flex-1">{t('khatmah.step1')}</Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <Text className="text-amber-400 font-bold mr-2">2.</Text>
                  <Text className="text-teal-200/80 text-sm flex-1">{t('khatmah.step2')}</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-amber-400 font-bold mr-2">3.</Text>
                  <Text className="text-teal-200/80 text-sm flex-1">{t('khatmah.step3')}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="rounded-3xl shadow-2xl border border-teal-700/40 overflow-hidden mb-6">
            <LinearGradient colors={['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
            <View className="p-8 items-center">
              <View className="w-48 h-48 rounded-full border-8 border-teal-900/50 items-center justify-center mb-6 relative shadow-lg">
                <View
                  className="absolute w-full h-full rounded-full border-8 border-amber-400"
                  style={{
                    borderLeftColor: 'transparent',
                    borderBottomColor: percentComplete > 25 ? '#fbbf24' : 'transparent',
                    borderRightColor: percentComplete > 50 ? '#fbbf24' : 'transparent',
                    borderTopColor: percentComplete > 75 ? '#fbbf24' : 'transparent',
                    transform: [{ rotate: '-45deg' }]
                  }}
                />
                <Text className="text-amber-400 text-5xl font-extrabold">{percentComplete}%</Text>
                <Text className="text-teal-200 text-sm font-bold uppercase tracking-widest mt-1">{t('khatmah.completed')}</Text>
              </View>
              <Text className="text-emerald-50 text-base font-medium mb-1">
                <Text className="font-bold text-lg">{pagesRead}</Text> / {TOTAL_QURAN_PAGES} {t('khatmah.pagesRead')}
              </Text>
              <Text className="text-teal-300 text-xs font-medium">{getGoalLabel(activeGoal.id)}</Text>
            </View>
          </View>
        )}

        <View className="flex-row space-x-4 mb-6">
          <View className="flex-1 bg-emerald-900/40 p-5 rounded-3xl border border-emerald-800/50 shadow-lg items-center">
            <Ionicons name="calendar" size={24} color="#6ee7b7" style={{ marginBottom: 8 }} />
            <Text className="text-emerald-50 font-bold text-xl mb-1">{daysRemaining}</Text>
            <Text className="text-emerald-300/80 text-xs font-medium uppercase tracking-wider">{t('khatmah.daysLeft')}</Text>
          </View>
          <View className="flex-1 bg-amber-900/20 p-5 rounded-3xl border border-amber-700/30 shadow-lg items-center">
            <Ionicons name="book" size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
            <Text className="text-amber-400 font-bold text-xl mb-1">{pagesPerDayRequired}</Text>
            <Text className="text-amber-200/80 text-xs font-medium uppercase tracking-wider text-center">{t('khatmah.pagesNeeded')}</Text>
          </View>
        </View>

        <View className="bg-teal-900/30 rounded-3xl p-6 mb-8 border border-teal-700/30">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb-outline" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text className="text-teal-100 font-bold text-sm tracking-wide">{t('khatmah.advice')}</Text>
          </View>
          <Text className="text-emerald-200/90 text-sm leading-relaxed">
            <Trans i18nKey="khatmah.adviceDesc" values={{ pages: pagesPerDayRequired }}>
              You are slightly behind schedule. Try reading <Text className="font-bold text-amber-400">4 pages</Text> after every obligatory prayer to catch up and easily hit your {{pagesPerDayRequired}} page daily goal!
            </Trans>
          </Text>
        </View>

        <TouchableOpacity onPress={logReading} className="shadow-2xl active:opacity-80 rounded-full overflow-hidden">
          <LinearGradient colors={['#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <View className="py-4 items-center flex-row justify-center">
            <Ionicons name="add-circle" size={24} color="#022c22" style={{ marginRight: 8 }} />
            <Text className="text-emerald-950 font-extrabold text-lg tracking-wide">{t('khatmah.log')}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
