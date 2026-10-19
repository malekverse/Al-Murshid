'use client';

import { DotsThree } from '@phosphor-icons/react';
import type { TranslationSegment, Word } from '@murshid/content/quran';
import type { BookmarkColor } from '@murshid/data';
import { typeScale } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import type { Ref } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { markClass } from './quran-home';

export interface AyahViewProps {
  ref?: Ref<HTMLElement>;
  surah: number;
  ayah: number;
  surahName: string;
  /** The ayah's words as published; the last is its number. */
  words: Word[];
  meanings?: (string | null)[];
  transliteration?: (string | null)[];
  translation?: TranslationSegment[];
  footnotes?: Record<string, string>;
  size: number;
  /** The recitation is on this ayah, and on this word. */
  playing: boolean;
  playingWord: number | null;
  bookmark: BookmarkColor | null;
  sajda: boolean;
  onWord: (index: number, target: HTMLElement) => void;
  onFootnote: (mark: string, text: string) => void;
  onActions: () => void;
}

/**
 * One ayah in the verse view (SPEC 5.5). The words are the published text, cut word by word, with
 * their separators exactly as published, so joined they are the ayah byte for byte. Tapping a
 * word shows its meaning. Quran text never animates; the playing word is simply marked.
 */
export function AyahView({
  surah,
  ayah,
  surahName,
  words,
  meanings,
  transliteration,
  translation,
  footnotes,
  size,
  playing,
  playingWord,
  bookmark,
  sajda,
  onWord,
  onFootnote,
  onActions,
  ref,
}: AyahViewProps) {
  const t = useTranslations('quran');
  const tAyah = useTranslations('components.ayah');
  const format = useFormatter();
  const stacked = Boolean(meanings || transliteration);
  const lineHeight = typeScale.quran.arabic.lineHeight;
  const wordClass = (i: number) =>
    cn(
      'cursor-pointer rounded-control',
      playing && playingWord === i + 1 ? 'bg-lantern/25' : 'hover:bg-ink/5',
    );

  return (
    <article
      ref={ref}
      id={`ayah-${ayah}`}
      data-ayah={ayah}
      aria-label={tAyah('label', { surah: surahName, number: ayah })}
      className={cn(
        'flex scroll-mt-24 flex-col gap-4 border-b border-hairline px-2 py-6',
        playing && 'rounded-card bg-lantern/5',
      )}
    >
      {stacked ? (
        <div lang="ar" dir="rtl" className="flex flex-wrap items-start gap-x-4 gap-y-6">
          {words.map((w, i) => {
            const number = i === words.length - 1;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={cn('font-quran text-ink', !number && wordClass(i))}
                  style={{ fontSize: size, lineHeight }}
                  onClick={number ? undefined : (e) => onWord(i, e.currentTarget)}
                >
                  {w.text}
                </span>
                {!number && meanings && (
                  <Text
                    as="span"
                    role="caption"
                    tone="muted"
                    dir="auto"
                    className="max-w-32 text-center"
                  >
                    {meanings[i] ?? ''}
                  </Text>
                )}
                {!number && transliteration && (
                  <Text as="span" role="caption" tone="lantern" dir="ltr" className="text-center">
                    {transliteration[i] ?? ''}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p
          lang="ar"
          dir="rtl"
          className="font-quran text-ink"
          style={{ fontSize: size, lineHeight }}
        >
          {words.map((w, i) =>
            i === words.length - 1 ? (
              <span key={i}>{w.text}</span>
            ) : (
              <span key={i}>
                <span className={wordClass(i)} onClick={(e) => onWord(i, e.currentTarget)}>
                  {w.text}
                </span>
                {w.after}
              </span>
            ),
          )}
        </p>
      )}

      {translation && (
        <Text role="body" className="whitespace-pre-line">
          {translation.map((seg, i) => {
            if (typeof seg === 'string') return <span key={i}>{seg}</span>;
            const note = footnotes?.[seg[1]];
            if (!note) return null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onFootnote(seg[0], note)}
                aria-label={t('reader.footnote', { mark: seg[0] })}
                className="rounded-full px-1 align-super text-caption text-lantern-ink hover:bg-lantern/10"
              >
                {seg[0]}
              </button>
            );
          })}
        </Text>
      )}

      <div className="flex items-center gap-3">
        <Text as="span" role="caption" tone="muted">
          {`${format.number(surah)}:${format.number(ayah)}`}
        </Text>
        {sajda && (
          <Text as="span" role="caption" tone="lantern">
            {t('reader.sajda')}
          </Text>
        )}
        {bookmark && (
          <span
            role="img"
            aria-label={t(`bookmarks.colors.${bookmark}`)}
            className={cn('size-3 rounded-full', markClass[bookmark])}
          />
        )}
        <span className="flex-1" />
        <IconButton
          icon={DotsThree}
          label={t('actions.label', { surah, ayah })}
          onClick={onActions}
        />
      </div>
    </article>
  );
}
