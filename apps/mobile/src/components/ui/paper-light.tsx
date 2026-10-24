import { sunPosition } from '@murshid/core';
import {
  colors,
  paperScene,
  periodSun,
  skyAt,
  space,
  spring,
  starlight,
  type PaperLayer,
} from '@murshid/tokens';
import { Accelerometer } from 'expo-sensors';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useUniwind } from 'uniwind';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';

// Illustration: paper and light (SPEC 6.7), as on the web: layered paper horizons under a glass
// disc of light, in the colors of the sky above the person now. Tilting the phone moves the nearer
// layers a few points more than the far ones; with Reduce Motion they stay still. Decorative and
// never behind text: the picture's edges fade into the page.

/**
 * Stops for a band's edge fade, eased so it ends without a line: from the canvas at an edge to
 * clear at `start` of the way in, and back at the far edge over `end` (the start's width if unset).
 */
function fadeStops(start: number, end = start): [number, number][] {
  const ease = [1, 0.62, 0.3, 0.1, 0];
  const near = ease.map((o, i): [number, number] => [(start * i) / 4, o]);
  const far = ease.map((o, i): [number, number] => [1 - (end * i) / 4, o]).reverse();
  return [...near, ...far];
}

/** How far the nearest layer moves at a full tilt. */
const TILT = space[2];

function Layer({
  layer,
  width,
  height,
  tilt,
}: {
  layer: PaperLayer;
  width: number;
  height: number;
  tilt: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tilt.get() * layer.depth }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* A soft shadow on the layer behind, just above this one's edge. */}
        <Path d={layer.d} fill="black" fillOpacity={0.05} transform="translate(0 -3)" />
        <Path d={layer.d} fill="black" fillOpacity={0.05} transform="translate(0 -1.5)" />
        <Path d={layer.d} fill={layer.fill} stroke={layer.edge} strokeOpacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

export function PaperLight({
  seed,
  width,
  height,
}: {
  seed: string;
  width: number;
  height: number;
}) {
  const { theme } = useUniwind();
  const palette = colors[theme === 'dark' ? 'dark' : 'light'];
  const place = useSettings().location;
  const now = useNow(60_000);
  const sun = place ? sunPosition(now, place) : periodSun.fajr;
  const scene = paperScene(seed, skyAt(sun), sun, palette.canvas, starlight, palette.lantern, {
    width,
    height,
  });
  const { light } = scene;
  const reduced = useReducedMotion();
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x }) => {
      tilt.set(withSpring(Math.max(-1, Math.min(1, x)) * TILT, spring.gentle));
    });
    return () => sub.remove();
  }, [reduced, tilt]);

  return (
    <View
      style={{ width, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={scene.sky.top} />
            <Stop offset="1" stopColor={scene.sky.bottom} />
          </LinearGradient>
          <RadialGradient id="glow">
            <Stop offset="0" stopColor={light.glow} stopOpacity={0.55} />
            <Stop offset="1" stopColor={light.glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glass" cx="0.4" cy="0.35">
            <Stop offset="0" stopColor={light.color} stopOpacity={0.95} />
            <Stop offset="1" stopColor={light.color} stopOpacity={0.55} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sky)" />
        <Circle cx={light.cx} cy={light.cy} r={light.r * 3} fill="url(#glow)" />
        <Circle
          cx={light.cx}
          cy={light.cy}
          r={light.r}
          fill="url(#glass)"
          stroke={starlight}
          strokeOpacity={0.8}
        />
      </Svg>
      {scene.layers.map((layer) => (
        <Layer key={layer.depth} layer={layer} width={width} height={height} tilt={tilt} />
      ))}
      {/* The edges fade into the page, painted in the canvas color: all around a square picture,
          along the sides and top of a wide one (a band). */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="fade">
            <Stop offset="0.35" stopColor={palette.canvas} stopOpacity={0} />
            <Stop offset="1" stopColor={palette.canvas} stopOpacity={1} />
          </RadialGradient>
          <LinearGradient id="sides">
            {fadeStops(0.22).map(([offset, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={palette.canvas} stopOpacity={opacity} />
            ))}
          </LinearGradient>
          <LinearGradient id="top" x1="0" y1="0" x2="0" y2="1">
            {fadeStops(0.45, 0.1).map(([offset, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={palette.canvas} stopOpacity={opacity} />
            ))}
          </LinearGradient>
        </Defs>
        {width > 2 * height ? (
          <>
            <Rect width={width} height={height} fill="url(#top)" />
            <Rect width={width} height={height} fill="url(#sides)" />
          </>
        ) : (
          <Rect width={width} height={height} fill="url(#fade)" />
        )}
      </Svg>
    </View>
  );
}
