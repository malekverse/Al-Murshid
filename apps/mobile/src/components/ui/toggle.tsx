import { spring } from '@murshid/tokens';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppLocale } from '@/lib/locale';
import { haptics } from '@/lib/haptics';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// Track 56 x 32, thumb 24 with a 4 px inset: the thumb travels 24 px.
const TRAVEL = 24;

/** On/off switch with a light haptic (SPEC 6.5). The thumb travels toward the reading end. */
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  const { direction } = useAppLocale();
  const reduce = useReducedMotion();
  const sign = direction === 'rtl' ? -1 : 1;
  const x = useSharedValue(checked ? TRAVEL * sign : 0);

  useEffect(() => {
    const target = checked ? TRAVEL * sign : 0;
    x.set(reduce ? target : withSpring(target, spring.snappy));
  }, [checked, sign, reduce, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onChange(!checked);
      }}
      className={`min-h-touch justify-center ${disabled ? 'opacity-40' : ''}`}
    >
      {/* Off track keeps 3:1 against the surface (WCAG 1.4.11). */}
      <View
        className={`h-8 w-14 flex-row items-center rounded-full p-1 ${checked ? 'bg-lantern' : 'bg-ink-muted/80'}`}
      >
        <Animated.View style={thumb}>
          <View className="size-6 rounded-full bg-surface shadow-card dark:bg-ink" />
        </Animated.View>
      </View>
    </Pressable>
  );
}
