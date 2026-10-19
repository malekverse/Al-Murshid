import { surah as surahInfo } from '@murshid/content/quran';
import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SurahReader } from '@/components/quran/surah-reader';

// The reader renders on the client from the address; it waits for the route instead of
// prerendering a shell (Cache Components).
export const instant = false;

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ surah: String(i + 1) }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/quran/[surah]'>): Promise<Metadata> {
  const { locale, surah } = await params;
  if (!isLocale(locale)) return {};
  const s = surahInfo(Number(surah));
  return { title: locale === 'ar' ? s.nameArabic : s.nameSimple };
}

export default async function SurahPage({ params }: PageProps<'/[locale]/quran/[surah]'>) {
  const { surah } = await params;
  const n = Number(surah);
  if (!Number.isInteger(n) || n < 1 || n > 114) notFound();
  return <SurahReader surah={n} />;
}
