import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store';
import { flipIcon } from '../utils/rtl';

export default function ProgressTrackerScreen() {
  const navigation = useNavigation();
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const userLevel = useAppStore((state) => state.userLevel);
  const noorPoints = useAppStore((state) => state.noorPoints);
  const prayerLog = useAppStore((state) => state.prayerLog);
  const totalDhikrCount = useAppStore((state) => state.totalDhikrCount);

  const levels = [
    { id: 1, title: 'Al-Mubtadi', subtitle: 'The Beginner', req: 0 },
    { id: 2, title: 'Al-Talib', subtitle: 'The Seeker', req: 50 },
    { id: 3, title: 'Al-Salik', subtitle: 'The Traveler', req: 150 },
    { id: 4, title: 'Al-Muqeem', subtitle: 'The Constant', req: 500 },
    { id: 5, title: 'Al-Sabiq', subtitle: 'The Foremost', req: 1000 },
  ];

  const currentNoor = noorPoints;
  const nextLevel = levels.find(l => l.id === userLevel + 1) || levels[levels.length - 1];
  const currentLevelData = levels.find(l => l.id === userLevel) || levels[0];

  const progressPercent = Math.min(100, Math.max(0, ((currentNoor - currentLevelData.req) / (nextLevel.req - currentLevelData.req)) * 100));

  const prayersLoggedThisWeek = prayerLog.filter(p => {
    const d = new Date(p.timestamp);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const stats = [
    { label: 'Prayers Logged', value: `${prayerLog.length}`, icon: 'time', color: '#6ee7b7' },
    { label: 'This Week', value: `${prayersLoggedThisWeek}`, icon: 'calendar', color: '#fbbf24' },
    { label: 'Dhikr Count', value: `${totalDhikrCount}`, icon: 'sync', color: '#93c5fd' },
    { label: 'Day Streak', value: `${sunnahStreak}`, icon: 'flame', color: '#fca5a5' },
  ];

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
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">Spiritual Journey</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>

        {/* Core Energy & Streak */}
        <View className="flex-row space-x-4 mb-6 mt-4">
          <View className="flex-1 bg-emerald-900/60 p-5 rounded-3xl border border-emerald-800/50 shadow-lg items-center mr-2">
            <Ionicons name="flame" size={32} color="#fbbf24" style={{ marginBottom: 8 }} />
            <Text className="text-3xl font-extrabold text-amber-400 tracking-tight">{sunnahStreak}</Text>
            <Text className="text-emerald-300 text-xs font-bold uppercase tracking-wider mt-1">Day Streak</Text>
          </View>

          <View className="flex-1 bg-teal-900/40 p-5 rounded-3xl border border-teal-800/50 shadow-lg items-center ml-2">
            <Ionicons name="star" size={32} color="#6ee7b7" style={{ marginBottom: 8 }} />
            <Text className="text-3xl font-extrabold text-teal-200 tracking-tight">{currentNoor}</Text>
            <Text className="text-teal-400 text-xs font-bold uppercase tracking-wider mt-1">Total Noor</Text>
          </View>
        </View>

        {/* Level Progression */}
        <View className="rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row justify-between items-end mb-4">
              <View>
                <Text className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Current State</Text>
                <Text className="text-white text-2xl font-bold">{currentLevelData.title}</Text>
                <Text className="text-emerald-300 text-sm font-medium">{currentLevelData.subtitle}</Text>
              </View>
              <View className="w-14 h-14 bg-amber-500/20 rounded-full items-center justify-center border-2 border-amber-400/50">
                <Text className="text-amber-400 text-xl font-bold">L{userLevel}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-emerald-400 text-xs font-bold">{currentNoor} Noor</Text>
                <Text className="text-emerald-400 text-xs font-bold">{nextLevel.req} Noor to L{nextLevel.id}</Text>
              </View>
              <View className="w-full h-3 bg-emerald-900 rounded-full overflow-hidden border border-emerald-800">
                <LinearGradient
                  colors={['#f59e0b', '#fbbf24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFillObject, { width: `${progressPercent}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Lifetime Stats Grid */}
        <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4 px-1">Lifetime Statistics</Text>
        <View className="flex-row flex-wrap justify-between">
          {stats.map((stat, idx) => (
            <View key={idx} className="w-[48%] bg-emerald-900/40 p-4 rounded-3xl border border-emerald-800/50 shadow-sm mb-4 items-center">
              <View className="w-10 h-10 rounded-full bg-emerald-800/80 items-center justify-center mb-2 border border-emerald-700/50">
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text className="text-2xl font-bold text-white mb-0.5">{stat.value}</Text>
              <Text className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Growth Tree / Branches */}
        <Text className="text-emerald-50 text-xl font-bold tracking-wide mt-4 mb-4 px-1">Growth Tree</Text>
        <View className="rounded-3xl bg-emerald-900/30 p-5 border border-emerald-800/40 mb-8 relative overflow-hidden">
          <Ionicons name="leaf" size={120} color="rgba(52, 211, 153, 0.03)" style={{ position: 'absolute', right: -20, bottom: -20 }} />

          <View className="flex-row items-center mb-4 opacity-100">
            <View className="w-8 h-8 rounded-full bg-teal-500 items-center justify-center mr-3 shadow-lg">
              <Ionicons name="checkmark" size={16} color="#042f2e" />
            </View>
            <View className="flex-1">
              <Text className="text-teal-200 font-bold text-base">Taharah (Purity)</Text>
              <Text className="text-emerald-400 text-xs">Branch Mastered</Text>
            </View>
          </View>

          <View className="w-0.5 h-6 bg-teal-500 ml-4 -mt-4 mb-2 opacity-50" />

          <View className={`flex-row items-center mb-4 ${userLevel >= 1 ? 'opacity-100' : 'opacity-40'}`}>
            <View className={`w-8 h-8 rounded-full ${userLevel >= 1 ? 'bg-amber-500 border-2 border-amber-300' : 'bg-emerald-900 border border-emerald-700'} items-center justify-center mr-3 shadow-lg`}>
              <Ionicons name={userLevel >= 1 ? 'flame' : 'lock-closed'} size={14} color={userLevel >= 1 ? '#022c22' : '#6ee7b7'} />
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${userLevel >= 1 ? 'text-amber-400' : 'text-emerald-500'}`}>Salah (Prayer)</Text>
              <Text className="text-emerald-400 text-xs">{userLevel >= 1 ? `Prayers Logged: ${prayerLog.length}` : 'Unlocks at Level 1'}</Text>
            </View>
          </View>

          <View className="w-0.5 h-6 bg-emerald-800 ml-4 -mt-4 mb-2" />

          <View className={`flex-row items-center ${userLevel >= 3 ? 'opacity-100' : 'opacity-40'}`}>
            <View className={`w-8 h-8 rounded-full ${userLevel >= 3 ? 'bg-amber-500 border-2 border-amber-300' : 'bg-emerald-900 border border-emerald-700'} items-center justify-center mr-3`}>
              <Ionicons name={userLevel >= 3 ? 'flame' : 'lock-closed'} size={14} color={userLevel >= 3 ? '#022c22' : '#6ee7b7'} />
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${userLevel >= 3 ? 'text-amber-400' : 'text-emerald-500'}`}>Akhlaq (Character)</Text>
              <Text className="text-emerald-600 text-xs">{userLevel >= 3 ? 'Branch Active' : 'Unlocks at Level 3'}</Text>
            </View>
          </View>

        </View>

      </ScrollView>
    </View>
  );
}
