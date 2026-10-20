import type { Locale } from '@murshid/i18n';
import { getTranslations } from 'next-intl/server';
import { Text } from '@/components/ui/text';
import { countryName } from '@/lib/country-name';
import type { Places } from '@/lib/places';

// Every country as a public page (Phase 6): the way in to a city's prayer times, the countries in
// the page's own alphabetical order.

export async function PlacesIndex({ locale, places }: { locale: Locale; places: Places }) {
  const t = await getTranslations({ locale, namespace: 'places' });
  const collator = new Intl.Collator(locale);
  const countries = places.countries
    .map((c) => ({ slug: c.slug, name: countryName(c.code, locale) }))
    .sort((a, b) => collator.compare(a.name, b.name));

  return (
    <main id="main" className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 pt-6 pb-32">
      <header className="flex flex-col gap-2">
        <Text as="h1" role="title1">
          {t('indexTitle')}
        </Text>
        <Text role="callout" tone="muted">
          {t('indexBody')}
        </Text>
      </header>
      <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-4">
        {countries.map((c) => (
          <li key={c.slug}>
            <a
              href={`/${locale}/prayer-times/${c.slug}`}
              className="flex min-h-touch items-center rounded-control px-2 text-lantern-ink hover:bg-lantern/10"
            >
              {c.name}
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
