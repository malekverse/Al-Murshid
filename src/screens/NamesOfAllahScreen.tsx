import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // 2 columns, 24px padding sides, 16px gap

// Mock Data for a few names
const namesData = [
  { id: '1', arabic: 'الرَّحْمَنُ', transliteration: 'Ar-Rahman', meaning: 'The Beneficent', benefit: 'Reciting this 100 times after Fard prayers removes hard-heartedness.' },
  { id: '2', arabic: 'الرَّحِيمُ', transliteration: 'Ar-Raheem', meaning: 'The Merciful', benefit: 'Reciting this 100 times protects from all worldly calamities.' },
  { id: '3', arabic: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The Eternal Lord', benefit: 'Reciting this frequently grants financial independence.' },
  { id: '4', arabic: 'الْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Sacred', benefit: 'Reciting this 100 times every day frees the heart from anxiety.' },
  { id: '5', arabic: 'السَّلَامُ', transliteration: 'As-Salam', meaning: 'The Embodiment of Peace', benefit: 'Reciting this 160 times to a sick person helps them recover.' },
  { id: '6', arabic: 'الْمُؤْمِنُ', transliteration: 'Al-Mu\'min', meaning: 'The Infuser of Faith', benefit: 'Reciting this 636 times grants protection from danger.' },
  { id: '7', arabic: 'الْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Preserver of Safety', benefit: 'Reciting this 115 times purifies the soul.' },
  { id: '8', arabic: 'الْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Mighty One', benefit: 'Reciting this 41 times for 40 days grants independence of need from others.' },
];

const FlipCard = ({ item }: { item: typeof namesData[0] }) => {
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
            <Text className="text-amber-300 font-extrabold text-sm uppercase tracking-widest mb-1 text-center">{item.meaning}</Text>
            <View className="w-8 h-px bg-emerald-700/50 my-2 self-center" />
            <Text className="text-teal-50 text-xs text-center leading-relaxed font-medium">{item.benefit}</Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

export default function NamesOfAllahScreen() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Header Overlay */}
      <View className="pt-16 px-6 flex-row justify-between items-center z-10 mb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md"
        >
          <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-emerald-50 text-lg font-bold tracking-wide">Asma-ul-Husna</Text>
          <Text className="text-emerald-400 text-xs font-medium">The 99 Beautiful Names</Text>
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
        renderItem={({ item }) => <FlipCard item={item} />}
        ListHeaderComponent={() => (
          <View className="mb-8 items-center bg-emerald-900/40 p-6 rounded-3xl border border-emerald-800/50">
            <Ionicons name="information-circle-outline" size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
            <Text className="text-emerald-100 text-center text-sm font-medium leading-relaxed mt-2">
              "And to Allah belong the best names, so invoke Him by them." (Quran 7:180)
            </Text>
            <Text className="text-emerald-400/80 text-xs text-center mt-4 uppercase tracking-widest font-bold">Tap a card to flip</Text>
          </View>
        )}
      />
    </View>
  );
}
