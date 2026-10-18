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
  return <Gallery />;
}
