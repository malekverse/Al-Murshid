import { loadTranslation, surah as surahInfo } from '@murshid/content/quran';
import { defaultQuranPrefs, translationFor, translationLanguage } from '@murshid/data';
import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { AyahPage } from '@/components/quran/ayah-page';
import { pageMetadata } from '@/lib/seo';

// /quran/2/255: an ayah's own page (SPEC 4, Phase 6). Al-Fatihah's are prerendered; the other
// 6,229 render on their first visit and are kept.
export function generateStaticParams() {
  return Array.from({ length: 7 }, (_, i) => ({ surah: '1', ayah: String(i + 1) }));
}

function parse(surah: string, ayah: string): [number, number] | null {
  const s = Number(surah);
  const a = Number(ayah);
  if (!Number.isInteger(s) || s < 1 || s > 114) return null;
  if (!Number.isInteger(a) || a < 1 || a > surahInfo(s).ayahCount) return null;
  return [s, a];
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/quran/[surah]/[ayah]'>): Promise<Metadata> {
  const { locale, surah, ayah } = await params;
  const at = parse(surah, ayah);
  if (!isLocale(locale) || !at) return {};
  const [t, tc, format] = await Promise.all([
    getTranslations({ locale, namespace: 'quran' }),
    getTranslations({ locale, namespace: 'common' }),
    getFormatter({ locale }),
  ]);
  const number = format.number(at[1]);
  const s = surahInfo(at[0]);
  const name = locale === 'ar' ? s.nameArabic : s.nameSimple;
  // The ayah's translation describes it best, when it is short enough to be read whole there.
  const translation = translationFor(defaultQuranPrefs(), locale);
  const text = translation
    ? (await loadTranslation(translationLanguage[translation], at[0])).t[at[1] - 1]
        ?.filter((seg): seg is string => typeof seg === 'string')
        .join('')
        .trim()
    : undefined;
  return pageMetadata({
    locale,
    path: `/quran/${at[0]}/${at[1]}`,
    title: t('seo.ayahTitle', { surah: name, ayah: number }),
    description:
      text && text.length <= 200 ? text : t('seo.ayahDescription', { surah: name, ayah: number }),
    siteName: tc('app.name'),
  });
}

export default async function AyahRoute({ params }: PageProps<'/[locale]/quran/[surah]/[ayah]'>) {
  const { locale, surah, ayah } = await params;
  const at = parse(surah, ayah);
  if (!isLocale(locale) || !at) notFound();
  return <AyahPage locale={locale} surah={at[0]} ayah={at[1]} />;
}
