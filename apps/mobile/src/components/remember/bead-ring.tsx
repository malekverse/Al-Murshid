import { spring } from '@murshid/tokens';
import { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const VIEW = 288;
const RADIUS = 128;

/**
 * Tasbih's ring of beads (SPEC 6.4): each tap lights the next bead, which settles with a snappy
 * spring on the UI thread. It runs clockwise from the top and is never mirrored: like the progress
 * ring and a clock face, its direction is not a reading direction (SPEC 7).
 */
export function BeadRing({
  beads,
  lit,
  complete,
  size = VIEW,
}: {
  beads: number;
  lit: number;
  complete: boolean;
  size?: number;
}) {
  const color = useColors();
  const reduce = useReducedMotion();
  const bead = beads <= 33 ? 7 : beads <= 66 ? 4.5 : 3.5;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (lit === 0 || complete || reduce) return;
    pulse.set(1.8);
    pulse.set(withSpring(1, spring.snappy));
  }, [lit, complete, reduce, pulse]);

  const latestProps = useAnimatedProps(() => ({ r: bead * pulse.get() }));
  const at = (i: number) => {
    const angle = (i / beads) * 2 * Math.PI - Math.PI / 2;
    return { cx: VIEW / 2 + RADIUS * Math.cos(angle), cy: VIEW / 2 + RADIUS * Math.sin(angle) };
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: beads }, (_, i) => {
        const on = i < lit;
        if (on && i === lit - 1 && !complete) {
          return (
            <AnimatedCircle key={i} {...at(i)} fill={color.lantern} animatedProps={latestProps} />
          );
        }
        return <Circle key={i} {...at(i)} r={bead} fill={on ? color.lantern : color.hairline} />;
      })}
    </Svg>
  );
}
