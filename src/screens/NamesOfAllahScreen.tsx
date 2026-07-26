import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { flipIcon } from '../utils/rtl';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // 2 columns, 24px padding sides, 16px gap

const rawAsmaData = require('../data/asmaulhusna.json');
const namesData = rawAsmaData.data.map((item: any) => ({
  id: item.number.toString(),
  arabic: item.name,
  transliteration: item.transliteration,
  meaningEn: item.en.meaning,
  // we will map the rest dynamically in the component to support translation
}));

const FlipCard = ({ item, t, currentLang }: { item: typeof namesData[0], t: any, currentLang: string }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={flipCard} style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.2, marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        {/* Front of Card */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backfaceVisibility: 'hidden', transform: [{ rotateY: frontInterpolate }] }
          ]}
          className="rounded-3xl shadow-xl border border-amber-500/30 overflow-hidden"
        >
          <LinearGradient colors={['#064e3b', '#022c22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-amber-400 text-4xl mb-4 text-center" style={{ fontFamily: 'sans-serif' }}>{item.arabic}</Text>
            <Text className="text-emerald-100 font-bold tracking-wide text-center">{item.transliteration}</Text>
            <View className="absolute bottom-3 right-3 opacity-30">
              <Ionicons name="sync" size={16} color="#fbbf24" />
            </View>
          </View>
        </Animated.View>

        {/* Back of Card */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backfaceVisibility: 'hidden', transform: [{ rotateY: backInterpolate }] }
          ]}
          className="rounded-3xl shadow-xl border border-teal-600/40 overflow-hidden"
        >
          <LinearGradient colors={['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View className="flex-1 p-4 justify-center">
            {currentLang !== 'ar' && (
              <Text className="text-amber-300 font-extrabold text-sm uppercase tracking-widest mb-1 text-center">{item.meaningEn}</Text>
            )}
            <View className="w-8 h-px bg-emerald-700/50 my-2 self-center" />
            
            <Text className="text-teal-50 text-xs text-center leading-relaxed font-medium">
              {t('namesOfAllah.benefitPrefix')} <Text className="text-amber-400 font-bold">{currentLang !== 'ar' ? item.transliteration : item.arabic}</Text> {t('namesOfAllah.benefitSuffix')} <Text className="font-bold">{currentLang !== 'ar' ? item.meaningEn : item.arabic}</Text>.
            </Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

export default function NamesOfAllahScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header Overlay */}
      <View className="pt-16 px-6 flex-row justify-between items-center z-10 mb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-emerald-50 text-lg font-bold tracking-wide">{t('namesOfAllah.title')}</Text>
          <Text className="text-emerald-400 text-xs font-medium">{t('namesOfAllah.subtitle')}</Text>
        </View>
        <View className="w-10" />
      </View>

      <FlatList
        data={namesData}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <FlipCard item={item} t={t} currentLang={i18n.language} />}
        ListHeaderComponent={() => (
          <View className="mb-8 items-center bg-emerald-900/40 p-6 rounded-3xl border border-emerald-800/50">
            <Ionicons name="information-circle-outline" size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
            <Text className="text-emerald-100 text-center text-sm font-medium leading-relaxed mt-2">
              {t('namesOfAllah.quranVerse')}
            </Text>
            <Text className="text-emerald-400/80 text-xs text-center mt-4 uppercase tracking-widest font-bold">{t('namesOfAllah.tapToFlip')}</Text>
          </View>
        )}
      />
    </View>
  );
}
