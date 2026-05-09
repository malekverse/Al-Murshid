import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'folder-open-outline', title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 bg-emerald-950 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-emerald-900/60 items-center justify-center mb-6 border border-emerald-800/50">
        <Ionicons name={icon} size={36} color="#6ee7b7" />
      </View>
      <Text className="text-emerald-50 text-xl font-bold text-center mb-2">{title}</Text>
      <Text className="text-emerald-400/60 text-sm text-center leading-relaxed mb-6">{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-amber-500 px-8 py-3 rounded-full active:opacity-80"
        >
          <Text className="text-emerald-950 font-bold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
