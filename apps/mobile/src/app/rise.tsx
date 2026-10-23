import { useLocalSearchParams } from 'expo-router';
import { RingScreen } from '@/components/rise/ring-screen';

/** Fajr Rise's ring screen (SPEC 5.10); `?trying=1` tries the challenge from setup. */
export default function Rise() {
  const { trying } = useLocalSearchParams<{ trying?: string }>();
  return <RingScreen trying={trying === '1'} />;
}
