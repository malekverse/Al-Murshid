import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface ReflectionEntry {
  id: string;
  date: string;
  mood: string;
  moodIcon: string;
  gratitude: string;
  struggle: string;
  intention: string;
}

const moodOptions = [
  { label: 'Grateful', icon: 'heart', color: '#f59e0b' },
  { label: 'Peaceful', icon: 'leaf', color: '#6ee7b7' },
  { label: 'Struggling', icon: 'cloudy', color: '#93c5fd' },
  { label: 'Hopeful', icon: 'sunny', color: '#fbbf24' },
  { label: 'Anxious', icon: 'thunderstorm', color: '#fca5a5' },
];

export default function MuhasabahScreen() {
  const navigation = useNavigation();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [struggle, setStruggle] = useState('');
  const [intention, setIntention] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (selectedMood === null) return;
    // In production, this would persist to AsyncStorage
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-emerald-950"
    >
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
        >
          <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">Muhasabah</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50">
          <Ionicons name="time" size={20} color="#6ee7b7" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>

        {/* Intro */}
        <View className="mb-8 mt-2">
          <Text className="text-amber-400 text-3xl font-extrabold tracking-tight mb-2">Self-Reflection</Text>
          <Text className="text-emerald-200 text-sm leading-relaxed font-medium">
            Umar (RA) said: "Take account of yourselves before you are taken to account." This is your private vault — only between you and Allah.
          </Text>
        </View>

        {/* Mood Selector */}
        <View className="rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <Text className="text-white text-lg font-bold tracking-wide mb-5">How is your soul today?</Text>
            <View className="flex-row justify-between">
              {moodOptions.map((mood, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedMood(idx)}
                  className={`items-center p-2 rounded-2xl ${selectedMood === idx ? 'bg-emerald-800/80 border border-emerald-600/50' : ''}`}
                >
                  <Ionicons name={mood.icon as any} size={28} color={selectedMood === idx ? mood.color : '#6b7280'} />
                  <Text className={`text-xs font-bold mt-2 ${selectedMood === idx ? 'text-emerald-100' : 'text-emerald-500/60'}`}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Gratitude */}
        <View className="rounded-3xl shadow-2xl border border-teal-700/40 overflow-hidden mb-8">
          <LinearGradient
            colors={['#0f766e', '#042f2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="heart" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text className="text-teal-50 text-lg font-bold tracking-wide">Shukr (Gratitude)</Text>
            </View>
            <Text className="text-teal-200/80 text-sm mb-4 font-medium">What are 3 blessings you noticed today?</Text>
            <TextInput
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="Alhamdulillah for..."
              placeholderTextColor="rgba(110, 231, 183, 0.3)"
              multiline
              numberOfLines={3}
              className="bg-teal-900/40 rounded-2xl border border-teal-700/50 px-4 py-3 text-teal-50 text-base font-medium"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>
        </View>

        {/* Struggle */}
        <View className="rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="cloudy" size={18} color="#93c5fd" style={{ marginRight: 8 }} />
              <Text className="text-white text-lg font-bold tracking-wide">Istighfar (Repentance)</Text>
            </View>
            <Text className="text-emerald-200/80 text-sm mb-4 font-medium">What did you struggle with? There is no judgment here.</Text>
            <TextInput
              value={struggle}
              onChangeText={setStruggle}
              placeholder="I struggled with..."
              placeholderTextColor="rgba(110, 231, 183, 0.3)"
              multiline
              numberOfLines={3}
              className="bg-emerald-900/40 rounded-2xl border border-emerald-700/50 px-4 py-3 text-emerald-50 text-base font-medium"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>
        </View>

        {/* Tomorrow's Intention */}
        <View className="rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden mb-8">
          <LinearGradient
            colors={['#064e3b', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="sunny" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text className="text-white text-lg font-bold tracking-wide">Niyyah (Intention)</Text>
            </View>
            <Text className="text-emerald-200/80 text-sm mb-4 font-medium">Set one spiritual goal for tomorrow.</Text>
            <TextInput
              value={intention}
              onChangeText={setIntention}
              placeholder="Tomorrow, I will..."
              placeholderTextColor="rgba(110, 231, 183, 0.3)"
              multiline
              numberOfLines={2}
              className="bg-emerald-900/40 rounded-2xl border border-emerald-700/50 px-4 py-3 text-emerald-50 text-base font-medium"
              style={{ textAlignVertical: 'top', minHeight: 60 }}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          className="shadow-2xl active:opacity-80 rounded-full overflow-hidden mb-8"
        >
          <LinearGradient
            colors={saved ? ['#059669', '#047857'] : ['#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="py-4 items-center flex-row justify-center">
            <Ionicons name={saved ? 'checkmark-circle' : 'lock-closed'} size={22} color={saved ? '#ecfdf5' : '#022c22'} style={{ marginRight: 8 }} />
            <Text className={`font-extrabold text-lg tracking-wide ${saved ? 'text-emerald-50' : 'text-emerald-950'}`}>
              {saved ? 'Saved to Your Vault' : 'Save Reflection'}
            </Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
