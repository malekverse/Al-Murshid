import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CountryPage } from '@/components/prayer-times/country-page';
import { countryName } from '@/lib/country-name';
import { loadPlaces } from '@/lib/places';
import { pageMetadata } from '@/lib/seo';

// Every country is prerendered; an unknown one renders its not-found page on request.
export const instant = false;

export async function generateStaticParams() {
  return (await loadPlaces()).countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/prayer-times/[country]'>): Promise<Metadata> {
  const { locale, country } = await params;
  const found = (await loadPlaces()).country(country);
  if (!isLocale(locale) || !found) return {};
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  const name = countryName(found.code, locale);
  return pageMetadata({
    locale,
    path: `/prayer-times/${found.slug}`,
    title: t('countryTitle', { country: name }),
    description: `${t('cities', { count: found.cities.length })}. ${t('indexBody')}`,
    siteName: tc('app.name'),
  });
}

export default async function CountryRoute({
  params,
}: PageProps<'/[locale]/prayer-times/[country]'>) {
  const { locale, country } = await params;
  const places = await loadPlaces();
  const found = places.country(country);
  if (!isLocale(locale) || !found) notFound();
  return <CountryPage locale={locale} country={found} places={places} />;
}
