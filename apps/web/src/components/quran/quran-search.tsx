'use client';

import { MagnifyingGlass } from '@phosphor-icons/react';
import {
  ayahWords,
  loadSurahText,
  searchQuran,
  surah as surahInfo,
  type AyahRef,
  type QuranSearchResult,
} from '@murshid/content/quran';
import { translationFor, translationLanguage } from '@murshid/data';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useLoad } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { readerHref, readerPlace, useSurahName, type ReaderPlace } from './common';

/** One found ayah: its reference and its published text, clamped to two lines. */
function AyahResult({ at, place }: { at: AyahRef; place: ReaderPlace }) {
  const name = useSurahName();
  const format = useFormatter();
  const text = useLoad(() => loadSurahText(at.surah), `text/${at.surah}`);
  const s = surahInfo(at.surah);
  return (
    <li>
      <Link
        href={readerHref(at.surah, at.ayah, place)}
        className="flex flex-col gap-2 rounded-card px-4 py-3 hover:bg-ink/5"
      >
        <Text as="span" role="caption" tone="lantern">
          {`${name(s)} ${format.number(at.ayah)}`}
        </Text>
        {text.data ? (
          <p lang="ar" dir="rtl" className="line-clamp-2 font-quran text-ar-body text-ink">
            {ayahWords(text.data, at.ayah)
              .map((w) => w.text + w.after)
              .join('')}
          </p>
        ) : (
          <Skeleton className="h-6 w-full" />
        )}
      </Link>
    </li>
  );
}

/** Search within the Quran (SPEC 4): a reference, a surah's name, Arabic words or the translation. */
export function QuranSearch({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (query: string) => void;
}) {
  const t = useTranslations('quran.search');
  const tSurah = useTranslations('quran.surah');
  const locale = useLocale();
  const format = useFormatter();
  const name = useSurahName();
  const settings = useSettings();
  const inputId = useId();
  const [result, setResult] = useState<QuranSearchResult | null>(null);
  const place = readerPlace(settings?.quran);
  // Latin queries search the translation shown in this language (English when there is none).
  const translation = settings ? translationFor(settings.quran, locale) : null;
  const lang = translation ? translationLanguage[translation] : locale === 'fr' ? 'fr' : 'en';

  useEffect(() => {
    if (!query.trim()) return;
    let live = true;
    const id = setTimeout(() => {
      searchQuran(query, lang).then((r) => live && setResult(r));
    }, 200);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [query, lang]);

  const shown = query.trim() ? result : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          {t('label')}
        </label>
        <MagnifyingGlass
          aria-hidden
          size={20}
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t('placeholder')}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            'min-h-touch w-full rounded-control border border-hairline bg-surface ps-12 pe-4 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-lantern',
            locale === 'ar' ? 'text-ar-body' : 'text-body',
          )}
        />
      </div>

      {shown && (
        <div aria-live="polite" className="flex flex-col gap-4">
          {shown.reference && shown.surahs.length === 0 && (
            <Link
              href={readerHref(shown.reference.surah, shown.reference.ayah, place)}
              className="rounded-card bg-lantern/10 px-4 py-3"
            >
              <Text as="span" role="callout" tone="lantern">
                {t('goTo', {
                  surah: name(surahInfo(shown.reference.surah)),
                  ayah: format.number(shown.reference.ayah),
                })}
              </Text>
            </Link>
          )}
          {shown.surahs.length > 0 && (
            <section className="flex flex-col gap-1">
              <Text as="h2" role="callout" tone="muted" className="px-4">
                {t('surahs')}
              </Text>
              <ul>
                {shown.surahs.map((s) => (
                  <li key={s.number}>
                    <Link
                      href={readerHref(s.number, 1, place)}
                      className="flex min-h-touch items-center justify-between gap-4 rounded-card px-4 py-2 hover:bg-ink/5"
                    >
                      <Text as="span" role="body">
                        {`${format.number(s.number)}. ${name(s)}`}
                      </Text>
                      <Text as="span" role="caption" tone="muted">
                        {tSurah('ayahs', { count: s.ayahCount })}
                      </Text>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {shown.ayahs.length > 0 && (
            <section className="flex flex-col gap-1">
              <Text as="h2" role="callout" tone="muted" className="px-4">
                {t('ayahs', { count: shown.total })}
              </Text>
              <ul className="flex flex-col">
                {shown.ayahs.map((a) => (
                  <AyahResult key={`${a.surah}:${a.ayah}`} at={a} place={place} />
                ))}
              </ul>
              {shown.total > shown.ayahs.length && (
                <Text role="caption" tone="muted" className="px-4">
                  {t('more', { shown: shown.ayahs.length, total: shown.total })}
                </Text>
              )}
            </section>
          )}
          {!shown.reference && shown.surahs.length === 0 && shown.ayahs.length === 0 && (
            <Text role="body" tone="muted" className="px-4">
              {t('none', { query })}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
