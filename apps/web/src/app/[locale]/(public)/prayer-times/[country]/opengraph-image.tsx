import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { countryName } from '@/lib/country-name';
import { png, textCard } from '@/lib/og/card';
import { loadPlaces } from '@/lib/places';

export { size } from '@/lib/og/card';
export const contentType = 'image/png';

// A country's share image (Phase 6): its title and how many cities it lists.
export default async function Image({ params }: PageProps<'/[locale]/prayer-times/[country]'>) {
  const { locale, country } = await params;
  const found = (await loadPlaces()).country(country);
  if (!isLocale(locale) || !found) notFound();
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  return png(
    textCard({
      rtl: locale === 'ar',
      brand: tc('app.name'),
      footer: t('title'),
      title: t('countryTitle', { country: countryName(found.code, locale) }),
      body: t('cities', { count: found.cities.length }),
    }),
  );
}
