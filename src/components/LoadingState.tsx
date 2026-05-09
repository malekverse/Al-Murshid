import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface Props {
  message?: string;
}

export default function LoadingState({ message }: Props) {
  return (
    <View className="flex-1 bg-emerald-950 items-center justify-center px-8">
      <ActivityIndicator size="large" color="#fbbf24" />
      {message && (
        <Text className="text-emerald-300 text-sm mt-4 text-center">{message}</Text>
      )}
    </View>
  );
}
