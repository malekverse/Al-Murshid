'use client';

import {
  ayahLength,
  ayahWords,
  divisionOf,
  firstAyahOfPage,
  isGlyphMushaf,
  loadSurahText,
  surah as surahInfo,
  wordAt,
  type Mushaf,
  type MushafEdition,
} from '@murshid/content/quran';
import { bookmarkCovering, type QuranBookmark } from '@murshid/data';
import { fonts, mushafPage, type ThemeName } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useLoad } from '@/lib/quran';
import { SurahCalligraphy, useSurahName } from './common';
import { Veil, type Memorize } from './memorize';
import { markClass } from './quran-home';
import { pageFontFamily, tajweedPalette, usePageFont, type GlyphEdition } from './use-page-font';

/**
 * The basmalah opening a surah on the page: Al-Fatihah 1's own four words (without the number) as
 * this mushaf prints them, in page 1's font where pages have fonts, so it matches the calligraphy.
 */
function MushafBasmalah({
  mushaf,
  edition,
  fontSize,
  palette,
}: {
  mushaf: Mushaf;
  edition: GlyphEdition | null;
  fontSize: number;
  palette?: string;
}) {
  const font = usePageFont(1, edition, false);
  if (font.state !== 'ready') return null;
  const glyphs = isGlyphMushaf(mushaf);
  return (
    // One line: a wrapped basmalah would lose its last word below the line.
    <span
      dir="rtl"
      className="whitespace-nowrap"
      style={{
        fontFamily: edition ? pageFontFamily(1, edition) : fonts.web.indopak,
        fontSize: fontSize * mushafPage.basmalah,
        fontPalette: palette,
      }}
    >
      {(glyphs ? mushaf.glyphs : mushaf.words).slice(0, 4).join(' ')}
    </span>
  );
}

/**
 * The page's ayahs as published Unicode text, for screen readers (the glyphs mean nothing aloud).
 * While memorizing hides the words, only each ayah's name is spoken.
 */
function SpokenPage({
  ayahs,
  hideText,
}: {
  ayahs: { surah: number; ayah: number }[];
  hideText: boolean;
}) {
  const tAyah = useTranslations('components.ayah');
  const tMemorize = useTranslations('quran.memorize');
  const name = useSurahName();
  const surahs = [...new Set(ayahs.map((a) => a.surah))];
  return (
    <div className="sr-only">
      {surahs.map((s) => {
        const label = (n: number) => tAyah('label', { surah: name(surahInfo(s)), number: n });
        const list = ayahs.filter((a) => a.surah === s).map((a) => a.ayah);
        return hideText ? (
          list.map((a) => <p key={`${s}:${a}`}>{tMemorize('hiddenAyah', { label: label(a) })}</p>)
        ) : (
          <SpokenSurah key={s} surah={s} ayahs={list} label={label} />
        );
      })}
    </div>
  );
}

function SpokenSurah({
  surah,
  ayahs,
  label,
}: {
  surah: number;
  ayahs: number[];
  label: (n: number) => string;
}) {
  const text = useLoad(() => loadSurahText(surah), `text/${surah}`);
  if (!text.data) return null;
  return ayahs.map((a) => (
    <p key={a} lang="ar" aria-label={label(a)}>
      {ayahWords(text.data!, a)
        .map((w) => w.text + w.after)
        .join('')}
    </p>
  ));
}

/**
 * One page of a printed mushaf (SPEC 5.5, Phase 5b): its lines as printed, sized so they fill the
 * width as they do on paper. The Madani editions draw each page in its own font (the 1441H one in
 * color for tajweed, or plain); the Indopak mushaf sets its words in one Nastaleeq font, each line
 * justified.
 */
