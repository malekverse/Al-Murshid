import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SquadsScreen() {
  return (
    <View className="flex-1 bg-emerald-950 px-6 pt-16">
      <StatusBar style="light" />
      <View className="mb-6">
        <Text className="text-amber-400 text-3xl font-bold">The Sabiqoon</Text>
        <Text className="text-emerald-200 text-sm mt-1">Strive together in faith</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active Squad */}
        <View className="bg-emerald-900 rounded-3xl p-6 shadow-lg border border-emerald-800/50 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Fajr Knights</Text>
            <View className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/50">
              <Text className="text-amber-400 text-xs font-bold">x1.5 Barakah</Text>
            </View>
          </View>
          
          <View className="space-y-4">
            {['Omar', 'Zaid', 'Yusuf (You)'].map((name, index) => (
              <View key={name} className="flex-row items-center justify-between mb-3 border-b border-emerald-800/30 pb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-emerald-800 rounded-full items-center justify-center mr-3">
                    <Text className="text-amber-400 font-bold">{name[0]}</Text>
                  </View>
                  <Text className="text-emerald-50 text-base">{name}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Text className="text-emerald-300">🔥 {3 + index} Days</Text>
                  {index === 0 && <Text className="bg-emerald-800 px-2 rounded text-emerald-100 text-xs py-1">Awake</Text>}
                  {index === 1 && <Text className="bg-red-900 px-2 rounded text-red-100 text-xs py-1">Sleeping</Text>}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity className="mt-2 bg-amber-500 rounded-full py-3 items-center">
            <Text className="text-emerald-950 font-bold">Nudge Sleeping Squad</Text>
          </TouchableOpacity>
        </View>

        {/* Knowledge Duel */}
        <View className="bg-emerald-900 rounded-3xl p-6 shadow-lg border border-emerald-800/50 mb-6 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-white text-lg font-bold mb-1">Knowledge Duel</Text>
            <Text className="text-emerald-300 text-xs">Challenge friends to a 60-second Seerah quiz to earn Noor Points.</Text>
          </View>
          <TouchableOpacity className="bg-amber-500 w-12 h-12 rounded-full items-center justify-center">
            <Text className="text-emerald-950 text-xl font-bold">⚔️</Text>
          </TouchableOpacity>
        </View>

        {/* Humility Leaderboard */}
        <View className="bg-emerald-900 rounded-3xl p-6 shadow-lg border border-emerald-800/50 mb-10">
          <Text className="text-white text-lg font-bold mb-4">Community Ranks</Text>
          <View className="flex-row justify-between items-center bg-emerald-800/50 p-4 rounded-xl mb-2">
            <Text className="text-emerald-100 font-bold text-lg">1. Al-Muqeem (The Constant)</Text>
            <Text className="text-amber-400 text-2xl">👑</Text>
          </View>
          <View className="flex-row justify-between items-center bg-emerald-800/30 p-4 rounded-xl">
            <Text className="text-emerald-200 text-base">2. Al-Talib (The Seeker) - You</Text>
            <Text className="text-amber-400/50 text-xl">⭐</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
