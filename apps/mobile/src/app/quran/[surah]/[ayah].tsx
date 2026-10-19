import { surah as surahInfo } from '@murshid/content/quran';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SurahReader } from '@/components/quran/surah-reader';

/** /quran/2/255: the stable address of an ayah (SPEC 4), opening the surah at it. */
export default function Ayah() {
  const { surah, ayah } = useLocalSearchParams<{ surah: string; ayah: string }>();
  const s = Number(surah);
  const a = Number(ayah);
  if (!Number.isInteger(s) || s < 1 || s > 114) return <Redirect href="/quran" />;
  if (!Number.isInteger(a) || a < 1 || a > surahInfo(s).ayahCount) {
    return <Redirect href={`/quran/${s}`} />;
  }
  return <SurahReader key={`${s}:${a}`} surah={s} startAyah={a} />;
}
