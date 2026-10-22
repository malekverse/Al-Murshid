import { spring } from '@murshid/tokens';
import { useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useLocale, useTranslations } from 'use-intl';
import { RollingNumber } from './countdown';
import { ProgressRing } from './progress-ring';
import { Text } from './text';
import { haptics } from '@/lib/haptics';

export interface DhikrCardProps {
  /** Verbatim Arabic from packages/content, never generated or edited. */
  arabic: string;
  translation?: string;
  transliteration?: string;
  reference: string;
  target: number;
  /** The text is Quran (e.g. Al-Ikhlas in the morning adhkar): render it in the Quran font. */
  quran?: boolean;
  showTranslation?: boolean;
  showTransliteration?: boolean;
  onComplete?: () => void;
}

/**
 * One dhikr: tap anywhere on the card to count (light haptic), a ring fills around the count,
 * and the last tap settles the card with a medium haptic (SPEC 5.6, 6.5).
 */
export function DhikrCard({
  arabic,
  translation,
  transliteration,
  reference,
  target,
  quran = false,
  showTranslation = true,
  showTransliteration = false,
  onComplete,
}: DhikrCardProps) {
  const t = useTranslations('components.dhikr');
  const locale = useLocale();
  const reduce = useReducedMotion();
  const format = new Intl.NumberFormat(locale);
  const [count, setCount] = useState(0);
  const done = count >= target;
  const scale = useSharedValue(1);
  const settle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const tap = () => {
    if (done) return;
    const next = count + 1;
    setCount(next);
    if (next === target) {
      haptics.medium();
      if (!reduce)
        scale.set(withSequence(withSpring(0.985, spring.soft), withSpring(1, spring.soft)));
      onComplete?.();
    } else {
      haptics.selection();
    }
  };

  const countText = t('count', { count: format.format(count), target: format.format(target) });

  return (
    <Animated.View style={settle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('tapToCount')}. ${countText}`}
        accessibilityState={{ disabled: done }}
        onPress={tap}
        className="gap-6 rounded-card border border-card-edge bg-surface p-6 shadow-card dark:shadow-none"
      >
        <View className="flex-row items-center justify-between gap-4">
          <Text role="caption" tone="muted">
            {reference}
          </Text>
          <ProgressRing progress={count / target} label={countText}>
            <RollingNumber
              value={format.format(done ? target : count)}
              role="callout"
              tone={done ? 'lantern' : 'default'}
            />
          </ProgressRing>
        </View>
        {quran ? (
          <RNText
            className="font-quran text-quran text-ink"
            style={{ writingDirection: 'rtl', direction: 'rtl' }}
          >
            {arabic}
          </RNText>
        ) : (
          <Text role="dhikr" script="arabic">
            {arabic}
          </Text>
        )}
        {showTransliteration && transliteration && (
          <Text role="callout" tone="muted" script="latin">
            {transliteration}
          </Text>
        )}
        {showTranslation && translation && <Text role="body">{translation}</Text>}
        {done && (
          <Text role="callout" tone="lantern">
            {t('done')}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
