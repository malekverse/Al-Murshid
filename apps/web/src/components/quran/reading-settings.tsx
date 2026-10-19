'use client';

import {
  ayahWords,
  loadSurahText,
  normalizeArabic,
  normalizeLatin,
  reciter as reciterInfo,
} from '@murshid/content/quran';
import {
  editionIds,
  readingThemes,
  reciterIds,
  translationIds,
  type QuranPrefs,
  type TranslationId,
} from '@murshid/data';
import { quranSizeRange, typeScale } from '@murshid/tokens';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { useLoad } from '@/lib/quran';
import { updateSettings } from '@/lib/settings';
import { cn } from '@/lib/cn';

const speeds = ['0.75', '1', '1.25', '1.5'] as const;
const repeats = ['1', '2', '3', '5', '10'] as const;

export function setQuranPrefs(change: Partial<QuranPrefs>) {
  updateSettings((s) => ({ ...s, quran: { ...s.quran, ...change } }));
}

/** The three ways to read (Phase 5b): the mushaf's pages, the Arabic text, or with translation. */
export type ReaderView = 'mushaf' | 'text' | 'translation';
export const readerView = (prefs: QuranPrefs): ReaderView =>
  prefs.view === 'mushaf' ? 'mushaf' : prefs.layout;

const styles = ['murattal', 'mujawwad', 'teaching'] as const;

/**
 * The reciters (Phase 5b: 18), grouped by how they recite, with a search once the list is long.
 * Those whose timestamps follow ayahs rather than words say so: the highlight moves by ayah.
 */
