'use client';

import { surah as surahInfo } from '@murshid/content/quran';
import { bookmarkColors, bookmarkEnd, type BookmarkColor, type QuranBookmark } from '@murshid/data';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/cn';
import { setBookmark } from '@/lib/quran';
import { markClass } from './quran-home';
import type { PassagePlan } from './recitation';

const timesOptions = ['1', '2', '3', '5', '10'] as const;

export interface PassageTarget {
  surah: number;
  /** Where the passage starts. */
  ayah: number;
  mode: 'bookmark' | 'repeat';
  /** The bookmark starting here, if any: its passage and color are the starting point. */
  bookmark: QuranBookmark | null;
}

/**
 * A passage from one ayah to another in the same surah (Phase 5b): marked in a color, or played
 * several times while memorizing, with an optional pause after each ayah to recite it back.
 */
export function PassageSheet({
  target,
  onClose,
  onRepeat,
}: {
  target: PassageTarget | null;
  onClose: () => void;
  onRepeat: (surah: number, from: number, plan: PassagePlan) => void;
}) {
  const t = useTranslations('quran.range');
  return (
    <Sheet
      open={target !== null}
      onOpenChange={(o) => !o && onClose()}
      title={target ? t(target.mode === 'repeat' ? 'repeat' : 'bookmark') : ''}
    >
      {target && (
        <PassageForm
          key={`${target.surah}:${target.ayah}:${target.mode}`}
          {...{ target, onClose, onRepeat }}
        />
      )}
    </Sheet>
  );
}

function PassageForm({
  target,
  onClose,
  onRepeat,
}: {
  target: PassageTarget;
  onClose: () => void;
  onRepeat: (surah: number, from: number, plan: PassagePlan) => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const gapId = useId();
  const count = surahInfo(target.surah).ayahCount;
  const [to, setTo] = useState(() =>
    target.bookmark
      ? Math.max(bookmarkEnd(target.bookmark), Math.min(count, target.ayah + 1))
      : Math.min(count, target.ayah + (target.mode === 'repeat' ? 4 : 1)),
  );
  const [times, setTimes] = useState<(typeof timesOptions)[number]>('3');
  const [gap, setGap] = useState(false);
  const [color, setColor] = useState<BookmarkColor>(target.bookmark?.color ?? 'lantern');

  return (
    <div className="flex flex-col gap-6 pb-4">
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <Text as="span" role="body">
            {t('range.from', { ayah: format.number(target.ayah) })}
          </Text>
          <Text as="span" role="body" tone="lantern">
            {`${t('range.to')} ${format.number(to)}`}
          </Text>
        </div>
        {count > target.ayah && (
          <Slider
            label={t('range.to')}
            min={target.ayah}
            max={count}
            value={to}
            valueText={format.number(to)}
            onChange={setTo}
          />
        )}
      </section>

      {target.mode === 'repeat' ? (
        <>
          <section className="flex flex-col gap-3">
            <Text as="h3" role="callout" tone="muted">
              {t('range.times')}
            </Text>
            <Segmented
              label={t('range.times')}
              value={times}
              onChange={setTimes}
              options={timesOptions.map((v) => ({
                value: v,
                label: `${format.number(Number(v))}×`,
              }))}
            />
          </section>
          <ListGroup>
            <ListRow
              title={t('range.gap')}
              subtitle={t('range.gapHint')}
              titleId={gapId}
              control={<Toggle checked={gap} onChange={setGap} labelledBy={gapId} />}
            />
          </ListGroup>
          <Button
            onClick={() => {
              onRepeat(target.surah, target.ayah, { to, times: Number(times), gap });
              onClose();
            }}
          >
            {t('range.start')}
          </Button>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <Text as="h3" role="callout" tone="muted">
              {t('bookmarks.colors.label')}
            </Text>
            <div role="radiogroup" aria-label={t('bookmarks.colors.label')} className="flex gap-3">
              {bookmarkColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={t(`bookmarks.colors.${c}`)}
                  onClick={() => setColor(c)}
                  className={cn(
                    'flex size-touch items-center justify-center rounded-full',
                    color === c && 'ring-2 ring-focus ring-offset-2 ring-offset-surface',
                  )}
                >
                  <span className={cn('size-6 rounded-full', markClass[c])} />
                </button>
              ))}
            </div>
          </section>
          <Button
            onClick={() => {
              void setBookmark(target.surah, target.ayah, color, to);
              onClose();
            }}
          >
            {t('range.save')}
          </Button>
        </>
      )}
    </div>
  );
}
