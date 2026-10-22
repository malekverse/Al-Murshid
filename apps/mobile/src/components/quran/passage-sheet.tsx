import { surah as surahInfo } from '@murshid/content/quran';
import { bookmarkColors, bookmarkEnd, type BookmarkColor, type QuranBookmark } from '@murshid/data';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { setBookmark } from '@/lib/quran';
import { markColor, useReaderTheme } from './common';
import type { PassagePlan } from './recitation';
import { haptics } from '@/lib/haptics';

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
      onClose={onClose}
      title={target ? t(target.mode === 'repeat' ? 'repeat' : 'bookmark') : ''}
    >
      {target && (
        <PassageForm
          key={`${target.surah}:${target.ayah}:${target.mode}`}
          target={target}
          onClose={onClose}
          onRepeat={onRepeat}
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
  const theme = useReaderTheme();
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
    <View className="gap-6">
      <View className="gap-2">
        <View className="flex-row items-baseline justify-between gap-4">
          <Text role="body">{t('range.from', { ayah: format.number(target.ayah) })}</Text>
          <Text role="body" tone="lantern">
            {`${t('range.to')} ${format.number(to)}`}
          </Text>
        </View>
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
      </View>

      {target.mode === 'repeat' ? (
        <>
          <View className="gap-2">
            <Text role="callout" tone="muted">
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
          </View>
          <ListGroup>
            <ListRow
              title={t('range.gap')}
              subtitle={t('range.gapHint')}
              control={<Toggle label={t('range.gap')} checked={gap} onChange={setGap} />}
            />
          </ListGroup>
          <Button
            onPress={() => {
              onRepeat(target.surah, target.ayah, { to, times: Number(times), gap });
              onClose();
            }}
          >
            {t('range.start')}
          </Button>
        </>
      ) : (
        <>
          <View className="gap-2">
            <Text role="callout" tone="muted">
              {t('bookmarks.colors.label')}
            </Text>
            <View
              className="flex-row gap-3"
              accessibilityRole="radiogroup"
              accessibilityLabel={t('bookmarks.colors.label')}
            >
              {bookmarkColors.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: color === c }}
                  accessibilityLabel={t(`bookmarks.colors.${c}`)}
                  onPress={() => {
                    setColor(c);
                    haptics.selection();
                  }}
                  className={`size-touch items-center justify-center rounded-full ${color === c ? 'border-2 border-focus' : ''}`}
                >
                  <View
                    className="size-6 rounded-full"
                    style={{ backgroundColor: markColor(theme, c) }}
                  />
                </Pressable>
              ))}
            </View>
          </View>
          <Button
            onPress={() => {
              setBookmark(target.surah, target.ayah, color, to);
              haptics.success();
              onClose();
            }}
          >
            {t('range.save')}
          </Button>
        </>
      )}
    </View>
  );
}
