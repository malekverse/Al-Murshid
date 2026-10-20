import { loadSurahName, surah as surahInfo } from '@murshid/content/quran';
import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { png, surahCard } from '@/lib/og/card';

export { size } from '@/lib/og/card';
export const contentType = 'image/png';

// A surah's share image (Phase 6): its calligraphic name, its name and what it holds.
export default async function Image({ params }: PageProps<'/[locale]/quran/[surah]'>) {
  const { locale, surah } = await params;
  const n = Number(surah);
  if (!isLocale(locale) || !Number.isInteger(n) || n < 1 || n > 114) notFound();
  const [t, tc, name] = await Promise.all([
    getTranslations({ locale, namespace: 'quran' }),
    getTranslations({ locale, namespace: 'common' }),
    loadSurahName(n),
  ]);
  const s = surahInfo(n);
  return png(
    surahCard({
      rtl: locale === 'ar',
      brand: tc('app.name'),
      footer: t('seo.quran'),
      name,
      title: t('seo.surahTitle', { name: locale === 'ar' ? s.nameArabic : s.nameSimple }),
      meta: `${t(`surah.${s.revelationPlace}`)} · ${t('surah.ayahs', { count: s.ayahCount })}`,
    }),
  );
}
