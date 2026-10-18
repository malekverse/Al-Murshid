import { Canvas, Circle, Group, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { duration, periodSun, skyAt, starlight, type SunPosition } from '@murshid/tokens';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same star field as the web (same seed), in fractions of the canvas.
const STARS = (() => {
  const rand = seeded(1447);
  return Array.from({ length: 90 }, () => ({
    x: rand(),
    y: rand() ** 1.6 * 0.7,
    r: 0.4 + rand() * 1.1,
    o: 0.35 + rand() * 0.65,
    twinkle: rand() < 0.2,
    delay: rand(),
  }));
})();

export interface SkyBackgroundProps {
  sun: SunPosition;
  style?: ViewStyle;
  children?: ReactNode;
}

/**
 * The living sky (SPEC 5.1), drawn with Skia on the UI thread. Colors blend continuously from
 * the sun altitude and glide to each new value over the ambient duration. With Reduce Motion
 * it becomes the static gradient of the current period and stars hold still.
 */
export function SkyBackground({ sun, style, children }: SkyBackgroundProps) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const state = useMemo(() => {
    const live = skyAt(sun);
    return reduce ? skyAt(periodSun[live.period]) : live;
  }, [sun, reduce]);

  const top = useSharedValue(state.top);
  const bottom = useSharedValue(state.bottom);
  const stars = useSharedValue(state.stars);
  const twinkle = useSharedValue(1);

  useEffect(() => {
    const timing = { duration: reduce ? 0 : duration.ambient };
    top.set(withTiming(state.top, timing));
    bottom.set(withTiming(state.bottom, timing));
    stars.set(withTiming(state.stars, timing));
  }, [state, reduce, top, bottom, stars]);

  useEffect(() => {
    if (reduce) {
      twinkle.set(1);
      return;
    }
    const beat = duration.ambient * 2;
    twinkle.set(
      withRepeat(
        withSequence(withTiming(0.6, { duration: beat }), withTiming(1, { duration: beat })),
        -1,
      ),
    );
  }, [reduce, twinkle]);

  const gradient = useDerivedValue(() => [top.get(), bottom.get()]);
  const starOpacity = useDerivedValue(() => stars.get());
  const twinkleOpacity = useDerivedValue(() => stars.get() * twinkle.get());

  return (
    <View
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(e) =>
        setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={size.width} height={size.height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, size.height)} colors={gradient} />
        </Rect>
        <Group opacity={starOpacity}>
          {STARS.filter((s) => !s.twinkle).map((s, i) => (
            <Circle
              key={i}
              cx={s.x * size.width}
              cy={s.y * size.height}
              r={s.r}
              color={starlight}
              opacity={s.o}
            />
          ))}
        </Group>
        <Group opacity={twinkleOpacity}>
          {STARS.filter((s) => s.twinkle).map((s, i) => (
            <Circle
              key={i}
              cx={s.x * size.width}
              cy={s.y * size.height}
              r={s.r}
              color={starlight}
              opacity={s.o}
            />
          ))}
        </Group>
      </Canvas>
      {children}
    </View>
  );
}
