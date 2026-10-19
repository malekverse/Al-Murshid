import { PAGE_COUNT } from '@murshid/content/quran';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { MushafReader } from '@/components/quran/mushaf-reader';

/** /quran/page/42: a page of the mushaf. */
export default function Page() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const n = Number(page);
  if (!Number.isInteger(n) || n < 1 || n > PAGE_COUNT) return <Redirect href="/quran" />;
  return <MushafReader key={n} startPage={n} />;
}
