import { editionPages } from '@murshid/content/quran';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { MushafReader } from '@/components/quran/mushaf-reader';

/** /quran/page/42: a page of the mushaf. */
export default function Page() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const n = Number(page);
  // Any edition's page: the reader keeps it within the chosen edition (604, or 610 in Indopak).
  if (!Number.isInteger(n) || n < 1 || n > Math.max(...Object.values(editionPages))) {
    return <Redirect href="/quran" />;
  }
  return <MushafReader key={n} startPage={n} />;
}
