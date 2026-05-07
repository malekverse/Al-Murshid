import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTranslation, Trans } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

export default function KhatmahScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  
  // Mock State for Demo
  const [totalPages] = useState(604);
  const [pagesRead, setPagesRead] = useState(124);
  const targetDays = 30; // E.g., Ramadan
  const daysPassed = 7;
  
  const percentComplete = Math.round((pagesRead / totalPages) * 100);
  const pagesPerDayTarget = Math.ceil(totalPages / targetDays);
  const daysRemaining = targetDays - daysPassed;
  const currentPagesPerDayRequired = Math.ceil((totalPages - pagesRead) / daysRemaining);

  const logReading = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (pagesRead + 10 <= totalPages) {
      setPagesRead(pagesRead + 10); // simulate reading 10 pages
    }
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header Overlay */}
      <View className="pt-16 px-6 flex-row justify-between items-center z-10 mb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-emerald-50 text-lg font-bold tracking-wide">{t('khatmah.title')}</Text>
          <Text className="text-emerald-400 text-xs font-medium">{t('khatmah.goal')}</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md">
          <Ionicons name="options" size={20} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 16 }}>
        
        {/* Progress Ring Card */}
        <View className="rounded-3xl shadow-2xl border border-teal-700/40 overflow-hidden mb-6">
          <LinearGradient colors={['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View className="p-8 items-center">
            
            {/* CSS-based Circular Progress (Mock SVG) */}
            <View className="w-48 h-48 rounded-full border-8 border-teal-900/50 items-center justify-center mb-6 relative shadow-lg">
              {/* Fake filled part using absolute border */}
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
              <Text className="font-bold text-lg">{pagesRead}</Text> / {totalPages} {t('khatmah.pagesRead')}
            </Text>
            <Text className="text-teal-300 text-xs font-medium">Juz 6 • Surah Al-Ma'idah</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row space-x-4 mb-6">
          <View className="flex-1 bg-emerald-900/40 p-5 rounded-3xl border border-emerald-800/50 shadow-lg items-center">
            <Ionicons name="calendar" size={24} color="#6ee7b7" style={{ marginBottom: 8 }} />
            <Text className="text-emerald-50 font-bold text-xl mb-1">{daysRemaining}</Text>
            <Text className="text-emerald-300/80 text-xs font-medium uppercase tracking-wider">{t('khatmah.daysLeft')}</Text>
          </View>
          
          <View className="flex-1 bg-amber-900/20 p-5 rounded-3xl border border-amber-700/30 shadow-lg items-center">
            <Ionicons name="book" size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
            <Text className="text-amber-400 font-bold text-xl mb-1">{currentPagesPerDayRequired}</Text>
            <Text className="text-amber-200/80 text-xs font-medium uppercase tracking-wider text-center">{t('khatmah.pagesNeeded')}</Text>
          </View>
        </View>

        {/* AI Insight */}
        <View className="bg-teal-900/30 rounded-3xl p-6 mb-8 border border-teal-700/30">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb-outline" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text className="text-teal-100 font-bold text-sm tracking-wide">{t('khatmah.advice')}</Text>
          </View>
          <Text className="text-emerald-200/90 text-sm leading-relaxed">
            <Trans i18nKey="khatmah.adviceDesc" values={{ pages: currentPagesPerDayRequired }}>
              You are slightly behind schedule. Try reading <Text className="font-bold text-amber-400">4 pages</Text> after every obligatory prayer to catch up and easily hit your {{currentPagesPerDayRequired}} page daily goal!
            </Trans>
          </Text>
        </View>

        {/* Log Button */}
        <TouchableOpacity 
          onPress={logReading}
          className="shadow-2xl active:opacity-80 rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="py-4 items-center flex-row justify-center">
            <Ionicons name="add-circle" size={24} color="#022c22" style={{ marginRight: 8 }} />
            <Text className="text-emerald-950 font-extrabold text-lg tracking-wide">{t('khatmah.log')}</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
