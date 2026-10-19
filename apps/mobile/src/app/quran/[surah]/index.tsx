import { Redirect, useLocalSearchParams } from 'expo-router';
import { SurahReader } from '@/components/quran/surah-reader';

/** /quran/2: a surah, from its first ayah. */
export default function Surah() {
  const { surah } = useLocalSearchParams<{ surah: string }>();
  const n = Number(surah);
  if (!Number.isInteger(n) || n < 1 || n > 114) return <Redirect href="/quran" />;
  return <SurahReader key={n} surah={n} />;
}
