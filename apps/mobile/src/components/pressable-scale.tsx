import { motion, spring } from '@murshid/tokens';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Every pressable scales to 0.97 and settles back on the snappy spring (SPEC 6.4). */
export function PressableScale({
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PressableProps & { className?: string }) {
  const reduce = useReducedMotion();
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() =>
    reduce
      ? { opacity: 1 - pressed.value * 0.2 }
      : { transform: [{ scale: 1 - pressed.value * (1 - motion.pressScale) }] },
  );

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        pressed.value = withSpring(1, spring.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, spring.snappy);
        onPressOut?.(e);
      }}
      style={[animated, style as object]}
      {...rest}
    />
  );
}
