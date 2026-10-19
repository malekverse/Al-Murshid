'use client';

import { ayahWords, pageOf, wordId, type SurahText as Words } from '@murshid/content/quran';
import { bookmarkCovering, type QuranBookmark } from '@murshid/data';
import { typeScale } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode, RefObject } from 'react';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { Veil, type Memorize } from './memorize';
import { markTint } from './quran-home';
import { useNearViewport, useTajweedWords, type Tajweed } from './tajweed';

/**
 * The Arabic text view (Phase 5b): the surah as one flowing text, verse after verse, without
 * translation. Paragraphs break where a page of the mushaf begins, with the page's number
 * between them, so a reader who knows the mushaf keeps their bearings. The words are the published
 * text with its own separators; tapping a word shows its meaning, tapping an ayah's number opens
 * what the ayah offers.
 */
export function SurahText(props: Omit<TextPageProps, 'page' | 'ayahs'>) {
  const { surah, text } = props;
  // The surah's ayahs, gathered by the mushaf page each begins on.
  const pages: { page: number; ayahs: number[] }[] = [];
  text.w.forEach((_, i) => {
    const page = pageOf(surah, i + 1);
    const last = pages.at(-1);
    if (last && last.page === page) last.ayahs.push(i + 1);
    else pages.push({ page, ayahs: [i + 1] });
  });

  return (
    <div className="flex flex-col gap-4 py-2">
      {pages.map(({ page, ayahs }) => (
        <TextPage key={page} page={page} ayahs={ayahs} {...props} />
      ))}
    </div>
  );
}

interface TextPageProps {
  surah: number;
  text: Words;
  /** The mushaf page these ayahs begin on, and the ayahs. */
  page: number;
  ayahs: number[];
  size: number;
  bookmarks: QuranBookmark[] | undefined;
  memorize: Memorize;
  /** Draws the words in their 1441H tajweed glyphs, when on. */
  tajweed: Tajweed | null;
  /** The ayah and word being recited here, if any. */
  playing: { ayah: number; word: number | null } | null;
  ayahRefs: RefObject<Map<number, HTMLElement>>;
  onWord: (ayah: number, index: number, target: HTMLElement) => void;
  onActions: (ayah: number) => void;
}

/** One page's worth of ayahs, as one paragraph. */
function TextPage({
  surah,
  text,
  page,
  ayahs,
  size,
  bookmarks,
  memorize,
  tajweed,
  playing,
  ayahRefs,
  onWord,
  onActions,
}: TextPageProps) {
  const t = useTranslations('quran');
  const tAyah = useTranslations('quran.actions');
  const format = useFormatter();
  const [observe, near] = useNearViewport();
  const lastAyah = ayahs.at(-1)!;
  // The paragraph's words lie on its page and, for an ayah running over, the next.
  const glyphOf = useTajweedWords(
    tajweed,
    wordId(surah, ayahs[0]!, 1),
    wordId(surah, lastAyah, ayahWords(text, lastAyah).length),
    near,
  );
  /** A word as drawn: its tajweed glyph when on and ready, otherwise as published. */
  const drawn = (id: number, published: string) => {
    const g = glyphOf?.(id);
    return g ? (
      <span aria-hidden style={g.style}>
        {g.glyph}
      </span>
    ) : (
      published
    );
  };

  return (
    <section ref={observe} className="flex flex-col gap-4">
      <p
        lang="ar"
        dir="rtl"
        className="text-justify font-quran text-ink"
        style={{ fontSize: size, lineHeight: typeScale.quran.arabic.lineHeight }}
      >
        {ayahs.map((ayah) => {
          const words = ayahWords(text, ayah);
          const first = wordId(surah, ayah, 1);
          const key = `${surah}:${ayah}`;
          const here = playing?.ayah === ayah;
          const mark = bookmarkCovering(bookmarks, surah, ayah);
          return (
            <span
              key={ayah}
              ref={(el) => {
                if (el) ayahRefs.current.set(ayah, el);
                else ayahRefs.current.delete(ayah);
              }}
              data-ayah={ayah}
              className={cn('scroll-mt-24', here && 'rounded-control bg-lantern/10')}
            >
              {words.map((w, i) => {
                const marker = i === words.length - 1;
                const hidden = memorize.hidden(first + i, i, marker, key);
                const veiled = (node: ReactNode) => (
                  <Veil
                    hidden={hidden}
                    marker={marker}
                    ayahKey={key}
                    memorize={memorize}
                    id={first + i}
                  >
                    {node}
                  </Veil>
                );
                if (marker) {
                  return (
                    <span key={i}>
                      {veiled(
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={tAyah('label', { surah, ayah })}
                          onClick={() => onActions(ayah)}
                          onKeyDown={(e) => e.key === 'Enter' && onActions(ayah)}
                          className={cn(
                            'cursor-pointer rounded-full',
                            mark ? markTint[mark.color] : 'hover:bg-ink/5',
                          )}
                        >
                          {drawn(first + i, w.text)}
                        </span>,
                      )}{' '}
                    </span>
                  );
                }
                return (
                  <span key={i}>
                    {veiled(
                      <span
                        className={cn(
                          'cursor-pointer rounded-control',
                          here && playing?.word === i + 1 ? 'bg-lantern/25' : 'hover:bg-ink/5',
                        )}
                        onClick={(e) => onWord(ayah, i, e.currentTarget)}
                      >
                        {drawn(first + i, w.text)}
                      </span>,
                    )}
                    {w.after}
                  </span>
                );
              })}
            </span>
          );
        })}
      </p>
      {glyphOf && (
        // Glyphs mean nothing aloud: screen readers get the published text.
        <p lang="ar" className="sr-only">
          {ayahs.flatMap((ayah) => ayahWords(text, ayah).map((w) => w.text + w.after)).join('')}
        </p>
      )}
      <Text as="p" role="caption" tone="muted" className="text-center">
        {t('mushaf.page', { page: format.number(page) })}
      </Text>
    </section>
  );
}
