import { touchTarget } from '@murshid/tokens';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppLocale } from '@/lib/locale';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** Read aloud instead of the raw number, e.g. "150%". */
  valueText?: string;
  disabled?: boolean;
}

const THUMB = 28;

/**
 * Single-value slider. Fills from the start side and follows the reading direction (SPEC 7).
 * Drag or tap the track; screen readers adjust it by swiping up and down.
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  valueText,
  disabled = false,
}: SliderProps) {
  const { direction } = useAppLocale();
  const rtl = direction === 'rtl';
  const width = useSharedValue(0);
  const fraction = useSharedValue((value - min) / (max - min));

  useEffect(() => {
    fraction.set((value - min) / (max - min));
  }, [value, min, max, fraction]);

  const commit = (f: number) => {
    const raw = min + f * (max - min);
    const stepped = Math.round(raw / step) * step;
    const next = Math.min(max, Math.max(min, Number(stepped.toFixed(6))));
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
  };

  const update = (x: number) => {
    'worklet';
    if (width.get() <= 0) return;
    const f = Math.min(1, Math.max(0, x / width.get()));
    const fromStart = rtl ? 1 - f : f;
    fraction.set(fromStart);
    scheduleOnRN(commit, fromStart);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(2)
    .onBegin((e) => update(e.x))
    .onUpdate((e) => update(e.x));
  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((e) => update(e.x));

  const fill = useAnimatedStyle(() => ({ width: fraction.get() * width.get() }));
  const thumb = useAnimatedStyle(() => ({ start: fraction.get() * width.get() - THUMB / 2 }));

  const span = max - min;
  const stepBy = (dir: 1 | -1) =>
    commit(Math.min(1, Math.max(0, (value - min + dir * step) / span)));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: valueText }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => stepBy(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onLayout={(e: LayoutChangeEvent) => {
          width.set(e.nativeEvent.layout.width);
        }}
        className={`min-h-touch justify-center ${disabled ? 'opacity-40' : ''}`}
      >
        <View className="h-2 overflow-hidden rounded-full bg-ink/10">
          <Animated.View className="h-2 rounded-full bg-lantern" style={fill} />
        </View>
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full border border-hairline bg-surface shadow-lift dark:border-card-edge"
          style={[{ width: THUMB, height: THUMB, top: (touchTarget - THUMB) / 2 }, thumb]}
        />
      </View>
    </GestureDetector>
  );
}
