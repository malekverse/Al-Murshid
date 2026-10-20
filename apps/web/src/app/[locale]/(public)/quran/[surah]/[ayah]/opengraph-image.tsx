import {
  ayahWords,
  loadSurahName,
  loadSurahText,
  surah as surahInfo,
} from '@murshid/content/quran';
import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ayahCard, png } from '@/lib/og/card';

export { size } from '@/lib/og/card';
export const contentType = 'image/png';

// An ayah's share image (Phase 6): the ayah as published when it fits, with its reference.
export default async function Image({ params }: PageProps<'/[locale]/quran/[surah]/[ayah]'>) {
  const { locale, surah, ayah } = await params;
  const s = Number(surah);
  const a = Number(ayah);
  if (!isLocale(locale) || !Number.isInteger(s) || s < 1 || s > 114) notFound();
  if (!Number.isInteger(a) || a < 1 || a > surahInfo(s).ayahCount) notFound();
  const [t, tc, format, text, name] = await Promise.all([
    getTranslations({ locale, namespace: 'quran' }),
    getTranslations({ locale, namespace: 'common' }),
    getFormatter({ locale }),
    loadSurahText(s),
    loadSurahName(s),
  ]);
  const words = ayahWords(text, a);
  const info = surahInfo(s);
  return png(
    ayahCard({
      rtl: locale === 'ar',
      brand: tc('app.name'),
      footer: t('seo.quran'),
      name,
      text: words.map((w, i) => (i === words.length - 1 ? w.text : w.text + w.after)).join(''),
      reference: t('seo.ayahTitle', {
        surah: locale === 'ar' ? info.nameArabic : info.nameSimple,
        ayah: format.number(a),
      }),
    }),
  );
}
