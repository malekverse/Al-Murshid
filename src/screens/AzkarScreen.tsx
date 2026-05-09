import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

export default function AzkarScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const azkarCategories = [
    { title: t('azkar.morningAdhkar'), time: t('azkar.afterFajr'), icon: 'partly-sunny', color: '#fbbf24', count: 22, categoryName: 'أذكار الصباح' },
    { title: t('azkar.eveningAdhkar'), time: t('azkar.afterAsr'), icon: 'moon', color: '#93c5fd', count: 22, categoryName: 'أذكار المساء' },
    { title: t('azkar.afterPrayer'), time: t('azkar.postFard'), icon: 'time', color: '#6ee7b7', count: 9, categoryName: 'أذكار بعد السلام من الصلاة المفروضة' },
    { title: t('azkar.beforeSleep'), time: t('azkar.night'), icon: 'bed', color: '#c4b5fd', count: 10, categoryName: 'أذكار النوم' },
    { title: t('azkar.contextualDuas'), time: t('azkar.dailyLife'), icon: 'compass', color: '#fca5a5', count: 40, categoryName: 'Contextual' },
  ];

  // Animation Refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listAnims = useRef(azkarCategories.map(() => new Animated.Value(20))).current;
  const listOpacities = useRef(azkarCategories.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Pulse animation for Open Tasbih button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // Staggered list animation
    const animations = azkarCategories.map((_, i) =>
      Animated.parallel([
        Animated.timing(listOpacities[i], { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(listAnims[i], { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ])
    );
    Animated.stagger(100, animations).start();
  }, []);

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      <View className="px-6 pt-16 pb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">{t('azkar.title')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SmartAdhkar')}
            className="bg-emerald-900/80 p-2 rounded-full border border-emerald-700/50"
            accessibilityLabel="Smart Adhkar"
          >
            <Ionicons name="search" size={20} color="#6ee7b7" />
          </TouchableOpacity>
        </View>
        <Text className="text-emerald-200 text-sm mt-1 font-medium leading-relaxed">
          {t('azkar.quote')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>

        {/* Digital Tasbih Card (Hero) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('DigitalTasbih')}
          className="mb-8"
        >
          <View className="rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden">
            <LinearGradient
              colors={['#064e3b', '#022c22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="p-6">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30">
                  <Ionicons name="finger-print" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                  <Text className="text-amber-400 text-xs font-bold uppercase tracking-widest">{t('azkar.digitalTasbih')}</Text>
                </View>
                <Ionicons name={flipIcon('arrow-forward') as any} size={20} color="#fbbf24" />
              </View>

              <Text className="text-white text-2xl font-bold tracking-wide mb-2">{t('azkar.smartCounter')}</Text>
              <Text className="text-emerald-100/80 text-sm leading-relaxed mb-6 font-medium">
                {t('azkar.tasbihDescription')}
              </Text>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="rounded-full overflow-hidden border-2 border-emerald-600/50">
                <LinearGradient
                  colors={['#065f46', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="py-3 items-center flex-row justify-center">
                  <Text className="text-emerald-50 font-bold tracking-wide">{t('azkar.openTasbih')}</Text>
                </View>
              </Animated.View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 99 Names of Allah Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('NamesOfAllah')}
          className="mb-8 rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden"
        >
          <LinearGradient
            colors={['#0f766e', '#042f2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-5 flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-amber-500/15 items-center justify-center mr-4 border border-amber-500/30">
              <Text className="text-amber-400 text-2xl" style={{ fontFamily: 'sans-serif' }}>ﷲ</Text>
            </View>
            <View className="flex-1">
              <Text className="text-emerald-50 font-bold text-lg mb-0.5">{t('azkar.asmaulHusna')}</Text>
              <Text className="text-emerald-300/80 text-xs font-medium">{t('azkar.asmaulHusnaSubtitle')}</Text>
            </View>
            <Ionicons name={flipIcon('chevron-forward') as any} size={20} color="#fbbf24" />
          </View>
        </TouchableOpacity>

        {/* Categories Section */}
        <Text className="text-emerald-50 text-xl font-bold tracking-wide mb-4">{t('azkar.categories')}</Text>

        <View className="space-y-4">
          {azkarCategories.map((category, idx) => (
            <Animated.View key={idx} style={{ opacity: listOpacities[idx], transform: [{ translateY: listAnims[idx] }] }}>
              <TouchableOpacity
                className="active:opacity-80 mb-4 rounded-2xl overflow-hidden shadow-lg border border-emerald-800/40"
                onPress={() => {
                  if (category.categoryName === 'Contextual') {
                    navigation.navigate('SmartAdhkar');
                  } else {
                    navigation.navigate('AdhkarCategory', {
                      categoryTitle: category.title,
                      categoryName: category.categoryName
                    });
                  }
                }}
              >
                <LinearGradient
                  colors={['#0f766e', '#042f2e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View className="p-5 flex-row items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center mr-4 shadow-md bg-emerald-900/50 border border-emerald-700/50">
                    <Ionicons name={category.icon as any} size={24} color={category.color} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-emerald-50 font-bold text-lg mb-1">{category.title}</Text>
                    <Text className="text-emerald-300/80 text-xs font-medium">{category.time}</Text>
                  </View>

                  <View className="items-end">
                    <View className="bg-teal-900/60 px-2 py-1 rounded-md border border-teal-700/50 mb-1">
                      <Text className="text-teal-200 text-xs font-bold">{category.count} {t('azkar.duas')}</Text>
                    </View>
                    <Ionicons name={flipIcon('chevron-forward') as any} size={16} color="#6ee7b7" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
