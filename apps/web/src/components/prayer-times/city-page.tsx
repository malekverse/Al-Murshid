import { cityName, type City } from '@murshid/content/cities';
import { prayers, timeNames, type TimeName } from '@murshid/core';
import { locationFromCity } from '@murshid/data';
import { messages, type Locale } from '@murshid/i18n';
import { getFormatter, getTranslations } from 'next-intl/server';
import { PrayerGlyph } from '@/components/ui/prayer-glyph';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { CityDay } from '@/lib/city-times';
import { countryName } from '@/lib/country-name';
import type { Places } from '@/lib/places';
import { breadcrumbs, JsonLd, siteUrl } from '@/lib/seo';
import { NextPrayer } from './next-prayer';
import { PlacesTrail } from './places-trail';
import { UseCity } from './use-city';

// A city's prayer times as a public page (SPEC 4, Phase 6): today's five prayers and sunrise in
// the city's own time, the next one counted down in the visitor's browser, the method they are
// calculated with, the Qibla, the month's timetable, and other cities of the country. Sent by the
// server; only the countdown and "Use this city" run in the browser.

type HijriMonth = keyof (typeof messages)['en']['glossary']['hijriMonths'];

const cardClass = 'rounded-card border border-card-edge bg-surface shadow-card dark:shadow-none';

