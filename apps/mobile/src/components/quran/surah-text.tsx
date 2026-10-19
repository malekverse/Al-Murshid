import { ayahWords, pageOf, wordId, type SurahText as Words } from '@murshid/content/quran';
import { bookmarkCovering, type QuranBookmark } from '@murshid/data';
import { colors, typeScale } from '@murshid/tokens';
import { memo } from 'react';
import { Text as RNText, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Text } from '@/components/ui/text';
import { markColor, useReaderTheme } from './common';
import { VeiledWord, type Memorize } from './memorize';
import { useTajweedGlyphs } from './tajweed';

/** A surah's ayahs gathered by the mushaf page each begins on: one paragraph each. */
export function pageGroups(surah: number, ayahCount: number) {
  const groups: { page: number; ayahs: number[] }[] = [];
  for (let ayah = 1; ayah <= ayahCount; ayah++) {
    const page = pageOf(surah, ayah);
    const last = groups.at(-1);
    if (last && last.page === page) last.ayahs.push(ayah);
    else groups.push({ page, ayahs: [ayah] });
  }
  return groups;
}

/**
 * One paragraph of the Arabic text view (Phase 5b): the ayahs beginning on a page of the mushaf,
 * flowing one after another, then the page's number. The words are the published text with its
 * own separators; tapping a word shows its meaning, tapping an ayah's number opens what the ayah
 * offers. Paragraphs keep the list virtualized, even for al-Baqarah.
 */
export const TextPage = memo(function TextPage({
  surah,
  text,
  page,
  ayahs,
  size,
  bookmarks,
  memorize,
  glyphs,
  playing,
  onWord,
  onActions,
}: {
  surah: number;
  text: Words;
  page: number;
  ayahs: number[];
  size: number;
  bookmarks: QuranBookmark[] | undefined;
  memorize: Memorize;
  /** The 1441H glyphs, to draw the words with tajweed colors; null for the published text. */
  glyphs: string[] | null;
  /** The ayah and word being recited here, if any. */
  playing: { ayah: number; word: number | null } | null;
  onWord: (ayah: number, index: number, at: { x: number; y: number }) => void;
  onActions: (ayah: number) => void;
}) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const theme = useReaderTheme();
  const palette = colors[theme];
  const lastAyah = ayahs.at(-1)!;
  // The paragraph's words lie on its page and, for an ayah running over, the next.
  const glyphOf = useTajweedGlyphs(
    glyphs,
    wordId(surah, ayahs[0]!, 1),
    wordId(surah, lastAyah, ayahWords(text, lastAyah).length),
  );

  return (
    <View className="gap-4 py-2">
      <RNText
        className="font-quran text-ink"
        style={{
          fontSize: size,
          lineHeight: size * typeScale.quran.arabic.lineHeight,
          writingDirection: 'rtl',
          textAlign: 'justify',
        }}
        // Glyphs mean nothing aloud: screen readers get the published text.
        accessibilityLabel={
          glyphOf
            ? ayahs.flatMap((ayah) => ayahWords(text, ayah).map((w) => w.text + w.after)).join('')
            : undefined
        }
      >
        {ayahs.map((ayah) => {
          const words = ayahWords(text, ayah);
          const first = wordId(surah, ayah, 1);
          const key = `${surah}:${ayah}`;
          const here = playing?.ayah === ayah;
          const mark = bookmarkCovering(bookmarks, surah, ayah);
          return (
            <RNText
              key={ayah}
              style={here ? { backgroundColor: `${palette.lantern}1A` } : undefined}
            >
              {words.map((w, i) => {
                const marker = i === words.length - 1;
                const g = glyphOf?.(first + i);
                return (
                  <RNText key={i}>
                    <VeiledWord
                      id={first + i}
                      index={i}
                      marker={marker}
                      ayahKey={key}
                      memorize={memorize}
                      style={
                        marker
                          ? mark
                            ? { backgroundColor: `${markColor(theme, mark.color)}40` }
                            : undefined
                          : here && playing?.word === i + 1
                            ? { backgroundColor: `${palette.lantern}40` }
                            : undefined
                      }
                      onPress={
                        marker
                          ? () => onActions(ayah)
                          : (e) =>
                              onWord(ayah, i, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })
                      }
                    >
                      {g ? <RNText style={{ fontFamily: g.fontFamily }}>{g.glyph}</RNText> : w.text}
                    </VeiledWord>
                    {marker ? ' ' : w.after}
                  </RNText>
                );
              })}
            </RNText>
          );
        })}
      </RNText>
      <Text role="caption" tone="muted" className="text-center">
        {t('mushaf.page', { page: format.number(page) })}
      </Text>
    </View>
  );
});
