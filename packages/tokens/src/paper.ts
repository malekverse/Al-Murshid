// Illustration: paper and light (SPEC 6.7). Abstract layered paper horizons under a glass disc of
// light, tinted by the sky of the moment: the farthest layer takes the sky's lower color and each
// nearer one comes closer to the page's own paper, so the scene settles into the canvas. No objects,
// buildings or people. Geometry and colors only, so web (SVG) and native (react-native-svg) draw the
// same scene; each place has its own `seed`, so no two empty states share a skyline.

import { mixOklab } from './oklab';
import type { SkyStop, SunPosition } from './sky';

export interface PaperLayer {
  /** A closed path: the horizon's curve, then down to the bottom corners. */
  d: string;
  fill: string;
  /** The paper's lit edge along the curve. */
  edge: string;
  /** 0 for the farthest layer, 1 for the nearest: how far a tilt moves it. */
  depth: number;
}

export interface PaperScene {
  width: number;
  height: number;
  /** The sky behind the layers, top to bottom. */
  sky: SkyStop;
  layers: PaperLayer[];
  /** The glass disc of light: the sun by day, a cool glow by night. */
  light: { cx: number; cy: number; r: number; color: string; glow: string };
}

/** Small, stable pseudo-random numbers from a string (FNV-1a, then xorshift). */
function random(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** A smooth horizon across the width through `points` heights, closed along the bottom. */
function horizon(width: number, height: number, ys: number[]): string {
  const step = width / (ys.length - 1);
  let d = `M0 ${round(ys[0]!)}`;
  for (let i = 1; i < ys.length; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    // Horizontal tangents at every point: soft rolling paper, never a peak.
    d += ` C${round(x0 + step / 2)} ${round(ys[i - 1]!)} ${round(x1 - step / 2)} ${round(ys[i]!)} ${round(x1)} ${round(ys[i]!)}`;
  }
  return `${d} L${width} ${height} L0 ${height} Z`;
}

const LAYERS = 4;

/**
 * The scene for one place (`seed`) at one moment: the sky of that moment, the sun's position,
 * and the page color the nearest layer settles into.
 */
export function paperScene(
  seed: string,
  sky: SkyStop,
  sun: SunPosition,
  canvas: string,
  starlight: string,
  lantern: string,
  size: { width: number; height: number } = { width: 320, height: 200 },
): PaperScene {
  const { width, height } = size;
  const next = random(seed);
  const layers: PaperLayer[] = [];
  for (let i = 0; i < LAYERS; i++) {
    const depth = i / (LAYERS - 1);
    // Farther layers sit higher and roll more; the nearest is nearly flat.
    const base = height * (0.5 + 0.13 * i);
    const roll = height * (0.11 - 0.022 * i);
    const ys = Array.from({ length: 4 }, () => base + (next() * 2 - 1) * roll);
    const fill = mixOklab(sky.bottom, canvas, 0.3 + 0.7 * depth ** 0.8);
    layers.push({
      d: horizon(width, height, ys),
      fill,
      edge: mixOklab(fill, starlight, 0.55),
      depth,
    });
  }
  // The light rides the sun: high at noon, on the far horizon at sunrise and sunset, and below
  // night's layers it becomes a cool glow resting on them.
  const up = Math.max(0, Math.min(1, sun.altitude / Math.max(sun.noonAltitude, 1)));
  const day = sun.altitude > -4;
  const r = height * 0.12;
  const cx =
    width * (sun.rising ? 0.28 + 0.22 * up : 0.72 - 0.22 * up) + (next() - 0.5) * width * 0.08;
  const cy = height * (0.5 - 0.32 * up);
  return {
    width,
    height,
    // The sky eased toward the paper, so the picture stays quiet on the page.
    sky: { top: mixOklab(sky.top, canvas, 0.18), bottom: mixOklab(sky.bottom, canvas, 0.08) },
    layers,
    light: {
      cx: round(cx),
      cy: round(cy),
      r: round(r),
      color: day ? mixOklab(lantern, starlight, 0.55) : starlight,
      glow: day ? lantern : starlight,
    },
  };
}
