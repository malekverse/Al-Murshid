import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { setAppLanguage } from '../i18n';
import { flipIcon } from '../utils/rtl';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const [step, setStep] = useState(0);

  const handleSelectLanguage = (lang: 'en' | 'ar') => {
    // Synchronous — text updates instantly
    setLanguage(lang);
    setAppLanguage(lang);
    setStep(1);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <StatusBar style="light" />
      <View className="flex-1">
        <LinearGradient
          colors={['#022c22', '#064e3b', '#022c22']}
          style={StyleSheet.absoluteFillObject}
        />
        <View className="flex-1 items-center justify-center p-8 relative">
          {/* Background decorative element */}
          <Ionicons name="moon" size={300} color="rgba(251, 191, 36, 0.03)" style={{ position: 'absolute', top: -50, right: -100 }} />

          {/* Step 0: Language Selector */}
          {step === 0 && (
            <View className="items-center w-full mt-10">
              <View className="bg-amber-500/20 p-6 rounded-full mb-8 border border-amber-500/30 shadow-2xl">
                <Ionicons name="language" size={64} color="#fbbf24" />
              </View>
              <Text className="text-5xl font-extrabold text-amber-400 mb-4 text-center tracking-tighter">
                المُرشِد
              </Text>
              <Text className="text-2xl font-bold text-amber-300/60 mb-6 text-center">
                Al-Murshid
              </Text>
              <Text className="text-lg text-emerald-100 text-center mb-12 leading-relaxed font-medium">
                اختر لغتك / Choose Your Language
              </Text>

              {/* Arabic Button — Primary */}
              <TouchableOpacity
                onPress={() => handleSelectLanguage('ar')}
                className="w-full mb-4 shadow-lg active:opacity-80 rounded-2xl overflow-hidden border border-amber-500/30"
              >
                <LinearGradient
                  colors={['#064e3b', '#022c22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="p-5 flex-row items-center justify-between">
                  <Text className="text-emerald-50 font-bold text-xl" style={{ fontFamily: 'sans-serif' }}>العربية</Text>
                  <Ionicons name={flipIcon('chevron-forward') as any} size={20} color="#fbbf24" />
                </View>
              </TouchableOpacity>

              {/* English Button */}
              <TouchableOpacity
                onPress={() => handleSelectLanguage('en')}
                className="w-full mb-4 shadow-lg active:opacity-80 rounded-2xl overflow-hidden border border-emerald-500/30"
              >
                <LinearGradient
                  colors={['#065f46', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="p-5 flex-row items-center justify-between">
                  <Text className="text-emerald-50 font-bold text-xl">English</Text>
                  <Ionicons name={flipIcon('chevron-forward') as any} size={20} color="#6ee7b7" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 1: Welcome */}
          {step === 1 && (
            <View className="items-center w-full mt-10">
              <View className="bg-amber-500/20 p-6 rounded-full mb-8 border border-amber-500/30 shadow-2xl">
                <Ionicons name="compass" size={64} color="#fbbf24" />
              </View>
              <Text className="text-5xl font-extrabold text-amber-400 mb-6 text-center tracking-tighter">
                {t('onboarding.welcome')}
              </Text>
              <Text className="text-xl text-emerald-100 text-center mb-16 leading-relaxed font-medium">
                {t('onboarding.welcomeSubtitle')}
              </Text>
              <TouchableOpacity
                onPress={handleNext}
                className="w-full shadow-2xl active:opacity-80 rounded-full overflow-hidden"
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-4 items-center flex-row justify-center">
                  <Text className="text-emerald-950 font-extrabold text-xl tracking-wide mr-2">{t('onboarding.enterMithaq')}</Text>
                  <Ionicons name={flipIcon('arrow-forward') as any} size={24} color="#022c22" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Struggles */}
          {step === 2 && (
            <View className="items-center w-full mt-10">
              <Ionicons name="chatbubbles" size={48} color="#fbbf24" style={{ marginBottom: 24 }} />
              <Text className="text-2xl font-serif text-amber-100 mb-12 text-center italic leading-loose" style={{ fontFamily: 'sans-serif' }}>
                {t('onboarding.mentorQuestion')}
              </Text>

              {[t('onboarding.struggle1'), t('onboarding.struggle2'), t('onboarding.struggle3')].map((struggle, idx) => (
                <TouchableOpacity key={idx} onPress={handleNext} className="w-full mb-4 shadow-lg active:opacity-80 rounded-2xl overflow-hidden border border-emerald-500/30">
                  <LinearGradient
                    colors={['#065f46', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View className="p-5 flex-row items-center justify-between">
                    <Text className="text-emerald-50 font-bold text-lg">{struggle}</Text>
                    <Ionicons name={flipIcon('chevron-forward') as any} size={20} color="#6ee7b7" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 3: Encouragement */}
          {step === 3 && (
            <View className="items-center w-full mt-10">
              <Ionicons name="leaf" size={48} color="#fbbf24" style={{ marginBottom: 24 }} />
              <Text className="text-2xl font-serif text-emerald-100 mb-12 text-center italic leading-loose" style={{ fontFamily: 'sans-serif' }}>
                {t('onboarding.mentorEncouragement')}
              </Text>
              <TouchableOpacity
                onPress={handleNext}
                className="w-full shadow-2xl active:opacity-80 mt-8 rounded-full overflow-hidden"
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-4 items-center flex-row justify-center">
                  <Text className="text-emerald-950 font-extrabold text-xl tracking-wide mr-2">{t('onboarding.beginJourney')}</Text>
                  <Ionicons name="star" size={24} color="#022c22" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
