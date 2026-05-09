import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { getAllBookmarks, removeBookmark, QuranBookmark } from '../services/data/quranBookmarkService';

export default function QuranBookmarksScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadBookmarks();
  }, []));

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const bm = await getAllBookmarks();
      setBookmarks(bm);
    } catch {}
    setLoading(false);
  };

  const handleRemove = async (surahNum: number, ayahNum: number) => {
    await removeBookmark(surahNum, ayahNum);
    await loadBookmarks();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }} />

      <View className="px-6 pt-16 pb-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-emerald-800/60 items-center justify-center border border-emerald-700/50 mr-4">
            <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
          </TouchableOpacity>
          <Text className="text-emerald-50 text-2xl font-bold">{t('quran.bookmarks')}</Text>
        </View>
      </View>

      {bookmarks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bookmark-outline" size={64} color={colors.textMuted} />
          <Text className="text-emerald-400/60 text-base text-center mt-4 font-medium">{t('quran.noBookmarks')}</Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => `${item.surah_number}-${item.ayah_number}`}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View className="rounded-2xl overflow-hidden shadow-lg border border-emerald-800/50 mb-3">
              <LinearGradient colors={['#064e3b', '#022c22']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-emerald-50 text-base font-bold">{item.surah_name}</Text>
                  <Text className="text-emerald-300 text-sm font-medium">{t('quran.ayat')} {item.ayah_number}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(item.surah_number, item.ayah_number)}
                  className="w-9 h-9 rounded-full bg-red-900/40 items-center justify-center border border-red-800/50"
                >
                  <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
