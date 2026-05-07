import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';
import { flipIcon } from '../utils/rtl';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const { t, i18n } = useTranslation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [prayerAlerts, setPrayerAlerts] = useState(true);

  // Animations
  const sectionOpacities = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const sectionTranslates = useRef([new Animated.Value(20), new Animated.Value(20), new Animated.Value(20)]).current;

  useEffect(() => {
    const animations = sectionOpacities.map((_, i) =>
      Animated.parallel([
        Animated.timing(sectionOpacities[i], { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(sectionTranslates[i], { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ])
    );
    Animated.stagger(150, animations).start();
  }, []);

  const handleChangeLanguage = () => {
    const targetLang = i18n.language === 'ar' ? 'en' : 'ar';
    // Instant switch — no restart needed for text
    setLanguage(targetLang);
    setAppLanguage(targetLang);
  };

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
        { label: t('settings.darkMode'), subtitle: t('settings.darkModeSubtitle'), icon: 'moon', value: darkMode, onToggle: setDarkMode },
        { label: t('settings.hapticFeedback'), subtitle: t('settings.hapticFeedbackSubtitle'), icon: 'phone-portrait', value: hapticFeedback, onToggle: setHapticFeedback },
      ],
    },
    {
      title: t('settings.account'),
      items: [
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
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('settings.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>

        {/* Profile Card */}
        <View className="rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6 flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mr-4 border-2 border-amber-500/30 shadow-lg">
              <Ionicons name="person" size={32} color="#fbbf24" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{t('settings.profileName')}</Text>
              <Text className="text-emerald-300 text-sm font-medium">{t('settings.profileLevel')}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="flame" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                <Text className="text-amber-400 text-xs font-bold">{t('settings.activeStreak')}</Text>
              </View>
            </View>
            <Ionicons name={flipIcon('chevron-forward') as any} size={20} color="#6ee7b7" />
          </View>
        </View>

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
                  const Wrapper = item.action ? TouchableOpacity : View;
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

        {/* Danger Zone */}
        <Animated.View style={{ opacity: sectionOpacities[2], transform: [{ translateY: sectionTranslates[2] }] }}>
          <Text className="text-red-400 text-sm font-bold tracking-widest uppercase mb-4 ml-2">{t('settings.dangerZone')}</Text>
          <TouchableOpacity
            onPress={resetOnboarding}
            className="rounded-2xl overflow-hidden shadow-lg border border-red-800/50 active:opacity-80 mb-4"
          >
            <View className="bg-red-950/60 p-4 flex-row items-center justify-center">
              <Ionicons name="trash-outline" size={20} color="#fca5a5" style={{ marginRight: 8 }} />
              <Text className="text-red-300 font-bold text-base">{t('settings.clearAllData')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View className="items-center mt-4 mb-8">
          <Text className="text-emerald-700 text-xs font-medium">Al-Murshid v1.0.0</Text>
          <Text className="text-emerald-800 text-xs mt-1">{t('settings.madeWith')}</Text>
        </View>

      </ScrollView>
    </View>
  );
}
