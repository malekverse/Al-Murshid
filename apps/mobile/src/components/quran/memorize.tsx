import { hiddenWord, hideModes, type HideMode } from '@murshid/data';
import { colors, memorizeBar, type ThemeName } from '@murshid/tokens';
import { useState, type ReactNode } from 'react';
import {
  Text as RNText,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useReaderTheme } from './common';
import { Choice, setQuranPrefs } from './reading-settings';
import { haptics } from '@/lib/haptics';

// Memorizing (Phase 5b): words or ayah markers hidden in every view, each keeping its exact
// place, so nothing reflows. A tap reveals one; holding shows the whole ayah while held.

export interface Memorize {
  mode: HideMode;
  /** Whether a word (by id) is hidden now: `index` from 0 in its ayah, `marker` its number. */
  hidden: (id: number, index: number, marker: boolean, ayahKey: string) => boolean;
  /** Whether the mode hides this word at all (revealed or not). */
  hides: (id: number, index: number, marker: boolean) => boolean;
  reveal: (id: number) => void;
  peek: (ayahKey: string | null) => void;
  /** Hide again what was revealed. */
  reset: () => void;
  revealedCount: number;
}

/** The reader's hiding state: what the mode hides, less what was revealed or is being peeked at. */
export function useMemorize(mode: HideMode): Memorize {
  const [state, setState] = useState<{ mode: HideMode; revealed: Set<number> }>({
    mode,
    revealed: new Set(),
  });
  const [peeking, setPeeking] = useState<string | null>(null);
  // A new mode starts with everything it hides hidden.
  const revealed = state.mode === mode ? state.revealed : new Set<number>();
  if (state.mode !== mode) setState({ mode, revealed });
  return {
    mode,
    hides: (id, index, marker) => hiddenWord(mode, index, marker) && !revealed.has(id),
    hidden: (id, index, marker, ayahKey) =>
      hiddenWord(mode, index, marker) && !revealed.has(id) && peeking !== ayahKey,
    reveal: (id) => setState((s) => ({ mode: s.mode, revealed: new Set(s.revealed).add(id) })),
    peek: setPeeking,
    reset: () => setState({ mode, revealed: new Set() }),
    revealedCount: revealed.size,
  };
}

/**
 * A word that may be hidden, keeping its exact place. A word standing on its own (a justified
 * mushaf line: `barSize` is its font size) is drawn as a thin bar near the line's base, as on web;
 * a word inside running text, which React Native cannot draw a bar in, is transparent on a soft
 * tint. A tap reveals it; holding shows its whole ayah until released. The same element stays
 * while peeking, so the release always reaches it. Shown, it is the word with its own press.
 */
export function VeiledWord({
  id,
  index,
  marker = false,
  ayahKey,
  memorize,
  style,
  barSize,
  theme,
  onPress,
  children,
}: {
  id: number;
  index: number;
  marker?: boolean;
  ayahKey: string;
  memorize: Memorize;
  style?: StyleProp<TextStyle>;
  /** The font size of a word standing on its own, drawn as a bar when hidden. */
  barSize?: number;
  /** The page's own colors, when they differ from the reader's (the 1441H page, on paper in dark). */
  theme?: ThemeName;
  onPress?: (e: GestureResponderEvent) => void;
  children: ReactNode;
}) {
  const t = useTranslations('quran.memorize');
  const readerTheme = useReaderTheme();
  const palette = colors[theme ?? readerTheme];
  const hides = memorize.hides(id, index, marker);
  const hidden = memorize.hidden(id, index, marker, ayahKey);
  const bar = hidden && barSize !== undefined;
  const word = (
    <RNText
      style={[
        style,
        // The ink at zero alpha, not "transparent": Android reads that as no color at all and
        // falls back to the inherited ink, so the word would still show.
        hidden && { color: `${palette.ink}00` },
        hidden && !bar && { backgroundColor: `${palette.ink}0F` },
        // A word standing alone fades out entirely, whatever its font draws.
        bar && { opacity: 0 },
      ]}
      accessibilityRole={hidden ? 'button' : undefined}
      accessibilityLabel={hidden ? (marker ? t('hiddenMarker') : t('hidden')) : undefined}
      suppressHighlighting
      onPress={
        hidden
          ? () => {
              memorize.reveal(id);
              haptics.selection();
            }
          : onPress
      }
      onLongPress={hides ? () => memorize.peek(ayahKey) : undefined}
      onPressOut={hides ? () => memorize.peek(null) : undefined}
    >
      {children}
    </RNText>
  );
  if (!bar) return word;
  return (
    <View>
      {word}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 rounded-full"
        style={{
          bottom: barSize * memorizeBar.offset,
          height: barSize * memorizeBar.height,
          backgroundColor: `${palette.ink}40`,
        }}
      />
    </View>
  );
}

/** What to hide while memorizing, and a way to hide again what was revealed. */
export function MemorizeSheet({
  open,
  onClose,
  memorize,
}: {
  open: boolean;
  onClose: () => void;
  memorize: Memorize;
}) {
  const t = useTranslations('quran.memorize');
  return (
    <Sheet open={open} onClose={onClose} title={t('title')} description={t('hint')}>
      <View className="gap-6">
        <View className="gap-1" accessibilityRole="radiogroup" accessibilityLabel={t('title')}>
          {hideModes.map((mode) => (
            <Choice
              key={mode}
              label={t(`modes.${mode}`)}
              selected={memorize.mode === mode}
              onPress={() => {
                setQuranPrefs({ hide: mode });
                haptics.selection();
                onClose();
              }}
            />
          ))}
        </View>
        {memorize.mode !== 'off' && memorize.revealedCount > 0 && (
          <Button
            variant="secondary"
            onPress={() => {
              memorize.reset();
              onClose();
            }}
          >
            {t('hideAgain')}
          </Button>
        )}
      </View>
    </Sheet>
  );
}
