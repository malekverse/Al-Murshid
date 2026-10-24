import { sunPosition } from '@murshid/core';
import type { Word } from '@murshid/content/quran';
import { bookmarkColors, bookmarkEnd, type QuranBookmark } from '@murshid/data';
import { periodSun, space, typeScale } from '@murshid/tokens';
import * as Clipboard from 'expo-clipboard';
import { BookmarkSimple } from 'phosphor-react-native/src/icons/BookmarkSimple';
import { BookOpenText } from 'phosphor-react-native/src/icons/BookOpenText';
import { Copy } from 'phosphor-react-native/src/icons/Copy';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';
import { Play } from 'phosphor-react-native/src/icons/Play';
import { Repeat } from 'phosphor-react-native/src/icons/Repeat';
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
import { useFormatter, useLocale, useTranslations } from 'use-intl';
import { IconButton } from '@/components/ui/icon-button';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { setBookmark } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { shareAyahCard } from '@/lib/share-card';
import { markColor, useReaderTheme } from './common';
import { PassageSheet, type PassageTarget } from './passage-sheet';
import type { PassagePlan } from './recitation';
import { TafsirSheet } from './tafsir-sheet';
import { haptics } from '@/lib/haptics';

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
  /** The bookmark marking this ayah, alone or as part of a passage. */
  bookmark: QuranBookmark | null;
  /** The surah's name, to name a passage. */
  surahName: string;
}

/**
 * What an ayah offers (SPEC 5.5, Phase 5b): play from here, repeat a passage, word by word, a
 * bookmark for the ayah or a passage, copy, share as text or as an image (SPEC 5.11).
 */
export function AyahActions({
  target,
  onClose,
  onPlay,
  onRepeat,
  shareUrl,
}: {
  target: ActionsTarget | null;
  onClose: () => void;
  onPlay: (surah: number, ayah: number) => void;
  onRepeat: (surah: number, from: number, plan: PassagePlan) => void;
  shareUrl: (surah: number, ayah: number) => string | null;
}) {
  const t = useTranslations('quran');
  const tc = useTranslations('common');
  const locale = useLocale();
  const format = useFormatter();
  const toast = useToast();
  const theme = useReaderTheme();
  const { location } = useSettings();
  const [words, setWords] = useState(false);
  // These sheets outlive the actions, which close as one opens.
  const [passage, setPassage] = useState<PassageTarget | null>(null);
  const [tafsir, setTafsir] = useState<{ surah: number; ayah: number; title: string } | null>(null);
  const passageSheet = (
    <>
      <PassageSheet target={passage} onClose={() => setPassage(null)} onRepeat={onRepeat} />
      <TafsirSheet target={tafsir} onClose={() => setTafsir(null)} />
    </>
  );
  if (!target) return passageSheet;

  const mark = target.bookmark;
  // A passage starting at an earlier ayah is shown, and changed, as a whole.
  const partOf =
    mark && mark.ayah !== target.ayah
      ? t('range.label', {
          surah: target.surahName,
          from: format.number(mark.ayah),
          to: format.number(bookmarkEnd(mark)),
        })
      : null;

  const quote = [target.text, target.translation, `— ${target.title}`].filter(Boolean).join('\n');
  const close = () => {
    setWords(false);
    onClose();
  };
  const openPassage = (mode: PassageTarget['mode']) => {
    const from = mode === 'bookmark' && mark ? mark.ayah : target.ayah;
    setPassage({ surah: target.surah, ayah: from, mode, bookmark: mark });
    close();
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
            <ListRow
              icon={Repeat}
              title={t('range.repeat')}
              onPress={() => openPassage('repeat')}
            />
            <ListRow
              icon={BookOpenText}
              title={t('actions.tafsir')}
              onPress={() => {
                setTafsir({ surah: target.surah, ayah: target.ayah, title: target.title });
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
            <ListRow
              icon={ImageSquare}
              title={t('actions.shareImage')}
              onPress={() => {
                // The card wears the sky above the reader now; Fajr's before a city is chosen.
                shareAyahCard({
                  text: target.text,
                  translation: target.translation,
                  reference: target.title,
                  appName: tc('app.name'),
                  rtl: locale === 'ar',
                  sun: location ? sunPosition(new Date(), location) : periodSun.fajr,
                  fileName: `al-murshid-${target.surah}-${target.ayah}.png`,
                  dialogTitle: t('actions.shareImage'),
                }).catch(() => toast(t('actions.imageFailed')));
                close();
              }}
            />
          </ListGroup>
          <View className="gap-3">
            <Text role="callout" tone="muted">
              {t('bookmarks.colors.label')}
            </Text>
            {partOf && (
              <Text role="callout" tone="muted">
                {t('bookmarks.inRange', { range: partOf })}
              </Text>
            )}
            <View className="flex-row flex-wrap items-center gap-3">
              {bookmarkColors.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mark?.color === c }}
                  accessibilityLabel={`${t('actions.bookmark')}: ${t(`bookmarks.colors.${c}`)}`}
                  onPress={() => {
                    setBookmark(mark?.surah ?? target.surah, mark?.ayah ?? target.ayah, c);
                    haptics.selection();
                    close();
                  }}
                  className={`size-touch items-center justify-center rounded-full ${mark?.color === c ? 'border-2 border-focus' : ''}`}
                >
                  <View
                    className="size-6 rounded-full"
                    style={{ backgroundColor: markColor(theme, c) }}
                  />
                </Pressable>
              ))}
              {mark && (
                <IconButton
                  icon={X}
                  label={t('actions.unbookmark')}
                  onPress={() => {
                    setBookmark(mark.surah, mark.ayah, null);
                    close();
                  }}
                />
              )}
            </View>
            <ListGroup>
              <ListRow
                icon={BookmarkSimple}
                title={t('range.bookmark')}
                onPress={() => openPassage('bookmark')}
              />
            </ListGroup>
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
      {passageSheet}
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
