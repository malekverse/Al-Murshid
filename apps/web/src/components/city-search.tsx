'use client';

import { MagnifyingGlass } from '@phosphor-icons/react';
import { cityName, loadCities, type City, type CityIndex } from '@murshid/content/cities';
import { isolate } from '@murshid/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { countryName } from '@/lib/format';
import { Skeleton } from './ui/skeleton';
import { Text } from './ui/text';

/**
 * Search the offline city list in any of the three languages (SPEC 3: a manual city works
 * fully). The list loads on first use only.
 */
export function CitySearch({ onPick }: { onPick: (city: City) => void }) {
  const t = useTranslations('onboarding.location');
  const locale = useLocale();
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<CityIndex | null>(null);

  useEffect(() => {
    let live = true;
    void loadCities().then((loaded) => {
      if (live) setIndex(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  const typed = query.trim().length > 0;
  const results = index && typed ? index.search(query, 8) : [];
  const names = results.map((c) => cityName(c, locale));

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={inputId} className="sr-only">
        {t('searchLabel')}
      </label>
      <div className="relative">
        <MagnifyingGlass
          size={20}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 start-4 my-auto text-ink-muted"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            'min-h-touch w-full rounded-control border border-hairline bg-surface ps-12 pe-4 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-lantern',
            locale === 'ar' ? 'text-ar-body' : 'text-body',
          )}
        />
      </div>

      {typed && !index && (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {typed && index && results.length === 0 && (
        <Text role="callout" tone="muted" aria-live="polite">
          {t('noResults')}
        </Text>
      )}
      {results.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-card border border-card-edge bg-surface">
          {results.map((city, i) => {
            // Name the region only when two results share a name.
            const twin = names.some((n, j) => j !== i && n === names[i]);
            // The region is in English: isolate it so it never flips the line's direction.
            const where = [twin ? isolate(city.region) : '', countryName(city.countryCode, locale)]
              .filter(Boolean)
              .join(locale === 'ar' ? '، ' : ', ');
            return (
              <li key={city.id} className="border-b border-hairline last:border-b-0">
                <button
                  type="button"
                  onClick={() => onPick(city)}
                  className="flex min-h-touch w-full flex-col items-start px-4 py-3 text-start hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-lantern"
                >
                  <Text as="span" role="body">
                    {names[i]}
                  </Text>
                  <Text as="span" role="caption" tone="muted">
                    {where}
                  </Text>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
