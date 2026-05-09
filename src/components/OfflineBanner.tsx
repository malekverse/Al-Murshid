import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useAppStore((s) => s.isOnline);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents={isOnline ? 'none' : 'auto'}
    >
      <View className="flex-row items-center justify-center py-2 px-4">
        <Ionicons name="cloud-offline-outline" size={16} color="#fca5a5" style={{ marginRight: 8 }} />
        <Text className="text-red-100 text-xs font-semibold">{t('misc.offlineBanner')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: 'rgba(127, 29, 29, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 38, 38, 0.5)',
  },
});
