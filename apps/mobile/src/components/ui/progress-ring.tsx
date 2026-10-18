import { spring } from '@murshid/tokens';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** 0 to 1. */
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  valueText?: string;
  children?: ReactNode;
}

/**
 * A ring that fills clockwise from the top. Never mirrored in RTL: like a clock face, its
 * direction is not a reading direction (SPEC 7).
 */
export function ProgressRing({
  progress,
  size = 56,
  stroke = 4,
  label,
  valueText,
  children,
}: ProgressRingProps) {
  const color = useColors();
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const p = useSharedValue(clamped);

  useEffect(() => {
    p.set(reduce ? clamped : withSpring(clamped, spring.gentle));
  }, [clamped, p, reduce]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - p.get()),
    strokeOpacity: p.get() <= 0.001 ? 0 : 1,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100), text: valueText }}
      style={{ width: size, height: size, direction: 'ltr' }}
      className="items-center justify-center"
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color.ink}
          strokeOpacity={0.1}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color.lantern}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
