import { surah as surahInfo } from '@murshid/content/quran';
import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StaticSurah } from '@/components/quran/static-surah';
import { pageMetadata } from '@/lib/seo';

// /quran/2: a surah, sent by the server in every language (Phase 6); the reader takes over on
// the first touch. All 114 are prerendered; any other address renders its not-found page on
// request.
export const instant = false;

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ surah: String(i + 1) }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/quran/[surah]'>): Promise<Metadata> {
  const { locale, surah } = await params;
  const n = Number(surah);
  if (!isLocale(locale) || !Number.isInteger(n) || n < 1 || n > 114) return {};
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'quran' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  const s = surahInfo(n);
  const name = locale === 'ar' ? s.nameArabic : s.nameSimple;
  return pageMetadata({
    locale,
    path: `/quran/${n}`,
    title: t('seo.surahTitle', { name }),
    description: t('seo.surahDescription', {
      name,
      ayahs: t('surah.ayahs', { count: s.ayahCount }),
      place: t(`surah.${s.revelationPlace}`),
    }),
    siteName: tc('app.name'),
  });
}

export default async function SurahPage({ params }: PageProps<'/[locale]/quran/[surah]'>) {
  const { locale, surah } = await params;
  const n = Number(surah);
  if (!isLocale(locale) || !Number.isInteger(n) || n < 1 || n > 114) notFound();
  return <StaticSurah locale={locale} surah={n} />;
}
