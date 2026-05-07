import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

// Load local JSON data
const azkarData = require('../data/azkar.json');

export default function AdhkarCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { categoryTitle, categoryName } = route.params || {};
  const { t } = useTranslation();

  // Retrieve adhkars for the selected category.
  const adhkars = azkarData[categoryName] || [];

  // Normalize structure
  const normalizedAdhkars = Array.isArray(adhkars)
    ? adhkars.flat().filter((item: any) => item && item.content && item.content !== 'stop')
    : [];

  // Keep track of counts
  const [counts, setCounts] = useState<{ [key: number]: number }>(
    normalizedAdhkars.reduce((acc: any, curr: any, idx: number) => {
      const targetCount = parseInt(curr.count) || 1;
      acc[idx] = targetCount;
      return acc;
    }, {})
  );

  const handlePress = (idx: number) => {
    setCounts((prev) => ({
      ...prev,
      [idx]: Math.max(0, prev[idx] - 1),
    }));
  };

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
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{categoryTitle || categoryName}</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        <View className="mb-6 mt-2">
          <Text className="text-amber-400 text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'sans-serif' }}>
            {categoryName}
          </Text>
          <Text className="text-emerald-200 text-sm mt-2 font-medium leading-relaxed">
            {t('adhkarCategory.readCarefully')}
          </Text>
        </View>

        {normalizedAdhkars.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-emerald-300 mt-4 font-medium">{t('adhkarCategory.noAdhkar')}</Text>
          </View>
        ) : (
          <View className="space-y-6">
            {normalizedAdhkars.map((adhkar: any, idx: number) => {
              const currentCount = counts[idx] || 0;
              const isCompleted = currentCount === 0;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => handlePress(idx)}
                  disabled={isCompleted}
                >
                  <Animated.View
                    style={{ opacity: isCompleted ? 0.6 : 1 }}
                    className={`rounded-3xl shadow-xl overflow-hidden mb-6 border ${
                      isCompleted ? 'border-emerald-900/50' : 'border-emerald-700/40'
                    }`}
                  >
                    <LinearGradient
                      colors={isCompleted ? ['#022c22', '#022c22'] : ['#064e3b', '#022c22']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />

                    {/* Badge */}
                    <View className="bg-emerald-950/80 px-4 py-2 flex-row items-center justify-between border-b border-emerald-800/50">
                      <View className="flex-row items-center">
                        <Ionicons name="book" size={14} color="#fbbf24" style={{ marginRight: 6 }} />
                        <Text className="text-emerald-200 text-xs font-bold uppercase tracking-widest">
                          {t('adhkarCategory.dhikr')} {idx + 1}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${isCompleted ? 'bg-emerald-800' : 'bg-amber-500/20'}`}>
                        <Text className={`text-[10px] font-bold ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isCompleted ? t('adhkarCategory.completed') : `${t('adhkarCategory.repeat')}: ${currentCount}`}
                        </Text>
                      </View>
                    </View>

                    <View className="p-6">
                      <Text
                        className="text-emerald-50 text-2xl text-right leading-[44px] mb-4"
                        style={{ fontFamily: 'sans-serif', writingDirection: 'rtl' }}
                      >
                        {adhkar.content}
                      </Text>

                      {adhkar.description ? (
                        <>
                          <View className="h-px w-full bg-emerald-800/50 mb-4" />
                          <Text className="text-emerald-300/80 text-sm font-medium leading-relaxed italic text-right" style={{ writingDirection: 'rtl' }}>
                            {adhkar.description}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
