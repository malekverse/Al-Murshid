import {
  ayahWords,
  divisionOf,
  firstAyahOfPage,
  loadSurahText,
  surah as surahInfo,
  wordAt,
  type MushafV2,
} from '@murshid/content/quran';
import { colors, mushafPage } from '@murshid/tokens';
import { useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useLoad } from '@/lib/quran';
import { pageFontFamily, usePageFont } from '@/lib/quran-files';
import { SurahCalligraphy, useReaderTheme, useSurahName } from './common';

type Playing = { surah: number; ayah: number; word: number | null } | null;

/** The basmalah: Al-Fatihah 1's own glyphs on page 1, without the number, in page 1's font. */
function MushafBasmalah({
  mushaf,
  fontSize,
  color,
}: {
  mushaf: MushafV2;
  fontSize: number;
  color: string;
}) {
  const font = usePageFont(1, false);
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
        fontFamily: pageFontFamily(1),
        fontSize: fontSize * mushafPage.basmalah,
        color,
        writingDirection: 'rtl',
      }}
    >
      {mushaf.glyphs.slice(0, 4).join(' ')}
    </RNText>
  );
}

/** The page's ayahs as published text, for screen readers (the page glyphs mean nothing aloud). */
function SpokenAyahs({ ayahs }: { ayahs: { surah: number; ayah: number }[] }) {
  const t = useTranslations('components.ayah');
  const name = useSurahName();
  const surahs = [...new Set(ayahs.map((a) => a.surah))];
  return surahs.map((s) => (
    <SpokenSurah
      key={s}
      surah={s}
      ayahs={ayahs.filter((a) => a.surah === s).map((a) => a.ayah)}
      label={(n) => t('label', { surah: name(surahInfo(s)), number: n })}
    />
  ));
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
  playing,
  onWord,
}: {
  page: number;
  mushaf: MushafV2;
  playing: Playing;
  onWord: (surah: number, ayah: number) => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const theme = useReaderTheme();
  const palette = colors[theme];
  const font = usePageFont(page);
  const [width, setWidth] = useState(0);

  const lines = mushaf.pages[page - 1]!;
  const fontSize = Math.min(width, mushafPage.maxWidth) * mushafPage.fontPerWidth;
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
      if (!last || last.surah !== at.surah || last.ayah !== at.ayah)
        ayahsOnPage.push({ surah: at.surah, ayah: at.ayah });
    }
  }
  const highlight = (id: number) => {
    const at = located.get(id)!;
    if (!playing || playing.surah !== at.surah || playing.ayah !== at.ayah) return undefined;
    return { backgroundColor: `${palette.lantern}${playing.word === at.word ? '40' : '1A'}` };
  };

  return (
    <View
      className="w-full items-center gap-3"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ width: Math.min(width, mushafPage.maxWidth) }} accessible={false}>
        {font.state === 'error' ? (
          <View className="gap-4 py-12">
            <Text role="body">{t('mushaf.fontError')}</Text>
            <Button variant="secondary" onPress={font.retry} className="self-start">
              {t('reader.retry')}
            </Button>
          </View>
        ) : font.state === 'loading' || width === 0 ? (
          <View className="gap-3 py-2" accessibilityLabel={t('mushaf.loading', { page })}>
            {lines.map((_, i) => (
              <View key={i} style={{ height: Math.max(lineHeight, 24) - 12 }}>
                <Skeleton className="size-full" />
              </View>
            ))}
          </View>
        ) : (
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
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
                    <MushafBasmalah mushaf={mushaf} fontSize={fontSize} color={palette.ink} />
                  </View>
                );
              }
              const style = {
                fontFamily: pageFontFamily(page),
                fontSize,
                color: palette.ink,
                writingDirection: 'rtl' as const,
              };
              const ids = Array.from({ length: line[2] - line[1] + 1 }, (_, k) => line[1] + k);
              if (line[3]) {
                // A short centred line keeps the font's own word spacing, as printed.
                return (
                  <View key={i} style={{ height: lineHeight }} className="justify-center">
                    <RNText style={[style, { textAlign: 'center' }]}>
                      {ids.map((id, k) => (
                        <RNText
                          key={id}
                          style={highlight(id)}
                          onPress={() => onWord(located.get(id)!.surah, located.get(id)!.ayah)}
                        >
                          {mushaf.glyphs[id - 1]}
                          {k < ids.length - 1 ? ' ' : ''}
                        </RNText>
                      ))}
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
                  {ids.map((id) => (
                    <RNText
                      key={id}
                      style={[style, highlight(id)]}
                      onPress={() => onWord(located.get(id)!.surah, located.get(id)!.ayah)}
                    >
                      {mushaf.glyphs[id - 1]}
                    </RNText>
                  ))}
                </View>
              );
            })}
          </View>
        )}
        <SpokenAyahs ayahs={ayahsOnPage} />
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
