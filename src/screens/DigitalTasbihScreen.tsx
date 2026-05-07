import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

const { width } = Dimensions.get('window');

export default function DigitalTasbihScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handleTap = () => {
    // Haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    const newCount = count + 1;
    setCount(newCount);

    // Update Progress Bar
    Animated.timing(progressAnim, {
      toValue: Math.min(newCount / target, 1),
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Target Reached Effect
    if (newCount === target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCount(0);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const cycleTarget = () => {
    Haptics.selectionAsync();
    const targets = [33, 100, 1000];
    const nextIdx = (targets.indexOf(target) + 1) % targets.length;
    setTarget(targets[nextIdx]);

    // Animate progress to match new target
    Animated.timing(progressAnim, {
      toValue: Math.min(count / targets[nextIdx], 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

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
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('tasbih.title')}</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center px-6 pb-20">

        {/* Top Info Cards */}
        <View className="flex-row justify-between w-full mb-12">
          <TouchableOpacity
            onPress={handleReset}
            className="bg-emerald-900/60 px-5 py-3 rounded-2xl border border-emerald-800/60 shadow-lg items-center flex-row"
          >
            <Ionicons name="refresh" size={18} color="#9ca3af" style={{ marginRight: 6 }} />
            <Text className="text-gray-300 font-bold tracking-wider">{t('tasbih.reset')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cycleTarget}
            className="bg-emerald-900/60 px-5 py-3 rounded-2xl border border-emerald-800/60 shadow-lg items-center flex-row"
          >
            <Ionicons name="flag" size={18} color="#fbbf24" style={{ marginRight: 6 }} />
            <Text className="text-amber-400 font-bold tracking-wider">{t('tasbih.target')}: {target}</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Circle & Counter */}
        <View className="items-center justify-center mb-16 relative">
          <Text className="text-amber-400 text-8xl font-extrabold tracking-tighter" style={{ fontVariant: ['tabular-nums'] }}>
            {count}
          </Text>
          <Text className="text-emerald-300 text-lg font-medium mt-2">
            {t('tasbih.subhanAllah')}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="w-full max-w-[280px] h-2 bg-emerald-900/80 rounded-full mb-16 overflow-hidden border border-emerald-800/50 shadow-inner">
          <Animated.View
            className="h-full rounded-full"
            style={{ width: progressWidth }}
          >
            <LinearGradient
              colors={['#f59e0b', '#fbbf24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>

        {/* Main Tap Button */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTap}
          className="shadow-2xl z-20"
        >
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className="w-48 h-48 rounded-full items-center justify-center border-[6px] border-emerald-800/40 shadow-2xl relative overflow-hidden"
          >
            <LinearGradient
              colors={['#059669', '#047857', '#064e3b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Inner rim glow */}
            <View className="absolute inset-0 rounded-full border border-emerald-400/30 m-1" />

            <Ionicons name="finger-print-outline" size={64} color="rgba(251, 191, 36, 0.4)" />
            <Text className="absolute bottom-10 text-emerald-100/50 text-sm font-bold uppercase tracking-widest">{t('tasbih.tap')}</Text>
          </Animated.View>
        </TouchableOpacity>

      </View>
    </View>
  );
}