export async function CityPage({
  locale,
  city,
  day,
  places,
}: {
  locale: Locale;
  city: City;
  day: CityDay;
  places: Places;
}) {
  const [t, tg, ts, tq, tc, format] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'glossary' }),
    getTranslations({ locale, namespace: 'settings' }),
    getTranslations({ locale, namespace: 'qibla' }),
    getTranslations({ locale, namespace: 'components.prayer' }),
    getFormatter({ locale }),
  ]);
  const zone = city.timeZone;
  const name = cityName(city, locale);
  const country = countryName(city.countryCode, locale);
  const countryPath = places.path(city).split('/')[0]!;
  const time = (at: string) =>
    format.dateTime(new Date(at), { hour: 'numeric', minute: '2-digit', timeZone: zone });
  const prayerName = (n: TimeName, jumuah = false) =>
    tg(`prayer.${jumuah && n === 'dhuhr' ? 'jumuah' : n}`);
  const noon = new Date(day.times.dhuhr);
  const others = places
    .country(countryPath)!
    .cities.filter((c) => c.id !== city.id)
    .slice(0, 12);

  return (
    <main id="main" className="mx-auto flex w-full max-w-reading flex-col gap-8 px-4 pt-6 pb-32">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: t('cityTitle', { city: name }),
          url: `${siteUrl}/${locale}/prayer-times/${places.path(city)}`,
          inLanguage: locale,
          about: {
            '@type': 'City',
            name,
            geo: { '@type': 'GeoCoordinates', latitude: city.latitude, longitude: city.longitude },
            containedInPlace: { '@type': 'Country', name: country },
          },
        }}
      />
      <JsonLd
        data={breadcrumbs(locale, [
          { name: t('title'), path: '/prayer-times' },
          { name: country, path: `/prayer-times/${countryPath}` },
          { name, path: `/prayer-times/${places.path(city)}` },
        ])}
      />
      <PlacesTrail
        locale={locale}
        trail={[
          { label: t('title'), href: '/prayer-times' },
          { label: country, href: `/prayer-times/${countryPath}` },
          { label: name },
        ]}
      />

      <header className="flex flex-col gap-2">
        <Text as="h1" role="title1">
          {t('cityTitle', { city: name })}
        </Text>
        <Text role="callout" tone="muted">
          {/* Each date stays on one line: the day of the week, then the Hijri date. */}
          <span className="whitespace-nowrap">
            {t('today', {
              date: format.dateTime(noon, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: zone,
              }),
            })}
          </span>{' '}
          ·{' '}
          <span className="whitespace-nowrap">
            {tg('hijriDate', {
              day: format.number(day.hijri.day),
              month: tg(`hijriMonths.${String(day.hijri.month) as HijriMonth}`),
              year: format.number(day.hijri.year, { useGrouping: false }),
            })}
          </span>
        </Text>
      </header>

      <section aria-labelledby="today" className={cn(cardClass, 'flex flex-col gap-2 p-4')}>
        <h2 id="today" className="sr-only">
          {t('title')}
        </h2>
        <NextPrayer
          locale={locale}
          prayers={[
            ...prayers.map((p) => ({ name: prayerName(p, day.jumuah), at: day.times[p] })),
            { name: prayerName('fajr'), at: day.tomorrowFajr },
          ]}
          template={t('next')}
          className={cn(
            'px-4 pt-2 text-lantern-ink',
            locale === 'ar' ? 'text-ar-headline' : 'text-headline',
          )}
        />
        {timeNames.map((n) => {
          const marker = n === 'sunrise';
          const key = day.jumuah && n === 'dhuhr' ? 'jumuah' : n;
          return (
            <div
              key={n}
              role="group"
              aria-label={tc('row', {
                name: prayerName(n, day.jumuah),
                time: time(day.times[n]),
                state: 'other',
              })}
              className={cn(
                'flex w-full items-center gap-4 rounded-control px-4',
                marker ? 'min-h-12' : 'min-h-16',
              )}
            >
              <PrayerGlyph prayer={n} className="shrink-0 text-ink-muted" />
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <Text
                  as="span"
                  role={marker ? 'callout' : 'body'}
                  tone={marker ? 'muted' : 'default'}
                >
                  {prayerName(n, day.jumuah)}
                </Text>
                {/* The Arabic name is always present (SPEC 5.1). */}
                {locale !== 'ar' && (
                  <Text as="span" role="caption" tone="muted" script="arabic">
                    {messages.ar.glossary.prayer[key]}
                  </Text>
                )}
              </span>
              <Text
                as="time"
                dateTime={day.times[n]}
                role={marker ? 'callout' : 'body'}
                tone={marker ? 'muted' : 'default'}
                className="tabular"
              >
                {time(day.times[n])}
              </Text>
            </div>
          );
        })}
      </section>

      <div className="flex flex-col gap-3">
        <Text role="callout" tone="muted">
          {t('method', {
            method: ts(`method.names.${day.method}`),
            asr: ts('asr.standard'),
          })}
        </Text>
        <Text role="caption" tone="muted">
          {t('methodNote')}
        </Text>
        <UseCity
          locale={locale}
          location={locationFromCity(city)}
          method={day.method}
          label={t('useCity')}
        />
        <Text role="caption" tone="muted">
          {t('useCityHint')}
        </Text>
      </div>

      <section aria-labelledby="qibla" className={cn(cardClass, 'flex flex-col gap-1 p-6')}>
        <Text as="h2" id="qibla" role="headline">
          {t('qibla')}
        </Text>
        <Text role="body">
          {tq('bearing', { degrees: `${format.number(Math.round(day.qibla.bearing))}°` })}
        </Text>
        <Text role="callout" tone="muted">
          {tq('distance', {
            distance: format.number(Math.round(day.qibla.km), {
              style: 'unit',
              unit: 'kilometer',
            }),
          })}
        </Text>
      </section>

      <section aria-labelledby="month" className="flex flex-col gap-3">
        <Text as="h2" id="month" role="title2">
          {t('month', {
            month: format.dateTime(noon, { month: 'long', year: 'numeric', timeZone: zone }),
          })}
        </Text>
        {/* Wide on small screens: the table scrolls on its own, never the page. */}
        <div className={cn(cardClass, 'overflow-x-auto')}>
          <table className="w-full min-w-max border-collapse text-caption">
            <thead>
              <tr className="border-b border-hairline text-ink-muted">
                <th scope="col" className="px-3 py-2 text-start font-medium">
                  {t('day')}
                </th>
                {timeNames.map((n) => (
                  <th key={n} scope="col" className="px-2 py-2 text-end font-medium">
                    {prayerName(n)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {day.month.map((row) => {
                const isToday = row.date.day === day.date.day;
                return (
                  <tr
                    key={row.date.day}
                    aria-current={isToday ? 'date' : undefined}
                    className={cn(
                      'border-b border-hairline last:border-0',
                      isToday && 'bg-lantern/10',
                    )}
                  >
                    <th scope="row" className="px-3 py-2 text-start font-normal whitespace-nowrap">
                      {format.dateTime(new Date(row.times.dhuhr), {
                        weekday: 'short',
                        day: 'numeric',
                        timeZone: zone,
                      })}
                    </th>
                    {timeNames.map((n) => (
                      <td key={n} className="tabular px-2 py-2 text-end whitespace-nowrap">
                        {time(row.times[n])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="nearby" className="flex flex-col gap-3">
          <Text as="h2" id="nearby" role="title2">
            {t('nearby', { country })}
          </Text>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {others.map((c) => (
              <li key={c.id}>
                <a
                  href={`/${locale}/prayer-times/${places.path(c)}`}
                  className="block min-h-touch rounded-control px-2 py-3 text-lantern-ink hover:bg-lantern/10"
                >
                  {cityName(c, locale)}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`/${locale}/prayer-times/${countryPath}`}
            className="self-start rounded-full px-4 py-3 text-lantern-ink hover:bg-lantern/10"
          >
            {t('allCities')}
          </a>
        </section>
      )}

      <Text role="caption" tone="muted">
        {t('source')}
      </Text>
    </main>
  );
}