function ReciterList({ value }: { value: QuranPrefs['reciter'] }) {
  const t = useTranslations('quran.reciters');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const q = query.trim();
  const matches = (name: string) =>
    !q ||
    normalizeLatin(name).includes(normalizeLatin(q)) ||
    normalizeArabic(name).includes(normalizeArabic(q));
  return (
    <section className="flex flex-col gap-3">
      <Text as="h3" role="callout" tone="muted">
        {t('label')}
      </Text>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search')}
        aria-label={t('search')}
        className={cn(
          'min-h-touch rounded-control border border-hairline bg-canvas px-4 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-lantern',
          locale === 'ar' ? 'text-ar-body' : 'text-body',
        )}
      />
      {styles.map((style) => {
        const ids = reciterIds.filter((id) => reciterInfo(id).style === style && matches(t(id)));
        if (ids.length === 0) return null;
        return (
          <div
            key={style}
            role="radiogroup"
            aria-label={t(`styles.${style}`)}
            className="flex flex-col gap-1"
          >
            <Text as="h4" role="caption" tone="muted" className="px-4 pt-2">
              {t(`styles.${style}`)}
            </Text>
            {ids.map((id) => {
              const selected = value === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setQuranPrefs({ reciter: id })}
                  className={cn(
                    'flex min-h-touch items-center gap-3 rounded-control px-4 py-2 text-start',
                    selected ? 'bg-lantern/15 text-lantern-ink' : 'hover:bg-ink/5',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-4 shrink-0 rounded-full border-2',
                      selected ? 'border-lantern bg-lantern' : 'border-hairline',
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <Text as="span" role="body" tone="inherit">
                      {t(id)}
                    </Text>
                    {!reciterInfo(id).words && (
                      <Text as="span" role="caption" tone="muted">
                        {t('byAyah')}
                      </Text>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
      {styles.every((style) =>
        reciterIds.every((id) => reciterInfo(id).style !== style || !matches(t(id))),
      ) && (
        <Text role="callout" tone="muted" className="px-4">
          {t('none')}
        </Text>
      )}
    </section>
  );
}

/** A short sample so the size can be judged: Al-Fatihah 2, as published. */
function SizeSample({ size }: { size: number }) {
  const t = useTranslations('quran.settings');
  const text = useLoad(() => loadSurahText(1), 'text/1');
  const words = text.data ? ayahWords(text.data, 2) : null;
  return (
    <div className="rounded-control bg-canvas px-4 py-3" aria-label={t('sample')}>
      {words && (
        <p
          lang="ar"
          dir="rtl"
          className="font-quran text-ink"
          style={{ fontSize: size, lineHeight: typeScale.quran.arabic.lineHeight }}
        >
          {words.map((w) => w.text + w.after).join('')}
        </p>
      )}
    </div>
  );
}

export function ReadingSettings({
  open,
  onOpenChange,
  prefs,
  view,
  onView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: QuranPrefs;
  /** The view on screen, and how to switch to another (the reader moves to the same place). */
  view: ReaderView;
  onView: (view: ReaderView) => void;
}) {
  const t = useTranslations('quran');
  const locale = useLocale() as 'ar' | 'en' | 'fr';
  const format = useFormatter();
  const meaningsId = useId();
  const translitId = useId();
  const tajweedId = useId();
  const year = (y: number) => format.number(y, { useGrouping: false });
  const editionYear = { v1: 1405, v2: 1421, v4: 1441 } as const;
  const size = prefs.arabicSize ?? typeScale.quran.arabic.size;
  const translation = prefs.translations[locale];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('settings.title')}>
      <div className="flex flex-col gap-8 pb-4">
        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('settings.view')}
          </Text>
          <Segmented
            label={t('settings.view')}
            value={view}
            onChange={(v) => {
              onOpenChange(false);
              if (v !== view) onView(v);
            }}
            options={(['mushaf', 'text', 'translation'] as const).map((v) => ({
              value: v,
              label: t(`settings.views.${v}`),
            }))}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('settings.edition')}
          </Text>
          <div role="radiogroup" aria-label={t('settings.edition')} className="flex flex-col gap-1">
            {editionIds.map((id) => {
              const selected = prefs.edition === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    // Only the 1441H pages carry tajweed colors.
                    setQuranPrefs({ edition: id, tajweed: id === 'v4' && prefs.tajweed })
                  }
                  className={cn(
                    'flex min-h-touch items-center gap-3 rounded-control px-4 text-start',
                    selected ? 'bg-lantern/15 text-lantern-ink' : 'hover:bg-ink/5',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-4 shrink-0 rounded-full border-2',
                      selected ? 'border-lantern bg-lantern' : 'border-hairline',
                    )}
                  />
                  <Text as="span" role="body" tone="inherit">
                    {id === 'indopak'
                      ? t('settings.editions.indopak', { lines: format.number(15) })
                      : t('settings.editions.madani', { year: year(editionYear[id]) })}
                  </Text>
                </button>
              );
            })}
          </div>
          <ListGroup>
            <ListRow
              title={t('settings.tajweed')}
              subtitle={t('settings.tajweedHint', { year: year(1441) })}
              titleId={tajweedId}
              control={
                <Toggle
                  checked={prefs.tajweed && prefs.edition === 'v4'}
                  onChange={(on) =>
                    setQuranPrefs(on ? { tajweed: true, edition: 'v4' } : { tajweed: false })
                  }
                  labelledBy={tajweedId}
                />
              }
            />
          </ListGroup>
        </section>

        <section className="flex flex-col gap-3">
          <Slider
            label={t('settings.arabicSize')}
            min={quranSizeRange.min}
            max={quranSizeRange.max}
            step={2}
            value={size}
            valueText={format.number(size)}
            onChange={(v) => setQuranPrefs({ arabicSize: v })}
          />
          <SizeSample size={size} />
        </section>

        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('settings.translation')}
          </Text>
          <div
            role="radiogroup"
            aria-label={t('settings.translation')}
            className="flex flex-col gap-1"
          >
            {([null, ...translationIds] as (TranslationId | null)[]).map((id) => {
              const selected = translation === id;
              return (
                <button
                  key={id ?? 'none'}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    setQuranPrefs({ translations: { ...prefs.translations, [locale]: id } })
                  }
                  className={cn(
                    'flex min-h-touch items-center gap-3 rounded-control px-4 text-start',
                    selected ? 'bg-lantern/15 text-lantern-ink' : 'hover:bg-ink/5',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-4 shrink-0 rounded-full border-2',
                      selected ? 'border-lantern bg-lantern' : 'border-hairline',
                    )}
                  />
                  <Text as="span" role="body" tone="inherit">
                    {t(`settings.${id ?? 'none'}`)}
                  </Text>
                </button>
              );
            })}
          </div>
        </section>

        <ListGroup>
          <ListRow
            title={t('settings.wordMeanings')}
            titleId={meaningsId}
            control={
              <Toggle
                checked={prefs.wordMeanings}
                onChange={(v) => setQuranPrefs({ wordMeanings: v })}
                labelledBy={meaningsId}
              />
            }
          />
          <ListRow
            title={t('settings.transliteration')}
            titleId={translitId}
            control={
              <Toggle
                checked={prefs.transliteration}
                onChange={(v) => setQuranPrefs({ transliteration: v })}
                labelledBy={translitId}
              />
            }
          />
        </ListGroup>

        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('settings.theme')}
          </Text>
          <Segmented
            label={t('settings.theme')}
            value={prefs.theme}
            onChange={(theme) => setQuranPrefs({ theme })}
            options={readingThemes.map((v) => ({ value: v, label: t(`settings.themes.${v}`) }))}
          />
        </section>

        <ReciterList value={prefs.reciter} />

        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('audio.speed')}
          </Text>
          <Segmented
            label={t('audio.speed')}
            value={String(prefs.speed) as (typeof speeds)[number]}
            onChange={(v) => setQuranPrefs({ speed: Number(v) })}
            options={speeds.map((v) => ({
              value: v,
              label: `${format.number(Number(v))}×`,
            }))}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('audio.repeat')}
          </Text>
          <Segmented
            label={t('audio.repeat')}
            value={String(prefs.repeat) as (typeof repeats)[number]}
            onChange={(v) => setQuranPrefs({ repeat: Number(v) })}
            options={repeats.map((v) => ({ value: v, label: `${format.number(Number(v))}×` }))}
          />
        </section>
      </div>
    </Sheet>
  );
}
