import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';
import i18n from '../../i18n';
import { getLevel, getLevelTitle } from '../../types';
import { signOut } from '../../services/supabase/auth';
import { fullSync } from '../../services/supabase/sync';
import { flipIcon } from '../../utils/rtl';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const isOnline = useAppStore((s) => s.isOnline);
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const tamperDetected = useAppStore((s) => s.tamperDetected);
  const setSyncInfo = useAppStore((s) => s.setSyncInfo);
  const sunnahStreak = useAppStore((s) => s.sunnahStreak);
  const noorPoints = useAppStore((s) => s.noorPoints);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMessage('');
    const result = await fullSync(user.id);
    setSyncing(false);
    setSyncMessage(result.message);
    setSyncInfo(new Date().toISOString(), result.tamperDetected);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setSyncInfo(null, false);
  };

  const computedLevel = getLevel(noorPoints);
  const computedLevelTitle = getLevelTitle(computedLevel, i18n.language as 'en' | 'ar');

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 mb-6"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>

        <View className="rounded-3xl overflow-hidden border border-amber-500/20 mb-6">
          <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
          <View className="p-6 items-center">
            <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4 border-2 border-amber-500/30">
              {user?.photoUrl ? (
                <Ionicons name="person-circle" size={76} color="#fbbf24" />
              ) : (
                <Ionicons name="person" size={40} color="#fbbf24" />
              )}
            </View>
            <Text className="text-emerald-50 text-2xl font-bold">{user?.displayName || t('profile.user')}</Text>
            <Text className="text-emerald-400/70 text-sm mt-1">{user?.email || ''}</Text>
            <View className="flex-row items-center mt-2">
              <View className={`px-2 py-1 rounded-full ${user?.authProvider === 'email' ? 'bg-emerald-800/50' : 'bg-amber-800/30'}`}>
                <Text className="text-emerald-300 text-xs">
                  {user?.authProvider === 'google' ? 'Google' : user?.authProvider === 'apple' ? 'Apple' : t('profile.emailAccount')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-2xl overflow-hidden border border-emerald-800/40 p-4">
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
            <Text className="text-emerald-400 text-xs font-medium">{t('profile.level')}</Text>
            <Text className="text-amber-400 text-xl font-bold mt-1">{computedLevelTitle}</Text>
            <Text className="text-emerald-500 text-xs">{t('profile.levelNumber', { level: computedLevel })}</Text>
          </View>
          <View className="flex-1 rounded-2xl overflow-hidden border border-emerald-800/40 p-4">
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
            <Text className="text-emerald-400 text-xs font-medium">{t('profile.streak')}</Text>
            <Text className="text-amber-400 text-xl font-bold mt-1">{sunnahStreak}</Text>
            <Text className="text-emerald-500 text-xs">{t('profile.days')}</Text>
          </View>
          <View className="flex-1 rounded-2xl overflow-hidden border border-emerald-800/40 p-4">
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
            <Text className="text-emerald-400 text-xs font-medium">{t('profile.noorPoints')}</Text>
            <Text className="text-amber-400 text-xl font-bold mt-1">{noorPoints}</Text>
            <Text className="text-emerald-500 text-xs">{t('profile.points')}</Text>
          </View>
        </View>

        <View className="rounded-3xl overflow-hidden border border-emerald-800/40 mb-6">
          <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
          <View className="p-5">
            <Text className="text-emerald-50 text-lg font-bold mb-4">{t('profile.syncTitle')}</Text>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} mr-2`} />
                <Text className="text-emerald-300 text-sm">{isOnline ? t('profile.online') : t('profile.offline')}</Text>
              </View>
              {isOnline && (
                <TouchableOpacity
                  onPress={handleSync}
                  disabled={syncing}
                  className="bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-full active:opacity-80 flex-row items-center"
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color="#fbbf24" />
                  ) : (
                    <>
                      <Ionicons name="sync" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                      <Text className="text-amber-400 text-xs font-bold">{t('profile.syncNow')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {lastSyncAt && (
              <Text className="text-emerald-500/60 text-xs">
                {t('profile.lastSync')}: {new Date(lastSyncAt).toLocaleString()}
              </Text>
            )}
            {syncMessage ? (
              <Text className={`text-xs mt-2 ${tamperDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                {syncMessage}
              </Text>
            ) : null}
            {tamperDetected ? (
              <View className="bg-red-900/30 border border-red-700/40 rounded-xl p-3 mt-3">
                <Text className="text-red-300 text-xs">{t('profile.tamperWarning')}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="rounded-2xl overflow-hidden border border-red-800/50 active:opacity-80"
        >
          <View className="bg-red-950/60 p-4 flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#fca5a5" style={{ marginRight: 8 }} />
            <Text className="text-red-300 font-bold text-base">{t('profile.signOut')}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
