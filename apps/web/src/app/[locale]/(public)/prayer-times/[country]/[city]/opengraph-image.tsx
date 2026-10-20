import { cityName } from '@murshid/content/cities';
import { prayers } from '@murshid/core';
import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { cityDay } from '@/lib/city-times';
import { countryName } from '@/lib/country-name';
import { cityCard, png } from '@/lib/og/card';
import { loadPlaces } from '@/lib/places';

export { size } from '@/lib/og/card';
export const contentType = 'image/png';

// A city's share image (Phase 6): today's five prayers, as on its page (kept for an hour too).
export default async function Image({
  params,
}: PageProps<'/[locale]/prayer-times/[country]/[city]'>) {
  const { locale, country, city } = await params;
  const found = (await loadPlaces()).city(country, city);
  if (!isLocale(locale) || !found) notFound();
  const [t, tg, tc, format, day] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'glossary' }),
    getTranslations({ locale, namespace: 'common' }),
    getFormatter({ locale }),
    cityDay(found),
  ]);
  const zone = found.timeZone;
  return png(
    cityCard({
      rtl: locale === 'ar',
      brand: tc('app.name'),
      footer: t('title'),
      title: t('cityTitle', { city: cityName(found, locale) }),
      subtitle: `${countryName(found.countryCode, locale)} · ${format.dateTime(new Date(day.times.dhuhr), { weekday: 'long', day: 'numeric', month: 'long', timeZone: zone })}`,
      prayers: prayers.map((p) => ({
        name: tg(`prayer.${day.jumuah && p === 'dhuhr' ? 'jumuah' : p}`),
        time: format.dateTime(new Date(day.times[p]), {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: zone,
        }),
      })),
    }),
  );
}
