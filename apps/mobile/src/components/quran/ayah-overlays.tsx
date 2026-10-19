import type { Word } from '@murshid/content/quran';
import { bookmarkColors, type BookmarkColor } from '@murshid/data';
import { space, typeScale } from '@murshid/tokens';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy } from 'phosphor-react-native/src/icons/Copy';
import { Play } from 'phosphor-react-native/src/icons/Play';
import { ShareNetwork } from 'phosphor-react-native/src/icons/ShareNetwork';
import { Translate } from 'phosphor-react-native/src/icons/Translate';
import { X } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import {
  Pressable,
  Text as RNText,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslations } from 'use-intl';
import { IconButton } from '@/components/ui/icon-button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { setBookmark } from '@/lib/quran';
import { markColor, useReaderTheme } from './common';

export interface WordTarget {
  word: Word;
  meaning: string | null;
  transliteration: string | null;
  at: { x: number; y: number };
}

const POPOVER_WIDTH = space[16] * 4;

/** A word's meaning and transliteration, beside the tapped word (SPEC 5.5). */
export function WordPopover({ target, onClose }: { target: WordTarget; onClose: () => void }) {
  const t = useTranslations('quran.word');
  const { width, height } = useWindowDimensions();
  const left = Math.min(
    width - POPOVER_WIDTH - space[4],
    Math.max(space[4], target.at.x - POPOVER_WIDTH / 2),
  );
  const below = target.at.y < height * 0.6;
  return (
    <Pressable
      className="absolute inset-0"
      onPress={onClose}
      accessibilityLabel={t('meaning')}
      accessibilityRole="button"
    >
      <View
        accessibilityViewIsModal
        className="absolute gap-2 rounded-card border border-card-edge bg-surface p-4 shadow-lift"
        style={{
          // Measured from the touch point on screen, so physical sides on purpose.
          // eslint-disable-next-line murshid/logical-properties
          left,
          width: POPOVER_WIDTH,
          ...(below
            ? { top: target.at.y + space[6] }
            : { bottom: height - target.at.y + space[6] }),
        }}
      >
        <RNText
          className="font-quran text-ink"
          style={{
            fontSize: typeScale.quran.arabic.size,
            lineHeight: typeScale.quran.arabic.size * typeScale.quran.arabic.lineHeight,
            writingDirection: 'rtl',
            direction: 'rtl',
          }}
        >
          {target.word.text}
        </RNText>
        {target.meaning || target.transliteration ? (
          <>
            {target.meaning && <Text role="body">{target.meaning}</Text>}
            {target.transliteration && (
              <Text role="callout" tone="lantern" script="latin">
                {target.transliteration}
              </Text>
            )}
          </>
        ) : (
          <Text role="callout" tone="muted">
            {t('none')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export interface ActionsTarget {
  surah: number;
  ayah: number;
  title: string;
  text: string;
  translation: string | null;
  words: Word[];
  meanings: (string | null)[] | null;
  transliteration: (string | null)[] | null;
  bookmark: BookmarkColor | null;
}

/** What an ayah offers (SPEC 5.5): play from here, word by word, bookmark, copy, share. */
export function AyahActions({
  target,
  onClose,
  onPlay,
  shareUrl,
}: {
  target: ActionsTarget | null;
  onClose: () => void;
  onPlay: (surah: number, ayah: number) => void;
  shareUrl: (surah: number, ayah: number) => string | null;
}) {
  const t = useTranslations('quran');
  const toast = useToast();
  const theme = useReaderTheme();
  const [words, setWords] = useState(false);
  if (!target) return null;

  const quote = [target.text, target.translation, `— ${target.title}`].filter(Boolean).join('\n');
  const close = () => {
    setWords(false);
    onClose();
  };

  return (
    <>
      <Sheet open={!words} onClose={close} title={target.title}>
        <View className="gap-6">
          <ListGroup>
            <ListRow
              icon={Play}
              title={t('actions.play')}
              onPress={() => {
                onPlay(target.surah, target.ayah);
                close();
              }}
            />
            <ListRow icon={Translate} title={t('actions.words')} onPress={() => setWords(true)} />
            <ListRow
              icon={Copy}
              title={t('actions.copy')}
              onPress={() => {
                void Clipboard.setStringAsync(quote);
                toast(t('actions.copied'));
                close();
              }}
            />
            <ListRow
              icon={ShareNetwork}
              title={t('actions.share')}
              onPress={() => {
                const url = shareUrl(target.surah, target.ayah);
                void Share.share({ message: url ? `${quote}\n${url}` : quote });
                close();
              }}
            />
          </ListGroup>
          <View className="gap-3">
            <Text role="callout" tone="muted">
              {t('bookmarks.colors.label')}
            </Text>
            <View className="flex-row flex-wrap items-center gap-3">
              {bookmarkColors.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected: target.bookmark === c }}
                  accessibilityLabel={`${t('actions.bookmark')}: ${t(`bookmarks.colors.${c}`)}`}
                  onPress={() => {
                    setBookmark(target.surah, target.ayah, c);
                    void Haptics.selectionAsync();
                    close();
                  }}
                  className={`size-touch items-center justify-center rounded-full ${target.bookmark === c ? 'border-2 border-focus' : ''}`}
                >
                  <View
                    className="size-6 rounded-full"
                    style={{ backgroundColor: markColor(theme, c) }}
                  />
                </Pressable>
              ))}
              {target.bookmark && (
                <IconButton
                  icon={X}
                  label={t('actions.unbookmark')}
                  onPress={() => {
                    setBookmark(target.surah, target.ayah, null);
                    close();
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Sheet>
      <Sheet open={words} onClose={close} title={`${t('actions.words')} · ${target.title}`}>
        <ScrollView style={{ maxHeight: space[16] * 8 }}>
          {target.words.slice(0, -1).map((w, i) => (
            <View key={i} className="flex-row items-center gap-4 border-b border-hairline py-3">
              <RNText
                className="font-quran text-ink"
                style={{
                  minWidth: space[16] * 1.5,
                  fontSize: typeScale.quran.arabic.size,
                  lineHeight: typeScale.quran.arabic.size * typeScale.quran.arabic.lineHeight,
                  writingDirection: 'rtl',
                }}
              >
                {w.text}
              </RNText>
              <View className="flex-1 gap-1">
                <Text role="body">{target.meanings?.[i] ?? t('word.none')}</Text>
                {target.transliteration?.[i] && (
                  <Text role="caption" tone="lantern" script="latin">
                    {target.transliteration[i]}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </Sheet>
    </>
  );
}

/** A translation footnote, in a short sheet. */
export function FootnoteSheet({
  note,
  onClose,
}: {
  note: { mark: string; text: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations('quran.reader');
  return (
    <Sheet
      open={note !== null}
      onClose={onClose}
      title={note ? t('footnote', { mark: note.mark }) : ''}
    >
      <ScrollView style={{ maxHeight: space[16] * 6 }}>
        <Text role="body">{note?.text}</Text>
      </ScrollView>
    </Sheet>
  );
}
