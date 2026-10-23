import { ESCAPE_HOLD_MS } from '@murshid/core';
import { duration } from '@murshid/tokens';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslations } from 'use-intl';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { useAppLocale } from '@/lib/locale';

/**
 * "Turn off", always on the ring screen (SPEC 5.10): held for 10 seconds, a thin line filling
 * as it goes; letting go early empties it. A screen reader turns it off with one deliberate
 * activation, since holding without seeing the line is guesswork.
 */
export function HoldToStop({ onStop }: { onStop: () => void }) {
  const t = useTranslations('rise.ring');
  const { direction } = useAppLocale();
  const progress = useSharedValue(0);
  const [holding, setHolding] = useState(false);

  const done = () => {
    setHolding(false);
    haptics.medium();
    onStop();
  };

  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('off')}
      accessibilityHint={t('offHint')}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={done}
      onPressIn={() => {
        setHolding(true);
        progress.set(
          withTiming(1, { duration: ESCAPE_HOLD_MS, easing: Easing.linear }, (finished) => {
            if (finished) scheduleOnRN(done);
          }),
        );
      }}
      onPressOut={() => {
        setHolding(false);
        progress.set(withTiming(0, { duration: duration.quick }));
      }}
      className="min-h-touch items-center justify-center gap-2 self-center rounded-full px-6 py-2"
    >
      <Text role="callout" tone="muted">
        {holding ? t('holding') : t('off')}
      </Text>
      <View className="h-1 w-32 overflow-hidden rounded-full bg-hairline">
        {/* Grows from the start edge: the right in Arabic. */}
        <Animated.View
          className="h-full w-full bg-lantern"
          style={[fill, { transformOrigin: direction === 'rtl' ? 'right' : 'left' }]}
        />
      </View>
      <Text role="caption" tone="muted">
        {t('offHint')}
      </Text>
    </Pressable>
  );
}