export function MushafPage({
  page,
  mushaf,
  edition,
  tajweed,
  theme,
  playing,
  memorize,
  bookmarks,
  onWord,
}: {
  page: number;
  mushaf: Mushaf;
  edition: MushafEdition;
  /** Tajweed colors, on the 1441H pages. */
  tajweed: boolean;
  /** The reader's colors, which the 1441H pages' ink follows. */
  theme: ThemeName;
  /** The ayah and word being recited, if any. */
  playing: { surah: number; ayah: number; word: number | null } | null;
  memorize: Memorize;
  bookmarks: QuranBookmark[] | undefined;
  onWord: (surah: number, ayah: number) => void;
}) {
  const t = useTranslations('quran.mushaf');
  const tReader = useTranslations('quran.reader');
  const format = useFormatter();
  const glyphEdition = edition === 'indopak' ? null : edition;
  const font = usePageFont(page, glyphEdition);
  const sizing = edition === 'indopak' ? mushafPage.indopak : mushafPage;
  const palette = edition === 'v4' ? tajweedPalette(page, theme, tajweed) : undefined;
  const text = isGlyphMushaf(mushaf) ? mushaf.glyphs : mushaf.words;
  const box = useRef<HTMLDivElement>(null);
  const linesBox = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // The Indopak lines are set in one font: a page whose widest line would overflow is set a little
  // smaller, measured once its font is in (never larger than the token's size).
  const [fit, setFit] = useState({ key: '', scale: 1 });
  const fitKey = `${edition}:${page}:${width}`;
  const scale = fit.key === fitKey ? fit.scale : 1;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (edition !== 'indopak' || width === 0 || fit.key === fitKey) return;
    let live = true;
    void document.fonts.ready.then(() => {
      const el = linesBox.current;
      if (!live || !el) return;
      let widest = 0;
      for (const line of el.children) {
        if (!(line instanceof HTMLElement) || !line.classList.contains('justify-between')) continue;
        const used = [...line.children]
          .filter((c) => !c.classList.contains('absolute'))
          .reduce((sum, c) => sum + c.getBoundingClientRect().width, 0);
        widest = Math.max(widest, used / line.getBoundingClientRect().width);
      }
      setFit({ key: fitKey, scale: widest > 0.97 ? 0.97 / widest : 1 });
    });
    return () => {
      live = false;
    };
  });

  const lines = mushaf.pages[page - 1]!;
  const fontSize = width * sizing.fontPerWidth * scale;
  const lineHeight = fontSize * sizing.lineHeight;
  const first = firstAyahOfPage(page, edition);
  const juz = divisionOf('juz', first.surah, first.ayah);

  const ayahsOnPage: { surah: number; ayah: number }[] = [];
  const located = new Map<number, { surah: number; ayah: number; word: number }>();
  for (const line of lines) {
    if (line[0] !== 0) continue;
    for (let id = line[1]; id <= line[2]; id++) {
      const at = wordAt(id);
      located.set(id, at);
      const last = ayahsOnPage.at(-1);
      if (!last || last.surah !== at.surah || last.ayah !== at.ayah) {
        ayahsOnPage.push({ surah: at.surah, ayah: at.ayah });
      }
    }
  }

  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <div ref={box} className="w-full" style={{ maxWidth: mushafPage.maxWidth }}>
        {font.state === 'error' ? (
          <div className="flex flex-col items-start gap-4 py-12">
            <Text role="body">{t('fontError')}</Text>
            <Button variant="secondary" onClick={font.retry}>
              {tReader('retry')}
            </Button>
          </div>
        ) : font.state === 'loading' || width === 0 ? (
          <div className="flex flex-col gap-3 py-2" aria-label={t('loading', { page })} aria-busy>
            {lines.map((_, i) => (
              <div key={i} style={{ height: Math.max(lineHeight, 24) - 12 }}>
                <Skeleton className="size-full" />
              </div>
            ))}
          </div>
        ) : (
          <div aria-hidden ref={linesBox}>
            {lines.map((line, i) => {
              if (line[0] === 1) {
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center rounded-control border border-hairline"
                    style={{ height: lineHeight }}
                  >
                    <SurahCalligraphy number={line[1]} />
                  </div>
                );
              }
              if (line[0] === 2) {
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center"
                    style={{ height: lineHeight }}
                  >
                    <MushafBasmalah
                      mushaf={mushaf}
                      edition={glyphEdition}
                      fontSize={fontSize}
                      palette={edition === 'v4' ? tajweedPalette(1, theme, tajweed) : undefined}
                    />
                  </div>
                );
              }
              const words = [];
              const centered = line[3] === 1;
              // A bookmark on any ayah of the line shows beside it, like a ribbon in the margin.
              let mark: QuranBookmark | null = null;
              for (let id = line[1]; id <= line[2] && !mark; id++) {
                const at = located.get(id)!;
                mark = bookmarkCovering(bookmarks, at.surah, at.ayah);
              }
              for (let id = line[1]; id <= line[2]; id++) {
                const at = located.get(id)!;
                const ayahPlaying =
                  playing && playing.surah === at.surah && playing.ayah === at.ayah;
                const marker = at.word === ayahLength(at.surah, at.ayah);
                const key = `${at.surah}:${at.ayah}`;
                words.push(
                  <Veil
                    key={id}
                    hidden={memorize.hidden(id, at.word - 1, marker, key)}
                    marker={marker}
                    ayahKey={key}
                    memorize={memorize}
                    id={id}
                  >
                    <span
                      onClick={() => onWord(at.surah, at.ayah)}
                      className={cn(
                        'cursor-pointer rounded-control',
                        ayahPlaying &&
                          (playing.word === at.word ? 'bg-lantern/25' : 'bg-lantern/10'),
                      )}
                    >
                      {text[id - 1]}
                    </span>
                  </Veil>,
                );
                // A short centred line keeps the font's own word spacing, as printed.
                if (centered && id < line[2]) words.push(' ');
              }
              return (
                <div
                  key={i}
                  dir="rtl"
                  className={cn(
                    'relative',
                    centered ? 'text-center' : 'flex items-center justify-between',
                  )}
                  style={{
                    height: lineHeight,
                    fontFamily: glyphEdition
                      ? pageFontFamily(page, glyphEdition)
                      : fonts.web.indopak,
                    fontPalette: palette,
                    fontSize,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {mark && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute inset-y-2 -start-3 w-1 rounded-full',
                        markClass[mark.color],
                      )}
                    />
                  )}
                  {words}
                </div>
              );
            })}
          </div>
        )}
        <SpokenPage
          ayahs={ayahsOnPage}
          hideText={memorize.mode === 'words' || memorize.mode === 'firstWord'}
        />
      </div>
      <figcaption className="flex items-center gap-3">
        <Text as="span" role="caption" tone="muted">
          {t('page', { page: format.number(page) })}
        </Text>
        <Text as="span" role="caption" tone="muted" aria-hidden>
          ·
        </Text>
        <Text as="span" role="caption" tone="muted">
          {t('juz', { number: format.number(juz) })}
        </Text>
      </figcaption>
    </figure>
  );
}
