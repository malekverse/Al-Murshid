'use client';

import { ayahWords, loadSurahText } from '@murshid/content/quran';
import {
  readingThemes,
  reciterIds,
  translationIds,
  type QuranPrefs,
  type TranslationId,
} from '@murshid/data';
import { quranSizeRange, typeScale } from '@murshid/tokens';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: QuranPrefs;
}) {
  const t = useTranslations('quran');
  const locale = useLocale() as 'ar' | 'en' | 'fr';
  const format = useFormatter();
  const meaningsId = useId();
  const translitId = useId();
  const size = prefs.arabicSize ?? typeScale.quran.arabic.size;
  const translation = prefs.translations[locale];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('settings.title')}>
      <div className="flex flex-col gap-8 pb-4">
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

        <section className="flex flex-col gap-3">
          <Text as="h3" role="callout" tone="muted">
            {t('reciters.label')}
          </Text>
          <div role="radiogroup" aria-label={t('reciters.label')} className="flex flex-col gap-1">
            {reciterIds.map((id) => {
              const selected = prefs.reciter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setQuranPrefs({ reciter: id })}
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
                    {t(`reciters.${id}`)}
                  </Text>
                </button>
              );
            })}
          </div>
        </section>

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
