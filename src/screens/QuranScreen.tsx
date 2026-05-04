import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, FlatList, Dimensions, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fetchSurahList, fetchSurahDetail, fetchMushafPage, TOTAL_MUSHAF_PAGES } from '../services/quranService';
import type { SurahMeta, Ayah, MushafPageAyah, MushafPageData } from '../services/quranService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ViewMode = 'list' | 'detail' | 'mushaf';

export default function QuranScreen() {
  const navigation = useNavigation<any>();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Surah List (all 114 from API)
  const [surahList, setSurahList] = useState<SurahMeta[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Surah Detail (Translation Mode)
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [arabicAyahs, setArabicAyahs] = useState<Ayah[]>([]);
  const [translationAyahs, setTranslationAyahs] = useState<Ayah[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Mushaf Page Mode
  const [currentPage, setCurrentPage] = useState(1);
  const [mushafLoading, setMushafLoading] = useState(false);
  const [mushafFontSize, setMushafFontSize] = useState(22);
  const [goToPageText, setGoToPageText] = useState('');
  const [showGoTo, setShowGoTo] = useState(false);
  const pageCache = useRef<Map<number, MushafPageData>>(new Map());
  const hListRef = useRef<FlatList>(null);
  // Pages array for horizontal FlatList — always [currentPage-1, currentPage, currentPage+1]
  const [pageWindow, setPageWindow] = useState<number[]>([]);

  // Tarteel-like Features
  const [hifzMode, setHifzMode] = useState(false);
  const [revealedAyahs, setRevealedAyahs] = useState<Set<string>>(new Set());

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAyahId, setPlayingAyahId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentAudioQueue = useRef<MushafPageAyah[]>([]);
  const currentAudioIndex = useRef<number>(0);

  // Load all 114 Surahs on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSurahList();
        setSurahList(data);
      } catch (e) {
        console.error('Failed to load surah list:', e);
      } finally {
        setListLoading(false);
      }
    })();
  }, []);

  const openSurah = async (surah: SurahMeta) => {
    setSelectedSurah(surah);
    setViewMode('detail');
    setDetailLoading(true);
    try {
      const detail = await fetchSurahDetail(surah.number);
      setArabicAyahs(detail.arabic);
      setTranslationAyahs(detail.translation);
    } catch (e) {
      console.error('Failed to load surah detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch a page (with cache)
  const fetchPage = async (p: number): Promise<MushafPageData | null> => {
    if (p < 1 || p > TOTAL_MUSHAF_PAGES) return null;
    if (pageCache.current.has(p)) return pageCache.current.get(p)!;
    try {
      const data = await fetchMushafPage(p);
      pageCache.current.set(p, data);
      return data;
    } catch { return null; }
  };

  // Build a window of pages [prev, current, next] and prefetch all 3
  const navigateToPage = async (page: number) => {
    if (page < 1 || page > TOTAL_MUSHAF_PAGES) return;
    setMushafLoading(!pageCache.current.has(page));
    setCurrentPage(page);

    // Fetch current page first (may already be cached)
    await fetchPage(page);
    setMushafLoading(false);

    // Build window
    const win: number[] = [];
    if (page > 1) win.push(page - 1);
    win.push(page);
    if (page < TOTAL_MUSHAF_PAGES) win.push(page + 1);
    setPageWindow(win);

    // Prefetch neighbors in background
    if (page > 1) fetchPage(page - 1);
    if (page < TOTAL_MUSHAF_PAGES) fetchPage(page + 1);
    // Also prefetch +2 ahead
    if (page + 2 <= TOTAL_MUSHAF_PAGES) fetchPage(page + 2);

    // Scroll to center (current page)
    setTimeout(() => {
      hListRef.current?.scrollToIndex({ index: page > 1 ? 1 : 0, animated: false });
    }, 50);
  };

  const openMushafMode = async () => {
    setViewMode('mushaf');
    try {
      const saved = await AsyncStorage.getItem('mushaf_last_page');
      navigateToPage(saved ? parseInt(saved) : 1);
    } catch {
      navigateToPage(1);
    }
  };

  // Persist last-read page
  useEffect(() => {
    if (viewMode === 'mushaf' && currentPage > 0) {
      AsyncStorage.setItem('mushaf_last_page', String(currentPage)).catch(() => { });
    }
  }, [currentPage, viewMode]);

  const handleGoToPage = () => {
    const p = parseInt(goToPageText);
    if (p >= 1 && p <= TOTAL_MUSHAF_PAGES) {
      navigateToPage(p);
      setShowGoTo(false);
      setGoToPageText('');
    }
  };

  // When the user swipes to a new page in the horizontal FlatList
  const onMushafPageChange = (index: number) => {
    const newPage = pageWindow[index];
    if (newPage && newPage !== currentPage) {
      navigateToPage(newPage);
    }
  };

  const stopAudio = async () => {
    setIsPlaying(false);
    setPlayingAyahId(null);
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const playNextAyah = async () => {
    if (currentAudioIndex.current >= currentAudioQueue.current.length) {
      stopAudio();
      return;
    }

    const ayah = currentAudioQueue.current[currentAudioIndex.current];
    if (!ayah.audio) {
      currentAudioIndex.current++;
      playNextAyah();
      return;
    }

    const ayahId = `${ayah.surahNumber}:${ayah.numberInSurah}`;
    setPlayingAyahId(ayahId);

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: ayah.audio },
        { shouldPlay: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          currentAudioIndex.current++;
          playNextAyah();
        }
      });
    } catch (e) {
      console.warn("Failed to play audio:", e);
      stopAudio();
    }
  };

  const togglePlayPage = async () => {
    if (isPlaying) {
      await stopAudio();
      return;
    }
    const pageData = pageCache.current.get(currentPage);
    if (!pageData || !pageData.ayahs.length) return;

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    currentAudioQueue.current = pageData.ayahs;
    currentAudioIndex.current = 0;
    setIsPlaying(true);
    playNextAyah();
  };

  useEffect(() => {
    return () => { stopAudio(); };
  }, []);

  useEffect(() => {
    stopAudio();
    setRevealedAyahs(new Set());
  }, [currentPage]);

  const toggleAyahReveal = (ayahId: string) => {
    setRevealedAyahs(prev => {
      const next = new Set(prev);
      if (next.has(ayahId)) next.delete(ayahId);
      else next.add(ayahId);
      return next;
    });
  };

  const goBack = () => {
    setViewMode('list');
    setArabicAyahs([]);
    setTranslationAyahs([]);
  };

  const filteredSurahs = surahList.filter(
    s => s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery
  );

  // ═══════════════════════════════════════════
  // MUSHAF MODE — Page-by-page like the book
  // ═══════════════════════════════════════════
  // ═══════════════════════════════════════════
  // MUSHAF MODE — Page-by-page like the book
  // ═══════════════════════════════════════════
  if (viewMode === 'mushaf') {
    const currentMushafData = pageCache.current.get(currentPage);
    const juzNumber = currentMushafData?.ayahs[0]?.juz;
    const hizbQ = currentMushafData?.ayahs[0]?.hizbQuarter;
    const hizbLabel = hizbQ ? `Hizb ${Math.ceil(hizbQ / 4)} · Quarter ${((hizbQ - 1) % 4) + 1}` : '';

    return (
      <View style={{ flex: 1, backgroundColor: '#e8f5e9' }}>
        <StatusBar style="dark" />

        {/* Top Bar */}
        <View style={mStyles.topBar}>
          <TouchableOpacity onPress={goBack} style={mStyles.topBtn}>
            <Ionicons name="arrow-back" size={18} color="#065f46" />
          </TouchableOpacity>

          {showGoTo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 8 }}>
              <TextInput
                value={goToPageText}
                onChangeText={setGoToPageText}
                placeholder="Page 1–604"
                placeholderTextColor="#6b9080"
                keyboardType="number-pad"
                autoFocus
                onSubmitEditing={handleGoToPage}
                style={mStyles.goToInput}
              />
              <TouchableOpacity onPress={handleGoToPage} style={[mStyles.topBtn, { marginLeft: 6 }]}>
                <Ionicons name="arrow-forward" size={16} color="#065f46" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowGoTo(false); setGoToPageText(''); }} style={[mStyles.topBtn, { marginLeft: 4 }]}>
                <Ionicons name="close" size={16} color="#065f46" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowGoTo(true)} style={{ flex: 1, alignItems: 'center', marginHorizontal: 8 }}>
              <Text style={{ color: '#064e3b', fontSize: 14, fontWeight: '800' }}>Page {currentPage}</Text>
              <Text style={{ color: '#047857', fontSize: 9, fontWeight: '600' }}>
                Juz {juzNumber || '—'} · {hizbLabel}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setHifzMode(!hifzMode)} style={[mStyles.topBtn, { marginRight: 4, backgroundColor: hifzMode ? '#059669' : '#bbf7d0' }]}>
            <Ionicons name="eye-off" size={14} color={hifzMode ? '#ffffff' : '#065f46'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayPage} style={[mStyles.topBtn, { marginRight: 8, backgroundColor: isPlaying ? '#059669' : '#bbf7d0' }]}>
            <Ionicons name={isPlaying ? "stop" : "play"} size={14} color={isPlaying ? '#ffffff' : '#065f46'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMushafFontSize(s => Math.max(16, s - 2))} style={[mStyles.topBtn, { marginRight: 4 }]}>
            <Text style={{ color: '#065f46', fontWeight: '900', fontSize: 12 }}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMushafFontSize(s => Math.min(34, s + 2))} style={[mStyles.topBtn, { marginRight: 8 }]}>
            <Text style={{ color: '#065f46', fontWeight: '900', fontSize: 14 }}>A+</Text>
          </TouchableOpacity>
        </View>

        {mushafLoading && !currentMushafData ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4' }}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={{ color: '#065f46', marginTop: 16, fontWeight: '600' }}>Loading page…</Text>
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
            <FlatList
              ref={hListRef}
              data={pageWindow}
              keyExtractor={item => String(item)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={pageWindow.length > 1 ? 1 : 0}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / SCREEN_WIDTH);
                onMushafPageChange(index);
              }}
              renderItem={({ item }) => {
                const pageData = pageCache.current.get(item);
                if (!pageData) {
                  return (
                    <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color="#059669" />
                    </View>
                  );
                }

                const surahHeaders = Object.values(pageData.surahs);

                return (
                  <View style={{ width: SCREEN_WIDTH }}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                      <View style={mStyles.ornamentBar}>
                        <View style={mStyles.ornamentLine} />
                        <Text style={mStyles.ornamentStar}>✦</Text>
                        <View style={mStyles.ornamentLine} />
                      </View>

                      {surahHeaders.map((s: any) => {
                        const firstAyah = pageData.ayahs.find(a => a.surahNumber === s.number && a.numberInSurah === 1);
                        if (!firstAyah) return null;
                        return (
                          <View key={s.number} style={mStyles.surahHeader}>
                            <View style={mStyles.surahDecorLeft}><Text style={mStyles.surahDecorText}>❁</Text></View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                              <Text style={mStyles.surahArabicName}>{s.name}</Text>
                              <Text style={mStyles.surahEngName}>{s.englishName}</Text>
                            </View>
                            <View style={mStyles.surahDecorRight}><Text style={mStyles.surahDecorText}>❁</Text></View>
                            {s.number !== 9 && s.number !== 1 && (
                              <Text style={[mStyles.bismillah, { fontSize: mushafFontSize }]}>
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      <View style={[mStyles.textFrame, { marginHorizontal: 12 }]}>
                        <Text
                          style={[mStyles.quranText, { fontSize: mushafFontSize, lineHeight: mushafFontSize * 2.1 }]}
                          selectable={true}
                        >
                          {pageData.ayahs.map((ayah) => {
                            const arabicNum = ayah.numberInSurah.toString().replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
                            const ayahText = ayah.text + ' \uFD3F' + arabicNum + '\uFD3E ';
                            const ayahId = `${ayah.surahNumber}:${ayah.numberInSurah}`;
                            const isRevealed = revealedAyahs.has(ayahId);
                            const isHidden = hifzMode && !isRevealed;
                            const isCurrentlyPlaying = playingAyahId === ayahId;

                            return (
                              <Text
                                key={ayahId}
                                onPress={() => {
                                  if (hifzMode) toggleAyahReveal(ayahId);
                                }}
                                style={[
                                  isHidden && { color: 'transparent', backgroundColor: '#a7f3d0' },
                                  isCurrentlyPlaying && !isHidden && { color: '#059669', backgroundColor: '#dcfce7' }
                                ]}
                              >
                                {ayahText}
                              </Text>
                            );
                          })}
                        </Text>
                      </View>

                      <View style={mStyles.ornamentBar}>
                        <View style={mStyles.ornamentLine} />
                        <Text style={mStyles.ornamentStar}>✦</Text>
                        <View style={mStyles.ornamentLine} />
                      </View>
                    </ScrollView>
                  </View>
                );
              }}
            />

            {/* Footer */}
            <View style={mStyles.footer}>
              <TouchableOpacity
                onPress={() => navigateToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                style={[mStyles.navBtn, currentPage <= 1 && { opacity: 0.25 }]}
              >
                <Ionicons name="chevron-back" size={18} color="#065f46" />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#064e3b', fontSize: 16, fontWeight: '800' }}>{currentPage}</Text>
                <Text style={{ color: '#047857', fontSize: 8, fontWeight: '600' }}>of {TOTAL_MUSHAF_PAGES}</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigateToPage(currentPage + 1)}
                disabled={currentPage >= TOTAL_MUSHAF_PAGES}
                style={[mStyles.navBtn, currentPage >= TOTAL_MUSHAF_PAGES && { opacity: 0.25 }]}
              >
                <Ionicons name="chevron-forward" size={18} color="#065f46" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // DETAIL VIEW — Ayah-by-ayah with translation
  // ═══════════════════════════════════════════
  if (viewMode === 'detail' && selectedSurah) {
    return (
      <View className="flex-1 bg-emerald-950">
        <StatusBar style="light" />

        {/* Detail Header */}
        <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
          <TouchableOpacity
            onPress={goBack}
            className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          >
            <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
          </TouchableOpacity>
          <View className="items-center flex-1 mx-4">
            <Text className="text-emerald-50 text-lg font-bold tracking-wide" numberOfLines={1}>{selectedSurah.englishName}</Text>
            <Text className="text-emerald-400 text-xs font-medium">{selectedSurah.englishNameTranslation} • {selectedSurah.numberOfAyahs} Ayat</Text>
          </View>
          <View className="bg-emerald-900/60 px-3 py-1.5 rounded-full border border-emerald-700/50">
            <Text className="text-emerald-200 text-xs font-bold">{selectedSurah.revelationType}</Text>
          </View>
        </View>

        {detailLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#fbbf24" />
            <Text className="text-emerald-300 mt-4 font-medium">Loading Surah…</Text>
          </View>
        ) : (
          <FlatList
            data={arabicAyahs}
            keyExtractor={(item) => String(item.numberInSurah)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
            ListHeaderComponent={() => (
              <>
                {selectedSurah.number !== 9 && (
                  <View className="rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden mb-6">
                    <LinearGradient colors={['#064e3b', '#022c22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                    <View className="py-6 items-center">
                      <Text className="text-amber-400 text-2xl text-center px-4" style={{ fontFamily: 'sans-serif', lineHeight: 42 }}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </Text>
                      <Text className="text-emerald-300/60 text-xs mt-2 font-medium">In the name of Allah, the Entirely Merciful, the Especially Merciful</Text>
                    </View>
                  </View>
                )}
                <View className="bg-emerald-900/30 rounded-2xl p-4 mb-4 border border-emerald-800/30 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="book-outline" size={16} color="#6ee7b7" style={{ marginRight: 6 }} />
                    <Text className="text-emerald-300/80 text-xs font-medium">Juz {arabicAyahs[0]?.juz} • Page {arabicAyahs[0]?.page}</Text>
                  </View>
                  <Text className="text-emerald-400/60 text-xs font-bold uppercase tracking-wider">
                    Uthmani • Saheeh Int'l
                  </Text>
                </View>
              </>
            )}
            renderItem={({ item, index }) => {
              const translation = translationAyahs[index];
              return (
                <View className="mb-4 rounded-2xl shadow-lg border border-emerald-800/30 overflow-hidden">
                  <LinearGradient colors={['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                  <View className="p-5">
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="w-8 h-8 rounded-full bg-teal-800/80 items-center justify-center border border-teal-600/50">
                        <Text className="text-teal-200 text-xs font-bold">{item.numberInSurah}</Text>
                      </View>
                      {item.sajda && (
                        <View className="bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                          <Text className="text-amber-400 text-[10px] font-bold">۩ SAJDA</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-amber-300 text-right leading-loose mb-4" style={{ fontFamily: 'sans-serif', fontSize: 22, lineHeight: 44 }}>
                      {item.text}
                    </Text>
                    {translation && (
                      <Text className="text-teal-50 text-sm leading-relaxed font-medium">{translation.text}</Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // LIST VIEW — All 114 Surahs
  // ═══════════════════════════════════════════
  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="px-6 pt-16 pb-4">
        <Text className="text-amber-400 text-3xl font-extrabold tracking-tight">The Noble Quran</Text>
        <Text className="text-emerald-200 text-sm mt-1 font-medium">114 Surahs • 6,236 Ayat</Text>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <View className="bg-emerald-900/60 rounded-2xl border border-emerald-800/50 flex-row items-center px-4 py-1">
          <Ionicons name="search" size={18} color="#6ee7b7" style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, number, or meaning…"
            placeholderTextColor="rgba(110, 231, 183, 0.3)"
            className="flex-1 text-emerald-50 text-base font-medium py-3"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#6ee7b7" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {listLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text className="text-emerald-300 mt-4 font-medium">Loading Quran data…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(item) => String(item.number)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          ListHeaderComponent={() => (
            <>
              {/* Reading Mode Cards */}
              <View className="flex-row mb-4" style={{ gap: 12 }}>
                {/* Mushaf Mode Card */}
                <TouchableOpacity
                  onPress={openMushafMode}
                  activeOpacity={0.9}
                  className="flex-1 rounded-2xl shadow-xl border border-emerald-500/30 overflow-hidden"
                  style={{ backgroundColor: '#f0fdf4' }}
                >
                  <View className="p-4 items-center">
                    <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2 border border-emerald-300">
                      <Text style={{ fontSize: 22 }}>📖</Text>
                    </View>
                    <Text style={{ color: '#064e3b', fontWeight: '800', fontSize: 13 }}>Mushaf</Text>
                    <Text style={{ color: '#047857', fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 2 }}>Page-by-page{'\n'}like the book</Text>
                  </View>
                </TouchableOpacity>

                {/* Khatmah Planner Card */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Khatmah')}
                  activeOpacity={0.9}
                  className="flex-1 rounded-2xl shadow-xl border border-amber-500/20 overflow-hidden"
                >
                  <LinearGradient colors={['#0f766e', '#042f2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                  <View className="p-4 items-center">
                    <View className="w-12 h-12 rounded-full bg-amber-500/15 items-center justify-center mb-2 border border-amber-500/30">
                      <Ionicons name="ribbon" size={22} color="#fbbf24" />
                    </View>
                    <Text className="text-emerald-50 font-extrabold text-[13px]">Khatmah</Text>
                    <Text className="text-emerald-300/80 text-[9px] font-semibold text-center mt-0.5">Track reading{'\n'}progress</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Source Attribution */}
              <View className="bg-emerald-900/30 rounded-xl p-3 mb-4 border border-emerald-800/30 flex-row items-center">
                <Ionicons name="shield-checkmark" size={14} color="#6ee7b7" style={{ marginRight: 8 }} />
                <Text className="text-emerald-400/60 text-[10px] font-bold flex-1">
                  Arabic: Uthmani Mushaf (King Fahd Complex) • Translation: Saheeh International
                </Text>
              </View>
            </>
          )}
          renderItem={({ item: surah }) => (
            <TouchableOpacity
              onPress={() => openSurah(surah)}
              className="mb-3 rounded-2xl overflow-hidden shadow-md border border-emerald-800/40 active:opacity-80"
            >
              <LinearGradient colors={['#064e3b', '#022c22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              <View className="p-4 flex-row items-center">
                <View className="w-11 h-11 rounded-xl bg-emerald-800/60 items-center justify-center mr-4 border border-emerald-700/50">
                  <Text className="text-amber-400 font-bold text-sm">{surah.number}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-emerald-50 font-bold text-base">{surah.englishName}</Text>
                  <Text className="text-emerald-400/70 text-xs font-medium">{surah.englishNameTranslation} • {surah.numberOfAyahs} ayat</Text>
                </View>
                <View className="items-end">
                  <Text className="text-amber-300 text-lg mb-1" style={{ fontFamily: 'sans-serif' }}>{surah.name}</Text>
                  <Text className="text-emerald-500/60 text-[10px] font-bold uppercase">{surah.revelationType}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// Mushaf Mode Styles — Green theme
const mStyles = StyleSheet.create({
  topBar: {
    backgroundColor: '#dcfce7',
    paddingTop: 52,
    paddingBottom: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#86efac',
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  goToInput: {
    flex: 1,
    backgroundColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#064e3b',
    fontWeight: '700',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  ornamentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  ornamentLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#86efac',
  },
  ornamentStar: {
    color: '#047857',
    fontSize: 14,
    marginHorizontal: 12,
  },
  surahHeader: {
    backgroundColor: '#064e3b',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  surahDecorLeft: {
    marginRight: 8,
  },
  surahDecorRight: {
    marginLeft: 8,
  },
  surahDecorText: {
    color: '#6ee7b7',
    fontSize: 16,
  },
  surahArabicName: {
    color: '#ecfdf5',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  surahEngName: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  bismillah: {
    color: '#ecfdf5',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 36,
    fontFamily: 'sans-serif',
    width: '100%',
  },
  textFrame: {
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 16,
    marginTop: 4,
    backgroundColor: '#f0fdf4',
  },
  quranText: {
    textAlign: 'center',
    color: '#1c1917',
    fontFamily: 'sans-serif',
    writingDirection: 'rtl',
  },
  footer: {
    backgroundColor: '#dcfce7',
    borderTopWidth: 2,
    borderTopColor: '#86efac',
    paddingVertical: 8,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
});
