'use client';

import {
  ayahWords,
  divisionOf,
  firstAyahOfPage,
  loadSurahText,
  surah as surahInfo,
  wordAt,
  type MushafV2,
} from '@murshid/content/quran';
import { mushafPage } from '@murshid/tokens';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useLoad } from '@/lib/quran';
import { SurahCalligraphy, useSurahName } from './common';
import { pageFontFamily, usePageFont } from './use-page-font';

/**
 * The basmalah opening a surah on the page: Al-Fatihah 1's own glyphs on page 1 (its four words,
 * without the number), in page 1's font, so it matches the mushaf's calligraphy.
 */
function MushafBasmalah({ mushaf, fontSize }: { mushaf: MushafV2; fontSize: number }) {
  const font = usePageFont(1, false);
  if (font.state !== 'ready') return null;
  return (
    // One line: a wrapped basmalah would lose its last word below the line.
    <span
      dir="rtl"
      className="whitespace-nowrap"
      style={{ fontFamily: pageFontFamily(1), fontSize: fontSize * mushafPage.basmalah }}
    >
      {mushaf.glyphs.slice(0, 4).join(' ')}
    </span>
  );
}

/** The page's ayahs as published Unicode text, for screen readers (the glyphs mean nothing aloud). */
function SpokenPage({ ayahs }: { ayahs: { surah: number; ayah: number }[] }) {
  const tAyah = useTranslations('components.ayah');
  const name = useSurahName();
  const surahs = [...new Set(ayahs.map((a) => a.surah))];
  return (
    <div className="sr-only">
      {surahs.map((s) => (
        <SpokenSurah
          key={s}
          surah={s}
          ayahs={ayahs.filter((a) => a.surah === s).map((a) => a.ayah)}
          label={(n) => tAyah('label', { surah: name(surahInfo(s)), number: n })}
        />
      ))}
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
 * One page of the 1421H Madani mushaf (SPEC 5.5): its 15 lines as printed, each in the page's
 * own QCF V2 font, sized so lines fill the width as they do on paper.
 */
export function MushafPage({
  page,
  mushaf,
  playing,
  onWord,
}: {
  page: number;
  mushaf: MushafV2;
  /** The ayah and word being recited, if any. */
  playing: { surah: number; ayah: number; word: number | null } | null;
  onWord: (surah: number, ayah: number) => void;
}) {
  const t = useTranslations('quran.mushaf');
  const tReader = useTranslations('quran.reader');
  const format = useFormatter();
  const font = usePageFont(page);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lines = mushaf.pages[page - 1]!;
  const fontSize = width * mushafPage.fontPerWidth;
  const lineHeight = fontSize * mushafPage.lineHeight;
  const first = firstAyahOfPage(page);
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
          <div aria-hidden>
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
                    <MushafBasmalah mushaf={mushaf} fontSize={fontSize} />
                  </div>
                );
              }
              const words = [];
              const centered = line[3] === 1;
              for (let id = line[1]; id <= line[2]; id++) {
                const at = located.get(id)!;
                const ayahPlaying =
                  playing && playing.surah === at.surah && playing.ayah === at.ayah;
                words.push(
                  <span
                    key={id}
                    onClick={() => onWord(at.surah, at.ayah)}
                    className={cn(
                      'cursor-pointer rounded-control',
                      ayahPlaying && (playing.word === at.word ? 'bg-lantern/25' : 'bg-lantern/10'),
                    )}
                  >
                    {mushaf.glyphs[id - 1]}
                  </span>,
                );
                // A short centred line keeps the font's own word spacing, as printed.
                if (centered && id < line[2]) words.push(' ');
              }
              return (
                <div
                  key={i}
                  dir="rtl"
                  className={centered ? 'text-center' : 'flex items-center justify-between'}
                  style={{
                    height: lineHeight,
                    fontFamily: pageFontFamily(page),
                    fontSize,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {words}
                </div>
              );
            })}
          </div>
        )}
        <SpokenPage ayahs={ayahsOnPage} />
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
