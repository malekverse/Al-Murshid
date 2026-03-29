import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';

export default function QuranScreen() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Surah Al-Fatihah Audio by Mishary Rashid Alafasy
  const audioUrl = "https://server8.mp3quran.net/afs/001.mp3";

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handlePlayPause = async () => {
    if (isLoading) return;

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      setIsLoading(true);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        });
      } catch (error) {
        console.error("Error loading audio", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-emerald-950 px-6 pt-16">
      <StatusBar style="light" />
      <View className="mb-6 flex-row justify-between items-end">
        <View>
          <Text className="text-white text-3xl font-bold">The Noble Quran</Text>
          <Text className="text-emerald-200 text-sm mt-1">Surah Al-Fatihah, Verse 1-7</Text>
        </View>
        <View className="bg-emerald-900 px-3 py-1 rounded border border-emerald-800">
          <Text className="text-amber-400 text-xs font-bold">Mishary Alafasy</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 rounded-3xl bg-emerald-900 border border-emerald-800/50 p-6 mb-6">
        <Text className="text-amber-400 text-3xl font-serif text-center leading-loose mb-6" style={{ fontFamily: 'sans-serif' }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (1){'\n'}
          الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (2){'\n'}
          الرَّحْمَٰنِ الرَّحِيمِ (3){'\n'}
          مَالِكِ يَوْمِ الدِّينِ (4){'\n'}
          إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (5){'\n'}
          اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (6){'\n'}
          صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (7)
        </Text>
        
        <Text className="text-emerald-100 text-lg leading-relaxed mt-4 border-t border-emerald-800 pt-4 pb-8">
          In the name of Allah, the Entirely Merciful, the Especially Merciful. (1) {"\n"}
          [All] praise is [due] to Allah, Lord of the worlds - (2) {"\n"}
          The Entirely Merciful, the Especially Merciful, (3) {"\n"}
          Sovereign of the Day of Recompense. (4) {"\n"}
          It is You we worship and You we ask for help. (5) {"\n"}
          Guide us to the straight path - (6) {"\n"}
          The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray. (7)
        </Text>
      </ScrollView>

      {/* Audio Player Controls */}
      <View className="bg-emerald-800 rounded-full h-16 flex-row items-center justify-center shadow-lg mb-8 px-6 border border-emerald-700">
        <TouchableOpacity className="mx-6 active:opacity-50">
          <Text className="text-amber-400 text-xl font-bold">⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="mx-4 bg-amber-500 rounded-full w-14 h-14 items-center justify-center shadow-md active:bg-amber-600"
          onPress={handlePlayPause}
        >
          {isLoading ? (
            <ActivityIndicator color="#022c22" />
          ) : (
            <Text className="text-emerald-950 text-xl font-bold">{isPlaying ? '⏸' : '▶'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity className="mx-6 active:opacity-50">
          <Text className="text-amber-400 text-xl font-bold">⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
