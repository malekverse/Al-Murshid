import { cityName } from '@murshid/content/cities';
import { defaultMethodFor } from '@murshid/core';
import type { Locale } from '@murshid/i18n';
import { getTranslations } from 'next-intl/server';
import { Text } from '@/components/ui/text';
import { countryName } from '@/lib/country-name';
import type { Country, Places } from '@/lib/places';
import { breadcrumbs, JsonLd } from '@/lib/seo';
import { PlacesTrail } from './places-trail';

// A country's cities as a public page (Phase 6): every city of 15,000 people or more, the most
// populous first, each a link to its prayer times; and the method they are calculated with.

export async function CountryPage({
  locale,
  country,
  places,
}: {
  locale: Locale;
  country: Country;
  places: Places;
}) {
  const [t, ts] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'settings' }),
  ]);
  const name = countryName(country.code, locale);
  const method = defaultMethodFor(country.code);

  return (
    <main id="main" className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 pt-6 pb-32">
      <JsonLd
        data={breadcrumbs(locale, [
          { name: t('title'), path: '/prayer-times' },
          { name, path: `/prayer-times/${country.slug}` },
        ])}
      />
      <PlacesTrail
        locale={locale}
        trail={[{ label: t('title'), href: '/prayer-times' }, { label: name }]}
      />
      <header className="flex flex-col gap-2">
        <Text as="h1" role="title1">
          {t('countryTitle', { country: name })}
        </Text>
        <Text role="callout" tone="muted">
          {t('cities', { count: country.cities.length })}
        </Text>
        <Text role="caption" tone="muted">
          {t('method', { method: ts(`method.names.${method}`), asr: ts('asr.standard') })}
        </Text>
      </header>
      <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-4">
        {country.cities.map((c) => (
          <li key={c.id}>
            <a
              href={`/${locale}/prayer-times/${places.path(c)}`}
              className="flex min-h-touch items-center rounded-control px-2 text-lantern-ink hover:bg-lantern/10"
            >
              {cityName(c, locale)}
            </a>
          </li>
        ))}
      </ul>
      <Text role="caption" tone="muted">
        {t('source')}
      </Text>
    </main>
  );
}
