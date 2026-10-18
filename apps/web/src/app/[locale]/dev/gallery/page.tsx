import { ayah, ayahs, surah } from '@murshid/content';
import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Gallery } from './gallery';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/dev/gallery'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'gallery.meta' });
  // A developer page: never indexed.
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

export default function GalleryPage() {
  // Al-Muzzammil 73:4, Ayat al-Kursi (2:255) and Al-Ikhlas, verbatim from packages/content.
  const sacred = {
    short: ayah(73, 4),
    long: ayah(2, 255),
    ikhlas: ayahs(112, 1, 4),
    surahs: { 2: surah(2), 73: surah(73), 112: surah(112) },
  };
  return <Gallery sacred={sacred} />;
}
