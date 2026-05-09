import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { flipIcon } from '../utils/rtl';
import { getDb } from '../store/db';
import LoadingState from '../components/LoadingState';

const { width, height } = Dimensions.get('window');

interface AlarmNode {
  id: string;
  x: number;
  y: number;
  size: number;
  date: string;
  delay: number;
  isHero: boolean;
  dismissed: boolean;
}

export default function CommunityHeatmapScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<AlarmNode[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    loadAlarmData();
  }, []);

  const loadAlarmData = async () => {
    try {
      const db = getDb();
      const rows: any[] = await db.getAllAsync(
        'SELECT date, dismissed, timestamp FROM alarm_logs WHERE alarmType = ? ORDER BY timestamp DESC LIMIT 30',
        'fajr_wudu'
      );
      const alarmNodes: AlarmNode[] = rows.map((r, i) => ({
        id: `alarm-${i}`,
        x: 30 + (i % 6) * ((width - 80) / 5),
        y: 120 + Math.floor(i / 6) * 100 + (r.dismissed ? 30 : 0),
        size: r.dismissed ? 6 : 10,
        date: r.date,
        delay: i * 150,
        isHero: i === 0,
        dismissed: r.dismissed === 1,
      }));
      setNodes(alarmNodes);
      setActiveCount(0);

      // Animate nodes appearing one by one
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < alarmNodes.length) {
          setActiveCount(idx + 1);
          if (idx % 3 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    } catch (e) {
      console.warn('loadAlarmData failed:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message={t('loading')} />;

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Stylized Map Background (Grid) */}
      <View style={StyleSheet.absoluteFillObject} className="opacity-40">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`h-${i}`} style={{ position: 'absolute', top: i * 40, width: '100%', height: 1, backgroundColor: '#6ee7b7' }} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v-${i}`} style={{ position: 'absolute', left: i * 40, height: '100%', width: 1, backgroundColor: '#6ee7b7' }} />
        ))}
      </View>

      {/* Nodes / Heatmap */}
      <View style={StyleSheet.absoluteFillObject}>
        {nodes.slice(0, activeCount).map((node) => {
          const nodeColor = node.isHero ? '#fbbf24' : node.dismissed ? '#f87171' : '#34d399';
          
          return (
            <Animated.View
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: node.isHero ? 24 : node.size,
                height: node.isHero ? 24 : node.size,
                borderRadius: 999,
                backgroundColor: nodeColor,
                shadowColor: nodeColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: node.isHero ? 15 : 8,
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1]
                }),
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, node.isHero ? 1.5 : 1.2]
                  })
                }]
              }}
            >
              {node.isHero && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={12} color="#022c22" />
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Gradient Overlay for Fade Effect at Bottom */}
      <LinearGradient
        colors={['transparent', '#022c22']}
        style={{ position: 'absolute', bottom: 0, width: '100%', height: 300 }}
      />

      {/* Header Overlay */}
      <View className="px-6 pt-16 flex-row justify-between items-center z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-emerald-950/80 items-center justify-center border border-emerald-700/50 backdrop-blur-md"
          accessibilityLabel="Go back"
        >
          <Ionicons name={flipIcon('arrow-back') as any} size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="bg-emerald-950/80 px-4 py-2 rounded-full border border-emerald-700/50 backdrop-blur-md">
          <Text className="text-emerald-50 text-sm font-bold tracking-wide">{t('community.cityLabel')}</Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Bottom Info Sheet */}
      <View className="absolute bottom-10 left-6 right-6">
        <View className="bg-emerald-900/80 p-6 rounded-3xl border border-emerald-700/50 backdrop-blur-lg shadow-2xl">
          <View className="flex-row items-center mb-2">
            <Ionicons name="flame" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text className="text-amber-400 text-sm font-bold uppercase tracking-widest">{t('community.heatmapTitle')}</Text>
          </View>
          
          {nodes.length === 0 && (
            <Text className="text-emerald-400/60 text-sm text-center py-4">{t('misc.noData')}</Text>
          )}
          
          <Text className="text-emerald-50 text-3xl font-extrabold mb-1">{nodes.length}</Text>
          <Text className="text-emerald-300 text-sm font-medium mb-2">{t('community.fajrAlarmsLogged')}</Text>
          
          <View className="flex-row mb-4">
            <View className="flex-row items-center mr-4">
              <View className="w-3 h-3 rounded-full bg-[#34d399] mr-2" />
              <Text className="text-emerald-300 text-xs">{t('community.completed')}</Text>
            </View>
            <View className="flex-row items-center mr-4">
              <View className="w-3 h-3 rounded-full bg-[#f87171] mr-2" />
              <Text className="text-emerald-300 text-xs">{t('community.dismissed')}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-[#fbbf24] mr-2" />
              <Text className="text-emerald-300 text-xs">{t('community.you')}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={loadAlarmData} className="bg-emerald-800/80 py-3 rounded-xl border border-emerald-600/50 items-center flex-row justify-center">
            <Ionicons name="refresh" size={16} color="#6ee7b7" style={{ marginRight: 8 }} />
            <Text className="text-emerald-50 font-bold text-sm">{t('community.refreshData')}</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}
