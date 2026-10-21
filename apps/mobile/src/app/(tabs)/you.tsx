import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { LockedYou } from '@/components/you/locked-you';
import { YouScreen } from '@/components/you-screen';
import { useYouLock } from '@/lib/app-lock';

export default function You() {
  // Today's invitation opens You at the night reflection ("focus", with "at" to repeat it).
  const { focus, at } = useLocalSearchParams<{ focus?: string; at?: string }>();
  const lock = useYouLock();
  if (lock.enabled === undefined) return <View className="flex-1 bg-canvas" />;
  if (lock.enabled && !lock.unlocked) return <LockedYou />;
  return <YouScreen focus={focus === 'reflection' ? (at ?? 'reflection') : null} />;
}
