'use client';

import { DotsThree } from '@phosphor-icons/react';
import type { TranslationSegment, Word } from '@murshid/content/quran';
import type { QuranBookmark } from '@murshid/data';
import { typeScale } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode, Ref } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Veil, type Memorize } from './memorize';
import { markClass } from './quran-home';
import {
  ayahClass,
  ayahFooterClass,
  footnoteClass,
  wordClass as wordClasses,
} from './reader-markup';
import { useNearViewport, useTajweedWords, type Tajweed } from './tajweed';

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
  /** The bookmark marking this ayah, alone or as part of a passage. */
  bookmark: QuranBookmark | null;
  sajda: boolean;
  /** What memorizing hides, and the id of the ayah's first word (ids name revealed words). */
  memorize: Memorize;
  firstWordId: number;
  /** Draws the words in their 1441H tajweed glyphs, when on. */
  tajweed: Tajweed | null;
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
  memorize,
  firstWordId,
  tajweed,
  onWord,
  onFootnote,
  onActions,
  ref,
}: AyahViewProps) {
  const [observe, near] = useNearViewport();
  const glyphOf = useTajweedWords(tajweed, firstWordId, firstWordId + words.length - 1, near);
  /**
   * A word as drawn: its tajweed glyph when on and ready, otherwise as published. Glyphs mean
   * nothing aloud: screen readers get the published text, kept apart below.
   */
  const drawn = (i: number, text: string) => {
    const g = glyphOf?.(firstWordId + i);
    return g ? (
      <span aria-hidden style={g.style}>
        {g.glyph}
      </span>
    ) : (
      text
    );
  };
  const t = useTranslations('quran');
  const tAyah = useTranslations('components.ayah');
  const format = useFormatter();
  const stacked = Boolean(meanings || transliteration);
  const lineHeight = typeScale.quran.arabic.lineHeight;
  const wordClass = (i: number) => wordClasses(playing && playingWord === i + 1);
  const key = `${surah}:${ayah}`;
  const hidden = (i: number) => memorize.hidden(firstWordId + i, i, i === words.length - 1, key);
  const veil = (i: number, word: ReactNode) => (
    <Veil
      hidden={hidden(i)}
      marker={i === words.length - 1}
      ayahKey={key}
      memorize={memorize}
      id={firstWordId + i}
    >
      {word}
    </Veil>
  );

  return (
    <article
      ref={ref}
      id={`ayah-${ayah}`}
      data-ayah={ayah}
      aria-label={tAyah('label', { surah: surahName, number: ayah })}
      className={ayahClass(playing)}
    >
      {/* A bookmarked ayah, or each ayah of a marked passage, carries its color along its edge. */}
      {bookmark && (
        <span
          aria-hidden
          className={cn('absolute inset-y-0 -start-2 w-1 rounded-full', markClass[bookmark.color])}
        />
      )}
      {stacked ? (
        <div
          ref={observe}
          lang="ar"
          dir="rtl"
          className="flex flex-wrap items-start gap-x-4 gap-y-6"
        >
          {words.map((w, i) => {
            const number = i === words.length - 1;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                {veil(
                  i,
                  <span
                    className={cn('font-quran text-ink', !number && wordClass(i))}
                    style={{ fontSize: size, lineHeight }}
                    onClick={number ? undefined : (e) => onWord(i, e.currentTarget)}
                  >
                    {drawn(i, w.text)}
                  </span>,
                )}
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
                  // Hidden with its word: the sound would give the word away.
                  <Text
                    as="span"
                    role="caption"
                    tone="lantern"
                    dir="ltr"
                    className={cn('text-center', hidden(i) && 'invisible')}
                  >
                    {transliteration[i] ?? ''}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p
          ref={observe}
          lang="ar"
          dir="rtl"
          className="font-quran text-ink"
          style={{ fontSize: size, lineHeight }}
        >
          {words.map((w, i) =>
            i === words.length - 1 ? (
              <span key={i}>{veil(i, drawn(i, w.text))}</span>
            ) : (
              <span key={i}>
                {veil(
                  i,
                  <span
                    className={wordClass(i)}
                    data-word={i}
                    onClick={(e) => onWord(i, e.currentTarget)}
                  >
                    {drawn(i, w.text)}
                  </span>,
                )}
                {w.after}
              </span>
            ),
          )}
        </p>
      )}
      {glyphOf && (
        <p lang="ar" className="sr-only">
          {words.map((w) => w.text + w.after).join('')}
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
                className={footnoteClass}
              >
                {seg[0]}
              </button>
            );
          })}
        </Text>
      )}

      <div className={ayahFooterClass}>
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
            aria-label={t(`bookmarks.colors.${bookmark.color}`)}
            className={cn('size-3 rounded-full', markClass[bookmark.color])}
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
