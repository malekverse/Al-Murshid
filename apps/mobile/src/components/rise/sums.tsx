import { makeSum, SUMS_PER_ROUND, type SumLevel, type SumPart } from '@murshid/core';
import { duration, space } from '@murshid/tokens';
import { Backspace } from 'phosphor-react-native/src/icons/Backspace';
import { Check } from 'phosphor-react-native/src/icons/Check';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useFormatter, useTranslations } from 'use-intl';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { useColors } from '@/lib/theme';

const MAX_DIGITS = 4;
const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['delete', '0', 'check'],
] as const;
type Key = (typeof ROWS)[number][number];

/** Three sums at the chosen level; a wrong answer clears and the same sum stays. */
export function Sums({
  level,
  onDone,
  onActivity,
}: {
  level: SumLevel;
  onDone: () => void;
  onActivity: () => void;
}) {
  const t = useTranslations('rise.sums');
  const format = useFormatter();
  const color = useColors();
  const reduce = useReducedMotion();
  const [sums] = useState(() => Array.from({ length: SUMS_PER_ROUND }, () => makeSum(level)));
  const [index, setIndex] = useState(0);
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(false);
  const nudge = useSharedValue(0);
  const sum = sums[index]!;

  const digits = (value: string) =>
    [...value].map((d) => format.number(Number(d), { useGrouping: false })).join('');
  const part = (p: SumPart) => (typeof p === 'number' ? digits(String(p)) : p);

  const check = () => {
    if (!entry) return;
    if (Number(entry) === sum.answer) {
      setEntry('');
      if (index + 1 === sums.length) {
        haptics.success();
        onDone();
      } else {
        haptics.selection();
        setIndex(index + 1);
      }
      return;
    }
    haptics.medium();
    setEntry('');
    setWrong(true);
    AccessibilityInfo.announceForAccessibility(t('wrong'));
    if (!reduce) {
      nudge.set(
        withSequence(
          withTiming(-space[2], { duration: duration.instant }),
          withTiming(space[2], { duration: duration.instant }),
          withTiming(0, { duration: duration.instant }),
        ),
      );
    }
  };

  const press = (key: Key) => {
    onActivity();
    if (key === 'check') return check();
    haptics.selection();
    setWrong(false);
    if (key === 'delete') setEntry(entry.slice(0, -1));
    else if (entry.length < MAX_DIGITS) setEntry(entry + key);
  };

  const shaking = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.get() }] }));

  return (
    <View className="flex-1 justify-between gap-6">
      <View className="gap-2">
        <Text role="callout" tone="muted" className="text-center">
          {`${t('prompt')} · ${t('progress', { done: format.number(index + 1), total: format.number(sums.length) })}`}
        </Text>
        {/* Sums read left to right in every language, like the keypad. */}
        <Animated.View
          style={[shaking, { direction: 'ltr' }]}
          className="flex-row flex-wrap items-center justify-center gap-3"
          accessibilityRole="text"
        >
          {sum.parts.map((p, i) => (
            <Text key={i} role="display">
              {part(p)}
            </Text>
          ))}
          <Text role="display" tone="muted">
            =
          </Text>
          <View
            accessibilityLabel={t('answer')}
            accessibilityValue={{ text: entry ? digits(entry) : '' }}
            className={`min-w-24 items-center rounded-control border-2 px-3 ${wrong ? 'border-lantern' : 'border-hairline'}`}
          >
            <Text role="display" tone={entry ? 'lantern' : 'muted'}>
              {entry ? digits(entry) : '?'}
            </Text>
          </View>
        </Animated.View>
        <Text
          role="callout"
          tone="lantern"
          className="text-center"
          accessibilityLiveRegion="polite"
        >
          {wrong ? t('wrong') : ' '}
        </Text>
      </View>

      {/* A keypad is never mirrored: 1 2 3 from the left in every language. */}
      <View style={{ direction: 'ltr' }} className="gap-2">
        {ROWS.map((row) => (
          <View key={row.join()} className="flex-row gap-2">
            {row.map((key) => (
              <PressableScale
                key={key}
                onPress={() => press(key)}
                accessibilityRole="button"
                accessibilityLabel={
                  key === 'delete' ? t('delete') : key === 'check' ? t('check') : digits(key)
                }
                disabled={key === 'check' && !entry}
                className={`h-16 flex-1 items-center justify-center rounded-control ${
                  key === 'check' ? 'bg-lantern' : 'border border-hairline bg-surface'
                }`}
              >
                {key === 'delete' ? (
                  <Backspace size={28} color={color.ink} />
                ) : key === 'check' ? (
                  <Check size={28} weight="bold" color={color.onLantern} />
                ) : (
                  <Text role="title1">{digits(key)}</Text>
                )}
              </PressableScale>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
