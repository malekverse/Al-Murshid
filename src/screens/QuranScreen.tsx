import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function QuranScreen() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Surah Al-Fatihah Audio by Mishary Rashid Alafasy
  const audioUrl = "https://server8.mp3quran.net/afs/001.mp3";
  
  // Use the new expo-audio hook
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const isLoading = status.isBuffering;

  const handlePlayPause = () => {
    setErrorMsg(null);
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error("Error playing audio", error);
      setErrorMsg("Failed to play audio. Please check your connection.");
    }
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />
      <View className="px-6 pt-16 pb-4">
        <View className="flex-row justify-between items-end mb-2">
          <View>
            <Text className="text-white text-3xl font-extrabold tracking-tight">The Noble Quran</Text>
            <Text className="text-emerald-200 text-sm mt-1 font-medium">Surah Al-Fatihah, Verse 1-7</Text>
          </View>
          <View className="bg-emerald-900/80 px-3 py-1.5 rounded-full border border-emerald-700/50 flex-row items-center">
            <Ionicons name="mic-outline" size={14} color="#fbbf24" style={{ marginRight: 4 }} />
            <Text className="text-amber-400 text-xs font-bold">Mishary Alafasy</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        <View className="rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <Text className="text-amber-400 text-3xl font-serif text-center leading-loose mb-6" style={{ fontFamily: 'sans-serif' }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (1){'\n'}
              الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (2){'\n'}
              الرَّحْمَٰنِ الرَّحِيمِ (3){'\n'}
              مَالِكِ يَوْمِ الدِّينِ (4){'\n'}
              إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (5){'\n'}
              اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (6){'\n'}
              صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (7)
            </Text>
            
            <View className="border-t border-emerald-700/50 pt-6">
              <Text className="text-emerald-50 text-lg leading-relaxed font-medium">
                In the name of Allah, the Entirely Merciful, the Especially Merciful. (1) {"\n\n"}
                [All] praise is [due] to Allah, Lord of the worlds - (2) {"\n\n"}
                The Entirely Merciful, the Especially Merciful, (3) {"\n\n"}
                Sovereign of the Day of Recompense. (4) {"\n\n"}
                It is You we worship and You we ask for help. (5) {"\n\n"}
                Guide us to the straight path - (6) {"\n\n"}
                The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray. (7)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Audio Player Controls - Floating at bottom */}
      <View className="absolute bottom-6 left-6 right-6">
        {errorMsg && (
          <View className="bg-red-900/90 p-3 rounded-xl border border-red-800 mb-4 items-center shadow-lg">
            <Text className="text-red-100 font-medium text-sm">{errorMsg}</Text>
          </View>
        )}
        <View className="rounded-full shadow-2xl border border-emerald-600/50 overflow-hidden">
          <LinearGradient
            colors={['#065f46', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="h-20 flex-row items-center justify-center">
            <TouchableOpacity className="mx-6 active:opacity-50">
              <Ionicons name="play-back" size={28} color="#fbbf24" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="mx-4 bg-amber-500 rounded-full w-16 h-16 items-center justify-center shadow-lg active:bg-amber-600 border-2 border-amber-300"
              onPress={handlePlayPause}
            >
              {isLoading ? (
                <ActivityIndicator color="#022c22" size="large" />
              ) : (
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={32} 
                  color="#022c22" 
                  style={{ marginLeft: isPlaying ? 0 : 4 }} 
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity className="mx-6 active:opacity-50">
              <Ionicons name="play-forward" size={28} color="#fbbf24" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
