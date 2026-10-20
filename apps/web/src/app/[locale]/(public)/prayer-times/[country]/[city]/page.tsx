import { cityName } from '@murshid/content/cities';
import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { CityPage } from '@/components/prayer-times/city-page';
import { cityDay } from '@/lib/city-times';
import { countryName } from '@/lib/country-name';
import { loadPlaces } from '@/lib/places';
import { pageMetadata } from '@/lib/seo';

// The 100 most populous cities are prerendered; the other 31,666 render on their first visit.
// Each is kept for an hour (cityDay), so today's times follow the day.
// Addresses not prerendered at build render whole on their first visit, then are kept: their
// params are only known then, and Cache Components would otherwise refuse the render (on Netlify
// the visitor got an error page).
export const instant = false;

export async function generateStaticParams() {
  const places = await loadPlaces();
  return places.countries
    .flatMap((c) => c.cities)
    .sort((a, b) => b.population - a.population)
    .slice(0, 100)
    .map((c) => {
      const [country, city] = places.path(c).split('/') as [string, string];
      return { country, city };
    });
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/prayer-times/[country]/[city]'>): Promise<Metadata> {
  const { locale, country, city } = await params;
  const places = await loadPlaces();
  const found = places.city(country, city);
  if (!isLocale(locale) || !found) return {};
  const [t, tc, format, day] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'common' }),
    getFormatter({ locale }),
    cityDay(found),
  ]);
  const time = (at: string) =>
    format.dateTime(new Date(at), { hour: 'numeric', minute: '2-digit', timeZone: found.timeZone });
  const name = cityName(found, locale);
  return pageMetadata({
    locale,
    path: `/prayer-times/${places.path(found)}`,
    siteName: tc('app.name'),
    title: t('cityTitle', { city: name }),
    description: t('cityDescription', {
      city: name,
      country: countryName(found.countryCode, locale),
      fajr: time(day.times.fajr),
      dhuhr: time(day.times.dhuhr),
      asr: time(day.times.asr),
      maghrib: time(day.times.maghrib),
      isha: time(day.times.isha),
    }),
  });
}

export default async function CityRoute({
  params,
}: PageProps<'/[locale]/prayer-times/[country]/[city]'>) {
  const { locale, country, city } = await params;
  const places = await loadPlaces();
  const found = places.city(country, city);
  if (!isLocale(locale) || !found) notFound();
  return <CityPage locale={locale} city={found} day={await cityDay(found)} places={places} />;
}
