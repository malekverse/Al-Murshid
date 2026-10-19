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
import { colors, fonts, mushafPage, radius, space } from '@murshid/tokens';
import { useRef, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useLoad } from '@/lib/quran';
import { pageFontFamily, usePageFont, type GlyphEdition } from '@/lib/quran-files';
import {
  markColor,
  SurahCalligraphy,
  useIndopakFont,
  useReaderTheme,
  useSurahName,
} from './common';
import { VeiledWord, type Memorize } from './memorize';

type Playing = { surah: number; ayah: number; word: number | null } | null;

/**
 * The basmalah: Al-Fatihah 1's own four words (without the number) as this mushaf prints them, in
 * page 1's font where pages have fonts.
 */
function MushafBasmalah({
  mushaf,
  edition,
  fontSize,
  color,
}: {
  mushaf: Mushaf;
  edition: GlyphEdition | null;
  fontSize: number;
  color: string;
}) {
  const font = usePageFont(1, edition, false);
  if (font.state !== 'ready') return null;
  return (
    // The whole line's width, centred, like page 1's own lines: measured to its own width,
    // Android clipped the last word.
    <RNText
      numberOfLines={1}
      adjustsFontSizeToFit
      style={{
        width: '100%',
        textAlign: 'center',
        fontFamily: edition ? pageFontFamily(1, edition) : fonts.native.indopak,
        fontSize: fontSize * mushafPage.basmalah,
        color,
        writingDirection: 'rtl',
      }}
    >
      {(isGlyphMushaf(mushaf) ? mushaf.glyphs : mushaf.words).slice(0, 4).join(' ')}
    </RNText>
  );
}

/**
 * The page's ayahs as published text, for screen readers (the page glyphs mean nothing aloud).
 * While memorizing hides the words, only each ayah's name is spoken.
 */
function SpokenAyahs({
  ayahs,
  hideText,
}: {
  ayahs: { surah: number; ayah: number }[];
  hideText: boolean;
}) {
  const t = useTranslations('components.ayah');
  const tMemorize = useTranslations('quran.memorize');
  const name = useSurahName();
  const surahs = [...new Set(ayahs.map((a) => a.surah))];
  return surahs.map((s) => {
    const label = (n: number) => t('label', { surah: name(surahInfo(s)), number: n });
    const list = ayahs.filter((a) => a.surah === s).map((a) => a.ayah);
    if (hideText) {
      return list.map((a) => (
        <RNText
          key={`${s}:${a}`}
          accessibilityLabel={tMemorize('hiddenAyah', { label: label(a) })}
          style={{ position: 'absolute', opacity: 0 }}
        >
          {' '}
        </RNText>
      ));
    }
    return <SpokenSurah key={s} surah={s} ayahs={list} label={label} />;
  });
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
    <RNText
      key={a}
      accessibilityLabel={`${label(a)}: ${ayahWords(text.data!, a)
        .map((w) => w.text + w.after)
        .join('')}`}
      style={{ position: 'absolute', opacity: 0 }}
    >
      {' '}
    </RNText>
  ));
}

/**
 * One page of the 1421H Madani mushaf (SPEC 5.5): its 15 lines as printed, each in the page's own
 * QCF V2 font, sized so the lines fill the width as they do on paper.
 */
