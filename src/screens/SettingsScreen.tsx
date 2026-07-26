import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Animated, Alert, ActivityIndicator, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';
import { flipIcon } from '../utils/rtl';
import { getLevel, getLevelTitle } from '../types';
import * as Updates from 'expo-updates';
import { signOut } from '../services/supabase/auth';
import { fullSync } from '../services/supabase/sync';
import { loadPersistedSettings, persistSetting } from '../services/data/settingsService';
import { exportAllDataAsJson, getDataStats, importDataFromJson, pickJsonFile } from '../services/data/exportService';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const sunnahStreak = useAppStore((state) => state.sunnahStreak);
  const noorPoints = useAppStore((state) => state.noorPoints);
  const openRouterApiKey = useAppStore((state) => state.openRouterApiKey);
  const setOpenRouterApiKey = useAppStore((state) => state.setOpenRouterApiKey);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const isOnline = useAppStore((state) => state.isOnline);
  const lastSyncAt = useAppStore((state) => state.lastSyncAt);
  const tamperDetected = useAppStore((state) => state.tamperDetected);
  const setSyncInfo = useAppStore((state) => state.setSyncInfo);
  const darkMode = useAppStore((state) => state.darkMode);
  const setDarkMode = useAppStore((state) => state.setDarkMode);
  const { t, i18n } = useTranslation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [prayerAlerts, setPrayerAlerts] = useState(true);
  const [smartReminders, setSmartReminders] = useState(true);
  const [muhasabahReminder, setMuhasabahReminder] = useState(true);
  const [quranReminder, setQuranReminder] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState(openRouterApiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSignOut = async () => {
    useAppStore.getState().setUserInitiatedSignOut(true);
    await signOut();
    setUser(null);
    setSyncInfo(null, false);
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    const result = await fullSync(user.id);
    setSyncing(false);
    setSyncInfo(new Date().toISOString(), result.tamperDetected);
  };

  // Animations
  const sectionOpacities = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const sectionTranslates = useRef([new Animated.Value(20), new Animated.Value(20), new Animated.Value(20), new Animated.Value(20)]).current;

  useEffect(() => {
    const animations = sectionOpacities.map((_, i) =>
      Animated.parallel([
        Animated.timing(sectionOpacities[i], { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(sectionTranslates[i], { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ])
    );
    Animated.stagger(150, animations).start();
  }, []);

  useEffect(() => {
    loadPersistedSettings().then((settings) => {
      if (settings.notificationsEnabled !== undefined) setNotificationsEnabled(settings.notificationsEnabled === 'true');
      if (settings.hapticFeedback !== undefined) setHapticFeedback(settings.hapticFeedback === 'true');
      if (settings.prayerAlerts !== undefined) setPrayerAlerts(settings.prayerAlerts === 'true');
      if (settings.smartReminders !== undefined) setSmartReminders(settings.smartReminders === 'true');
      if (settings.muhasabahReminder !== undefined) setMuhasabahReminder(settings.muhasabahReminder === 'true');
      if (settings.quranReminder !== undefined) setQuranReminder(settings.quranReminder === 'true');
    }).catch((e) => console.warn('loadPersistedSettings failed:', e));
  }, []);

  useEffect(() => { persistSetting('notificationsEnabled', String(notificationsEnabled)).catch((e) => console.warn('persist setting failed:', e)); }, [notificationsEnabled]);
  useEffect(() => { persistSetting('darkMode', String(darkMode)).catch((e) => console.warn('persist setting failed:', e)); }, [darkMode]);
  useEffect(() => { persistSetting('hapticFeedback', String(hapticFeedback)).catch((e) => console.warn('persist setting failed:', e)); }, [hapticFeedback]);
  useEffect(() => { persistSetting('prayerAlerts', String(prayerAlerts)).catch((e) => console.warn('persist setting failed:', e)); }, [prayerAlerts]);
  useEffect(() => { persistSetting('smartReminders', String(smartReminders)).catch((e) => console.warn('persist setting failed:', e)); }, [smartReminders]);
  useEffect(() => { persistSetting('muhasabahReminder', String(muhasabahReminder)).catch((e) => console.warn('persist setting failed:', e)); }, [muhasabahReminder]);
  useEffect(() => { persistSetting('quranReminder', String(quranReminder)).catch((e) => console.warn('persist setting failed:', e)); }, [quranReminder]);

  const handleChangeLanguage = () => {
    const targetLang = i18n.language === 'ar' ? 'en' : 'ar';
    Alert.alert(
      t('settings.restartRequired'),
      '',
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.restart'),
          onPress: () => {
            setLanguage(targetLang);
            setAppLanguage(targetLang);
            Updates.reloadAsync().catch(() => {});
          },
        },
      ]
    );
  };

  const handleSaveApiKey = () => {
    setOpenRouterApiKey(apiKeyInput);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 3000);
  };

  const computedLevel = getLevel(noorPoints);
  const computedLevelTitle = getLevelTitle(computedLevel, i18n.language as 'en' | 'ar');

  const currentLanguageLabel = i18n.language === 'ar' ? t('settings.languageArabic') : t('settings.languageEnglish');

  const settingsSections = [
    {
      title: t('settings.prayerSettings'),
      items: [
        { label: t('settings.prayerTimeAlerts'), subtitle: t('settings.prayerTimeAlertsSubtitle'), icon: 'notifications', value: prayerAlerts, onToggle: setPrayerAlerts },
        { label: t('settings.calculationMethod'), subtitle: t('settings.calculationMethodSubtitle'), icon: 'calculator', action: true },
      ],
    },
    {
      title: t('settings.appPreferences'),
      items: [
        { label: t('settings.notifications'), subtitle: t('settings.notificationsSubtitle'), icon: 'mail', value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { label: t('settings.smartReminders'), subtitle: t('settings.smartRemindersSubtitle'), icon: 'alarm', value: smartReminders, onToggle: setSmartReminders },
        { label: t('settings.muhasabahReminder'), subtitle: t('settings.muhasabahReminderSubtitle'), icon: 'journal', value: muhasabahReminder, onToggle: setMuhasabahReminder },
        { label: t('settings.quranReminder'), subtitle: t('settings.quranReminderSubtitle'), icon: 'book', value: quranReminder, onToggle: setQuranReminder },
        { label: t('settings.darkMode'), subtitle: t('settings.darkModeSubtitle'), icon: 'moon', value: darkMode, onToggle: setDarkMode },
        { label: t('settings.hapticFeedback'), subtitle: t('settings.hapticFeedbackSubtitle'), icon: 'phone-portrait', value: hapticFeedback, onToggle: setHapticFeedback },
      ],
    },
    {
          title: t('settings.account'),
          items: [
            { label: t('profile.manageAccount'), subtitle: user?.email || '', icon: 'person-circle', action: true, onPress: () => navigation.navigate('Profile') },
            { label: t('settings.language'), subtitle: currentLanguageLabel, icon: 'language', action: true, onPress: handleChangeLanguage },
            { label: t('settings.privacyPolicy'), subtitle: t('settings.privacyPolicySubtitle'), icon: 'shield-checkmark', action: true },
            { label: t('settings.aboutAlMurshid'), subtitle: t('settings.version'), icon: 'information-circle', action: true },
          ],
        },
  ];

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('settings.title')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center border border-amber-500/30"
          accessibilityLabel="Profile"
        >
          <Ionicons name="person" size={18} color="#fbbf24" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>

        {/* Profile Card */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          className="rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden mb-8 active:opacity-80"
        >
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6 flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mr-4 border-2 border-amber-500/30 shadow-lg">
              <Ionicons name={user?.photoUrl ? 'person-circle' : 'person'} size={32} color="#fbbf24" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{user?.displayName || computedLevelTitle}</Text>
              <Text className="text-emerald-300 text-sm font-medium">
                {user?.email || `${t('settings.profileLevel')} ${computedLevel}`}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="flame" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                <Text className="text-amber-400 text-xs font-bold">{sunnahStreak} {t('settings.activeStreak')}</Text>
                <View className={`ml-3 w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </View>
            </View>
            <Ionicons name={flipIcon('chevron-forward') as any} size={20} color="#6ee7b7" />
          </View>
        </TouchableOpacity>

        {/* Settings Sections */}
        {settingsSections.map((section, sIdx) => (
          <Animated.View key={sIdx} style={{ opacity: sectionOpacities[sIdx], transform: [{ translateY: sectionTranslates[sIdx] }] }} className="mb-8">
            <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4">{section.title}</Text>
            <View className="rounded-3xl shadow-xl border border-emerald-800/40 overflow-hidden">
              <LinearGradient
                colors={['#064e3b', '#022c22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View>
                {section.items.map((item, iIdx) => {
                  const itemAny = item as any;
                  const Wrapper = itemAny.action ? TouchableOpacity : View;
                  return (
                    <Wrapper
                      key={iIdx}
                      onPress={'onPress' in item ? (item as any).onPress : undefined}
                      className={`p-4 flex-row items-center ${iIdx < section.items.length - 1 ? 'border-b border-emerald-800/50' : ''}`}
                    >
                      <View className="w-10 h-10 rounded-full bg-emerald-800/50 items-center justify-center mr-4 border border-emerald-700/50">
                        <Ionicons name={item.icon as any} size={18} color="#6ee7b7" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-emerald-50 font-bold text-base">{item.label}</Text>
                        <Text className="text-emerald-400/60 text-xs font-medium mt-0.5">{item.subtitle}</Text>
                      </View>
                      {'value' in item && item.onToggle ? (
                        <Switch
                          value={item.value as boolean}
                          onValueChange={item.onToggle as (val: boolean) => void}
                          trackColor={{ false: '#064e3b', true: '#f59e0b' }}
                          thumbColor="#ecfdf5"
                        />
                      ) : (
                        <Ionicons name={flipIcon('chevron-forward') as any} size={18} color="#6ee7b7" />
                      )}
                    </Wrapper>
                  );
                })}

              </View>
            </View>
          </Animated.View>
        ))}

        {/* AI Coach Settings */}
        <Animated.View style={{ opacity: sectionOpacities[2], transform: [{ translateY: sectionTranslates[2] }] }}>
          <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4">{t('settings.aiSettings')}</Text>
          <View className="rounded-3xl shadow-xl border border-emerald-800/40 overflow-hidden mb-8">
            <LinearGradient
              colors={['#064e3b', '#022c22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="p-4">
              <Text className="text-emerald-300 text-xs font-medium mb-2">{t('settings.apiKeyLabel')}</Text>
              <TextInput
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="sk-or-..."
                placeholderTextColor="#6ee7b740"
                secureTextEntry
                className="bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-4 py-3 text-emerald-50 text-base mb-3"
              />
              <View className="flex-row items-center justify-between">
                <Text className="text-emerald-400/60 text-xs">
                  {openRouterApiKey ? t('settings.apiKeyStatusSet') : t('settings.apiKeyStatusNotSet')}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveApiKey}
                  className="bg-amber-500 px-6 py-2 rounded-full active:opacity-80"
                >
                  <Text className="text-emerald-950 font-bold text-sm">{t('settings.apiKeySave')}</Text>
                </TouchableOpacity>
              </View>
              {apiKeySaved && (
                <Text className="text-emerald-400 text-xs mt-2">{t('settings.apiKeySaved')}</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Sync Status */}
        <Animated.View style={{ opacity: sectionOpacities[3], transform: [{ translateY: sectionTranslates[3] }] }} className="mb-8">
          <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4">{t('profile.syncTitle')}</Text>
          <View className="rounded-3xl overflow-hidden border border-emerald-800/40">
            <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
            <View className="p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} mr-2`} />
                  <Text className="text-emerald-300 text-sm">{isOnline ? t('profile.online') : t('profile.offline')}</Text>
                </View>
                {isOnline && user ? (
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
                ) : null}
              </View>
              {lastSyncAt && (
                <Text className="text-emerald-500/60 text-xs mt-2">
                  {t('profile.lastSync')}: {new Date(lastSyncAt).toLocaleString()}
                </Text>
              )}
              {tamperDetected && (
                <View className="bg-red-900/30 border border-red-700/40 rounded-xl p-3 mt-3">
                  <Text className="text-red-300 text-xs">{t('profile.tamperWarning')}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Export Data */}
        <Animated.View style={{ opacity: sectionOpacities[3], transform: [{ translateY: sectionTranslates[3] }] }} className="mb-8">
          <TouchableOpacity
            onPress={() => navigation.navigate('Analytics')}
            className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 active:opacity-80 mb-3"
          >
            <View className="bg-emerald-900/60 p-4 flex-row items-center justify-center">
              <Ionicons name="analytics" size={20} color="#6ee7b7" style={{ marginRight: 8 }} />
              <Text className="text-emerald-300 font-bold text-base">{t('settings.viewAnalytics')}</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4">{t('settings.dataExport')}</Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                const json = await exportAllDataAsJson();
                const stats = await getDataStats();
                const total = Object.values(stats).reduce((a: number, b: number) => a + b, 0);
                Alert.alert(
                  t('settings.exportTitle'),
                  t('settings.exportStats', { total, count: Object.keys(stats).length, size: (json.length / 1024).toFixed(1) }),
                  [
                    { text: t('settings.cancel'), style: 'cancel' },
                    { text: t('settings.exportShare'), onPress: () => Share.share({ message: json, title: 'Al-Murshid Data Export' }) },
                  ]
                );
              } catch (e: any) {
                Alert.alert(t('settings.exportFailed'), e.message);
              }
            }}
            className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 active:opacity-80 mb-3"
          >
            <View className="bg-emerald-900/60 p-4 flex-row items-center justify-center">
              <Ionicons name="download-outline" size={20} color="#6ee7b7" style={{ marginRight: 8 }} />
              <Text className="text-emerald-300 font-bold text-base">{t('settings.exportButton')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                const content = await pickJsonFile();
                if (!content) return;
                Alert.alert(
                  t('settings.importTitle'),
                  t('settings.importConfirm'),
                  [
                    { text: t('settings.cancel'), style: 'cancel' },
                    {
                      text: t('settings.importProceed'),
                      onPress: async () => {
                        const result = await importDataFromJson(content);
                        Alert.alert(
                          result.success ? t('settings.importSuccess') : t('settings.importFailed'),
                          result.message,
                        );
                      },
                    },
                  ]
                );
              } catch (e: any) {
                Alert.alert(t('settings.importFailed'), e.message);
              }
            }}
            className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 active:opacity-80 mb-3"
          >
            <View className="bg-emerald-900/60 p-4 flex-row items-center justify-center">
              <Ionicons name="cloud-upload-outline" size={20} color="#6ee7b7" style={{ marginRight: 8 }} />
              <Text className="text-emerald-300 font-bold text-base">{t('settings.importButton')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View style={{ opacity: sectionOpacities[3], transform: [{ translateY: sectionTranslates[3] }] }}>
          <Text className="text-red-400 text-sm font-bold tracking-widest uppercase mb-4 ml-2">{t('settings.dangerZone')}</Text>
          <TouchableOpacity
            onPress={async () => {
              await signOut();
              setUser(null);
              setSyncInfo(null, false);
              resetOnboarding();
            }}
            className="rounded-2xl overflow-hidden shadow-lg border border-red-800/50 active:opacity-80 mb-3"
          >
            <View className="bg-red-950/60 p-4 flex-row items-center justify-center">
              <Ionicons name="trash-outline" size={20} color="#fca5a5" style={{ marginRight: 8 }} />
              <Text className="text-red-300 font-bold text-base">{t('settings.clearAllData')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            className="rounded-2xl overflow-hidden shadow-lg border border-red-800/50 active:opacity-80 mb-4"
          >
            <View className="bg-red-950/60 p-4 flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#fca5a5" style={{ marginRight: 8 }} />
              <Text className="text-red-300 font-bold text-base">{t('auth.signOut')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View className="items-center mt-4 mb-8">
          <Text className="text-emerald-700 text-xs font-medium">{t('settings.appVersion')}</Text>
          <Text className="text-emerald-800 text-xs mt-1">{t('settings.madeWith')}</Text>
        </View>

      </ScrollView>
    </View>
  );
}
