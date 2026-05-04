import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Mock data for map nodes
const mockNodes = Array.from({ length: 25 }).map((_, i) => ({
  id: `node-${i}`,
  x: Math.random() * (width - 60) + 30,
  y: Math.random() * (height * 0.6) + 100,
  size: Math.random() * 8 + 4, // 4 to 12
  delay: Math.random() * 2000,
  isHero: i === 0 // Make one node the user's location
}));

export default function CommunityHeatmapScreen() {
  const navigation = useNavigation<any>();
  const [activeCount, setActiveCount] = useState(1);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the glowing nodes
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    // Simulate community waking up
    const interval = setInterval(() => {
      setActiveCount(prev => {
        if (prev < mockNodes.length) {
          if (prev % 3 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-1 bg-emerald-950">
      <StatusBar style="light" />

      {/* Stylized Map Background (Grid) */}
      <View style={StyleSheet.absoluteFillObject} className="opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`h-${i}`} style={{ position: 'absolute', top: i * 40, width: '100%', height: 1, backgroundColor: '#6ee7b7' }} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v-${i}`} style={{ position: 'absolute', left: i * 40, height: '100%', width: 1, backgroundColor: '#6ee7b7' }} />
        ))}
      </View>

      {/* Nodes / Heatmap */}
      <View style={StyleSheet.absoluteFillObject}>
        {mockNodes.slice(0, activeCount).map((node) => {
          const isHero = node.isHero;
          const nodeColor = isHero ? '#fbbf24' : '#34d399';
          
          return (
            <Animated.View
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: isHero ? 24 : node.size,
                height: isHero ? 24 : node.size,
                borderRadius: 999,
                backgroundColor: nodeColor,
                shadowColor: nodeColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: isHero ? 15 : 8,
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1]
                }),
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, isHero ? 1.5 : 1.2]
                  })
                }]
              }}
            >
              {isHero && (
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
        >
          <Ionicons name="arrow-back" size={20} color="#6ee7b7" />
        </TouchableOpacity>
        <View className="bg-emerald-950/80 px-4 py-2 rounded-full border border-emerald-700/50 backdrop-blur-md">
          <Text className="text-emerald-50 text-sm font-bold tracking-wide">City: London</Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Bottom Info Sheet */}
      <View className="absolute bottom-10 left-6 right-6">
        <View className="bg-emerald-900/80 p-6 rounded-3xl border border-emerald-700/50 backdrop-blur-lg shadow-2xl">
          <View className="flex-row items-center mb-2">
            <Ionicons name="flame" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text className="text-amber-400 text-sm font-bold uppercase tracking-widest">Spiritual Heatmap</Text>
          </View>
          
          <Text className="text-emerald-50 text-3xl font-extrabold mb-1">{activeCount * 12}</Text>
          <Text className="text-emerald-300 text-sm font-medium mb-6">Sabiqoon awake for Fajr</Text>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-1 bg-emerald-800/80 py-3 rounded-xl border border-emerald-600/50 items-center">
              <Text className="text-emerald-50 font-bold text-sm">Ping Squad</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-emerald-800/80 py-3 rounded-xl border border-emerald-600/50 items-center flex-row justify-center">
              <Text className="text-emerald-50 font-bold text-sm mr-2">Leaderboard</Text>
              <Ionicons name="podium" size={14} color="#6ee7b7" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>
  );
}
