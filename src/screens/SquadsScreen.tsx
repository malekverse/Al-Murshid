import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SquadsScreen() {
  const navigation = useNavigation<any>();
  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="px-6 pt-16 pb-4">
        <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">The Sabiqoon</Text>
        <Text className="text-emerald-200 text-sm mt-1 font-medium">Strive together in faith</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        {/* Active Squad */}
        <View className="rounded-3xl mb-8 shadow-2xl border border-amber-500/30 overflow-hidden">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={24} color="#fbbf24" style={{ marginRight: 8 }} />
                <Text className="text-white text-xl font-bold tracking-wide">Fajr Knights</Text>
              </View>
              <View className="bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/50">
                <Text className="text-amber-400 text-xs font-bold uppercase tracking-wider">x1.5 Barakah</Text>
              </View>
            </View>
            
            <View className="space-y-4">
              {['Omar', 'Zaid', 'Yusuf (You)'].map((name, index) => (
                <View key={name} className="flex-row items-center justify-between mb-4 border-b border-emerald-700/50 pb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-emerald-800 rounded-full items-center justify-center mr-4 border border-emerald-600/50 shadow-md">
                      <Text className="text-amber-400 font-bold text-lg">{name[0]}</Text>
                    </View>
                    <Text className="text-emerald-50 text-base font-medium">{name}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <Ionicons name="flame" size={16} color="#fbbf24" />
                      <Text className="text-amber-300 font-bold ml-1">{3 + index}</Text>
                    </View>
                    {index === 0 && (
                      <View className="bg-emerald-800/80 px-2 py-1 rounded-md border border-emerald-600/50">
                        <Text className="text-emerald-200 text-xs font-semibold">Awake</Text>
                      </View>
                    )}
                    {index === 1 && (
                      <View className="bg-red-900/50 px-2 py-1 rounded-md border border-red-800/50">
                        <Text className="text-red-200 text-xs font-semibold">Sleeping</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity className="mt-4 shadow-xl active:opacity-80 rounded-full overflow-hidden">
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="py-3 items-center flex-row justify-center">
                <Ionicons name="notifications" size={20} color="#022c22" style={{ marginRight: 8 }} />
                <Text className="text-emerald-950 font-bold text-base tracking-wide">Nudge Sleeping Squad</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Proof of Salah & Heatmap */}
        <View className="flex-row space-x-4 mb-8">
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProofOfSalah')}
            className="flex-1 bg-emerald-800/80 p-4 rounded-3xl border border-emerald-600/50 shadow-lg items-center justify-center mr-2"
          >
            <View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center mb-3 border border-amber-500/30">
              <Ionicons name="camera" size={24} color="#fbbf24" />
            </View>
            <Text className="text-emerald-50 font-bold text-center">Proof of Salah</Text>
            <Text className="text-emerald-300 text-xs text-center mt-1">Masjid Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('CommunityHeatmap')}
            className="flex-1 bg-teal-900/80 p-4 rounded-3xl border border-teal-700/50 shadow-lg items-center justify-center ml-2"
          >
            <View className="w-12 h-12 rounded-full bg-teal-500/20 items-center justify-center mb-3 border border-teal-500/30">
              <Ionicons name="map" size={24} color="#6ee7b7" />
            </View>
            <Text className="text-teal-50 font-bold text-center">City Heatmap</Text>
            <Text className="text-teal-300 text-xs text-center mt-1">Live Sabiqoon</Text>
          </TouchableOpacity>
        </View>

        {/* Knowledge Duel */}
        <View className="rounded-3xl mb-8 shadow-2xl border border-teal-700/40 overflow-hidden">
          <LinearGradient
            colors={['#0f766e', '#042f2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6 flex-row justify-between items-center">
            <View className="flex-1 pr-6">
              <Text className="text-teal-50 text-xl font-bold mb-2 tracking-wide">Knowledge Duel</Text>
              <Text className="text-teal-200 text-sm leading-relaxed">Challenge friends to a 60-second Seerah quiz to earn Noor Points.</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('KnowledgeDuel')}
              className="shadow-lg active:opacity-80 rounded-full overflow-hidden border-2 border-amber-300/30"
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="w-14 h-14 items-center justify-center">
                <Ionicons name="flash" size={26} color="#022c22" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Humility Leaderboard */}
        <View className="rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row items-center mb-6">
              <Ionicons name="podium" size={22} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text className="text-white text-xl font-bold tracking-wide">Community Ranks</Text>
            </View>
            
            <View className="flex-row justify-between items-center bg-emerald-800/60 p-4 rounded-2xl mb-3 border border-emerald-700/50 shadow-md">
              <View className="flex-row items-center">
                <Text className="text-emerald-100 font-bold text-lg">1. Al-Muqeem</Text>
                <Text className="text-emerald-300 text-sm ml-2 font-medium">(The Constant)</Text>
              </View>
              <Ionicons name="trophy" size={24} color="#fbbf24" />
            </View>
            
            <View className="flex-row justify-between items-center bg-emerald-800/30 p-4 rounded-2xl border border-emerald-800/50">
              <View className="flex-row items-center">
                <Text className="text-emerald-200 text-base font-semibold">2. Al-Talib</Text>
                <Text className="text-emerald-400 text-xs ml-2">(The Seeker) - You</Text>
              </View>
              <Ionicons name="star" size={20} color="#6ee7b7" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
