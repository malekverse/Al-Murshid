import { duration } from '@murshid/tokens';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * A placeholder shaped like the content it stands for (SPEC 6.6). It breathes slowly instead
 * of shimmering, and holds still with Reduce Motion.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    opacity.set(withRepeat(withTiming(0.55, { duration: duration.ambient / 2 }), -1, true));
  }, [opacity, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      importantForAccessibility="no"
      style={style}
      className={`rounded-control bg-ink/10 ${className}`}
    />
  );
}