export function MushafPage({
  page,
  mushaf,
  edition,
  playing,
  memorize,
  bookmarks,
  onWord,
}: {
  page: number;
  mushaf: Mushaf;
  edition: MushafEdition;
  playing: Playing;
  memorize: Memorize;
  bookmarks: QuranBookmark[] | undefined;
  onWord: (surah: number, ayah: number) => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const readerTheme = useReaderTheme();
  // The 1441H fonts carry their own colors for light pages, which a phone cannot change: in the
  // dark they sit on a light page, like paper (docs/DECISIONS.md).
  const paper = edition === 'v4' && readerTheme === 'dark';
  const theme = paper ? 'light' : readerTheme;
  const palette = colors[theme];
  const glyphEdition = edition === 'indopak' ? null : edition;
  const font = usePageFont(page, glyphEdition);
  const indopakReady = useIndopakFont(edition === 'indopak');
  const text = isGlyphMushaf(mushaf) ? mushaf.glyphs : mushaf.words;
  const sizing = edition === 'indopak' ? mushafPage.indopak : mushafPage;
  const [width, setWidth] = useState(0);
  const pageWidth = Math.min(width, mushafPage.maxWidth);

  // The Indopak lines are set in one font: a page whose widest line would overflow is set a little
  // smaller. Each text line is first measured unseen at the token's size.
  const fitKey = `${page}:${pageWidth}`;
  const [fit, setFit] = useState({ key: '', scale: 1 });
  const measured = useRef(new Map<number, number>());
  const measuring = edition === 'indopak' && fit.key !== fitKey;
  const scale = edition === 'indopak' && fit.key === fitKey ? fit.scale : 1;

  const lines = mushaf.pages[page - 1]!;
  const fontSize = pageWidth * sizing.fontPerWidth * scale;
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
      if (!last || last.surah !== at.surah || last.ayah !== at.ayah)
        ayahsOnPage.push({ surah: at.surah, ayah: at.ayah });
    }
  }
  const highlight = (id: number) => {
    const at = located.get(id)!;
    if (!playing || playing.surah !== at.surah || playing.ayah !== at.ayah) return undefined;
    return { backgroundColor: `${palette.lantern}${playing.word === at.word ? '40' : '1A'}` };
  };
  /** A word on the page, which memorizing may hide. */
  const glyph = (id: number, style?: { fontSize: number }, after = '') => {
    const at = located.get(id)!;
    return (
      <VeiledWord
        key={id}
        id={id}
        theme={theme}
        index={at.word - 1}
        marker={at.word === ayahLength(at.surah, at.ayah)}
        ayahKey={`${at.surah}:${at.ayah}`}
        memorize={memorize}
        style={[style, highlight(id)]}
        // A word on a justified line stands alone: hidden, it is drawn as a bar.
        barSize={style?.fontSize}
        onPress={() => onWord(at.surah, at.ayah)}
      >
        {text[id - 1]}
        {after}
      </VeiledWord>
    );
  };
  /** A bookmark on any ayah of a line shows beside it, like a ribbon in the margin. */
  const ribbon = (first: number, last: number) => {
    for (let id = first; id <= last; id++) {
      const at = located.get(id)!;
      const mark = bookmarkCovering(bookmarks, at.surah, at.ayah);
      if (mark) {
        return (
          <View
            className="absolute inset-y-2 w-1 rounded-full"
            style={{ end: '100%', marginEnd: 8, backgroundColor: markColor(theme, mark.color) }}
          />
        );
      }
    }
    return null;
  };

  const textLines = lines.flatMap((line, i) => (line[0] === 0 && !line[3] ? [i] : []));
  const measure = (i: number, w: number) => {
    measured.current.set(i, w);
    if (measured.current.size < textLines.length) return;
    const widest = Math.max(...measured.current.values()) / pageWidth;
    measured.current.clear();
    setFit({ key: fitKey, scale: widest > 0.97 ? 0.97 / widest : 1 });
  };

  return (
    <View
      className="w-full items-center gap-3"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View
        style={[
          { width: pageWidth },
          paper && {
            backgroundColor: colors.light.canvas,
            borderRadius: radius.control,
            padding: space[2],
          },
        ]}
        accessible={false}
      >
        {font.state === 'error' ? (
          <View className="gap-4 py-12">
            <Text role="body">{t('mushaf.fontError')}</Text>
            <Button variant="secondary" onPress={font.retry} className="self-start">
              {t('reader.retry')}
            </Button>
          </View>
        ) : font.state === 'loading' || width === 0 || (edition === 'indopak' && !indopakReady) ? (
          <View className="gap-3 py-2" accessibilityLabel={t('mushaf.loading', { page })}>
            {lines.map((_, i) => (
              <View key={i} style={{ height: Math.max(lineHeight, 24) - 12 }}>
                <Skeleton className="size-full" />
              </View>
            ))}
          </View>
        ) : (
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={measuring ? { opacity: 0 } : undefined}
          >
            {measuring &&
              textLines.map((i) => {
                const line = lines[i] as [0, number, number, 0 | 1];
                const ids = Array.from({ length: line[2] - line[1] + 1 }, (_, k) => line[1] + k);
                return (
                  <View
                    key={`m${fitKey}:${i}`}
                    className="absolute flex-row"
                    style={{ alignSelf: 'flex-start' }}
                    onLayout={(e) => measure(i, e.nativeEvent.layout.width)}
                  >
                    {ids.map((id) => (
                      <RNText
                        key={id}
                        style={{ fontFamily: fonts.native.indopak, fontSize, flexShrink: 0 }}
                      >
                        {text[id - 1]}
                      </RNText>
                    ))}
                  </View>
                );
              })}
            {lines.map((line, i) => {
              if (line[0] === 1) {
                return (
                  <View
                    key={i}
                    className="items-center justify-center rounded-control border border-hairline"
                    style={{ height: lineHeight }}
                  >
                    <SurahCalligraphy number={line[1]} color={palette.ink} />
                  </View>
                );
              }
              if (line[0] === 2) {
                return (
                  <View
                    key={i}
                    className="items-center justify-center"
                    style={{ height: lineHeight }}
                  >
                    <MushafBasmalah
                      mushaf={mushaf}
                      edition={glyphEdition}
                      fontSize={fontSize}
                      color={palette.ink}
                    />
                  </View>
                );
              }
              const style = {
                fontFamily: glyphEdition
                  ? pageFontFamily(page, glyphEdition)
                  : fonts.native.indopak,
                fontSize,
                color: palette.ink,
                writingDirection: 'rtl' as const,
              };
              const ids = Array.from({ length: line[2] - line[1] + 1 }, (_, k) => line[1] + k);
              if (line[3]) {
                // A short centred line keeps the font's own word spacing, as printed.
                return (
                  <View
                    key={i}
                    style={{ height: lineHeight, direction: 'rtl' }}
                    className="justify-center"
                  >
                    {ribbon(line[1], line[2])}
                    <RNText style={[style, { textAlign: 'center' }]}>
                      {ids.map((id, k) => glyph(id, undefined, k < ids.length - 1 ? ' ' : ''))}
                    </RNText>
                  </View>
                );
              }
              return (
                // Lines run right to left in every app language, like the printed page.
                <View
                  key={i}
                  className="flex-row items-center justify-between"
                  style={{ height: lineHeight, direction: 'rtl' }}
                >
                  {ribbon(line[1], line[2])}
                  {ids.map((id) => glyph(id, style))}
                </View>
              );
            })}
          </View>
        )}
        <SpokenAyahs
          ayahs={ayahsOnPage}
          hideText={memorize.mode === 'words' || memorize.mode === 'firstWord'}
        />
      </View>
      <View className="flex-row items-center gap-3">
        <Text role="caption" tone="muted">
          {t('mushaf.page', { page: format.number(page) })}
        </Text>
        <Text role="caption" tone="muted">
          {t('mushaf.juz', { number: format.number(juz) })}
        </Text>
      </View>
    </View>
  );
}
