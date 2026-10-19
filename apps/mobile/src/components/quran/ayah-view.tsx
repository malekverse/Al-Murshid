import type { TranslationSegment, Word } from '@murshid/content/quran';
import type { BookmarkColor } from '@murshid/data';
import { colors, typeScale } from '@murshid/tokens';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';
import { memo } from 'react';
import { Text as RNText, View, type GestureResponderEvent } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { markColor, useReaderTheme } from './common';

export interface AyahViewProps {
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
  playing: boolean;
  playingWord: number | null;
  bookmark: BookmarkColor | null;
  sajda: boolean;
  onWord: (index: number, at: { x: number; y: number }) => void;
  onFootnote: (mark: string, text: string) => void;
  onActions: () => void;
}

const quranText = (size: number) => ({
  fontSize: size,
  lineHeight: size * typeScale.quran.arabic.lineHeight,
  writingDirection: 'rtl' as const,
  direction: 'rtl' as const,
});

/**
 * One ayah in the verse view (SPEC 5.5): the published words with their own separators, so
 * joined they are the ayah byte for byte. Tapping a word shows its meaning; the word being
 * recited is marked, never animated.
 */
export const AyahView = memo(function AyahView({
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
}: AyahViewProps) {
  const t = useTranslations();
  const format = useFormatter();
  const theme = useReaderTheme();
  const palette = colors[theme];
  const stacked = Boolean(meanings || transliteration);
  const wordStyle = (i: number) =>
    playing && playingWord === i + 1 ? { backgroundColor: `${palette.lantern}40` } : undefined;
  const tap = (i: number) => (e: GestureResponderEvent) =>
    onWord(i, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });

  return (
    <View
      accessibilityLabel={t('components.ayah.label', { surah: surahName, number: ayah })}
      className="gap-4 border-b border-hairline px-2 py-6"
      style={playing ? { backgroundColor: `${palette.lantern}14` } : undefined}
    >
      {stacked ? (
        <View
          className="flex-row flex-wrap items-start gap-x-4 gap-y-6"
          style={{ direction: 'rtl' }}
        >
          {words.map((w, i) => {
            const number = i === words.length - 1;
            return (
              <View key={i} className="items-center gap-1">
                <RNText
                  className="font-quran text-ink"
                  style={[quranText(size), number ? undefined : wordStyle(i)]}
                  onPress={number ? undefined : tap(i)}
                >
                  {w.text}
                </RNText>
                {!number && meanings && (
                  <Text role="caption" tone="muted" className="max-w-32 text-center">
                    {meanings[i] ?? ''}
                  </Text>
                )}
                {!number && transliteration && (
                  <Text role="caption" tone="lantern" script="latin" className="text-center">
                    {transliteration[i] ?? ''}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <RNText className="font-quran text-ink" style={quranText(size)}>
          {words.map((w, i) =>
            i === words.length - 1 ? (
              w.text
            ) : (
              <RNText key={i}>
                <RNText style={wordStyle(i)} onPress={tap(i)}>
                  {w.text}
                </RNText>
                {w.after}
              </RNText>
            ),
          )}
        </RNText>
      )}

      {translation && (
        <Text role="body">
          {translation.map((seg, i) => {
            if (typeof seg === 'string') return seg;
            const note = footnotes?.[seg[1]];
            if (!note) return null;
            return (
              <RNText
                key={i}
                accessibilityRole="button"
                accessibilityLabel={t('quran.reader.footnote', { mark: seg[0] })}
                onPress={() => onFootnote(seg[0], note)}
                className="text-lantern-ink"
                style={{ fontSize: typeScale.caption.latin.size }}
              >
                {` ${seg[0]} `}
              </RNText>
            );
          })}
        </Text>
      )}

      <View className="flex-row items-center gap-3">
        <Text role="caption" tone="muted">{`${format.number(surah)}:${format.number(ayah)}`}</Text>
        {sajda && (
          <Text role="caption" tone="lantern">
            {t('quran.reader.sajda')}
          </Text>
        )}
        {bookmark && (
          <View
            accessibilityLabel={t(`quran.bookmarks.colors.${bookmark}`)}
            className="size-3 rounded-full"
            style={{ backgroundColor: markColor(theme, bookmark) }}
          />
        )}
        <View className="flex-1" />
        <IconButton
          icon={DotsThree}
          label={t('quran.actions.label', { surah, ayah })}
          onPress={onActions}
        />
      </View>
    </View>
  );
});
