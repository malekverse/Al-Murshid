import { ayah, surah } from '@murshid/content';
import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TodayScreen } from '@/components/today/today-screen';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'today' });
  return { title: t('title') };
}

export default function TodayPage() {
  // Az-Zumar 39:53 for "Welcome back" (SPEC 3), verbatim from packages/content. Read here on
  // the server so the full Quran text never ships to this page.
  const verse = ayah(39, 53);
  const az = surah(39);
  return (
    <TodayScreen
      verse={{
        text: verse.text,
        ayah: verse.ayah,
        surahName: { ar: az.nameArabic, en: az.nameSimple },
      }}
    />
  );
}
