import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlacesIndex } from '@/components/prayer-times/index-page';
import { loadPlaces } from '@/lib/places';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/prayer-times'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  return pageMetadata({
    locale,
    path: '/prayer-times',
    title: t('indexTitle'),
    description: t('indexBody'),
    siteName: tc('app.name'),
  });
}

export default async function PrayerTimesIndex({ params }: PageProps<'/[locale]/prayer-times'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PlacesIndex locale={locale} places={await loadPlaces()} />;
}
