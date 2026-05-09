import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getReflections } from '../store/database';
import { flipIcon } from '../utils/rtl';

interface ReflectionEntry {
  id: string;
  date: string;
  encryptedPayload: string;
  aiGuidance?: string;
}

export default function ReflectionHistoryScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadReflections();
  }, []);

  const loadReflections = async () => {
    try {
      const data = await getReflections();
      setReflections(data as ReflectionEntry[]);
    } catch {
      setReflections([]);
    } finally {
      setLoading(false);
    }
  };

  const decodePayload = (payload: string) => {
    try {
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const getMoodIcon = (moodLabel: string): string => {
    const icons: Record<string, string> = {
      grateful: 'heart', peaceful: 'leaf', struggling: 'cloudy',
      hopeful: 'sunny', anxious: 'thunderstorm',
    };
    return icons[moodLabel?.toLowerCase()] || 'ellipse';
  };

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <Text className="text-emerald-50 text-xl font-bold tracking-wide">{t('muhasabah.history')}</Text>
        <TouchableOpacity onPress={loadReflections} className="w-10 h-10 rounded-full bg-emerald-900/80 items-center justify-center border border-emerald-700/50" accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={20} color="#6ee7b7" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fbbf24" />
        </View>
      ) : reflections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="journal-outline" size={64} color="#6ee7b7" style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text className="text-emerald-400/60 text-lg font-medium text-center">{t('muhasabah.noReflections')}</Text>
          <Text className="text-emerald-600/40 text-sm mt-2 text-center">{t('muhasabah.noReflectionsDesc')}</Text>
        </View>
      ) : (
        <FlatList
          data={reflections}
          keyExtractor={(ref) => ref.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          renderItem={({ item: ref }) => {
            const data = decodePayload(ref.encryptedPayload);
            const isExpanded = expandedId === ref.id;

            return (
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : ref.id)}
                className="rounded-3xl border border-emerald-800/40 overflow-hidden mb-4"
              >
                <LinearGradient colors={['#064e3b', '#022c22']} style={StyleSheet.absoluteFillObject} />
                <View className="p-5">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      {data?.mood && (
                        <Ionicons name={getMoodIcon(data.mood.label || data.mood) as any} size={16} color={data.mood.color || '#fbbf24'} style={{ marginRight: 8 }} />
                      )}
                      <Text className="text-emerald-300 text-xs font-medium">{ref.date}</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#6ee7b7" />
                  </View>

                  {isExpanded && data && (
                    <View className="mt-3 pt-3 border-t border-emerald-800/50">
                      {data.gratitude && (
                        <View className="mb-3">
                          <Text className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">Shukr</Text>
                          <Text className="text-emerald-100 text-sm">{data.gratitude}</Text>
                        </View>
                      )}
                      {data.struggle && (
                        <View className="mb-3">
                          <Text className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Istighfar</Text>
                          <Text className="text-emerald-100 text-sm">{data.struggle}</Text>
                        </View>
                      )}
                      {data.intention && (
                        <View>
                          <Text className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Niyyah</Text>
                          <Text className="text-emerald-100 text-sm">{data.intention}</Text>
                        </View>
                      )}
                      {ref.aiGuidance && (
                        <View className="mt-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                          <Text className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">AI Guidance</Text>
                          <Text className="text-amber-100/80 text-sm italic">{ref.aiGuidance}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {!isExpanded && data && (
                    <Text className="text-emerald-400/60 text-sm mt-1" numberOfLines={1}>
                      {data.gratitude || data.struggle || data.intention || ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
