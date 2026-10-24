// Prayer glyphs (SPEC 6.3): the sun's position on its daily arc, one glyph per prayer.
// Geometry only, on a 24 x 24 grid, so web (SVG) and native (react-native-svg) draw the same
// shape. Glyphs are never mirrored in RTL: like a clock, the sun's path is not a reading direction.

export const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerName = (typeof prayers)[number];

export interface PrayerGlyph {
  /** The sun's daily path (a half circle above the horizon), drawn dotted. */
  arc: string;
  /** The horizon line. */
  horizon: { x1: number; y1: number; x2: number; y2: number };
  /** The sun. Below the horizon (Fajr, Isha) it is an outline: present, not yet risen. */
  sun: { cx: number; cy: number; r: number; filled: boolean };
}

const CX = 12;
const CY = 17;
const R = 8.5;

// Angle along the arc in degrees: 180 is the eastern horizon, 90 is noon, 0 is the west.
const sunAngle: Record<PrayerName, number> = {
  fajr: 200,
  sunrise: 180,
  dhuhr: 90,
  asr: 42,
  maghrib: 0,
  isha: -20,
};

const round = (n: number) => Math.round(n * 100) / 100;

export function prayerGlyph(prayer: PrayerName): PrayerGlyph {
  const theta = (sunAngle[prayer] * Math.PI) / 180;
  const cx = round(CX + R * Math.cos(theta));
  const cy = round(CY - R * Math.sin(theta));
  return {
    arc: `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`,
    horizon: { x1: 2, y1: CY, x2: 22, y2: CY },
    sun: { cx, cy, r: 2.25, filled: cy <= CY },
  };
}

/** Stroke width for glyphs and line icons (SPEC 6.3: 1.5 to 1.75). */
export const iconStroke = 1.5;

// The lattice's star {8/3} (SPEC 6.7): the mark's star, the star puzzle's and the surah frames'
// ornament. Its inner radius is cos(3π/8) / cos(π/8) of the outer, as where the lattice's lines
// cross. Never mirrored: it is symmetric.
export const latticeInner = Math.cos((3 * Math.PI) / 8) / Math.cos(Math.PI / 8);

/** The star's 16 corners around (cx, cy), the first at the top, rounded to 0.01. */
export function latticeStar(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 16 }, (_, k) => {
    const radius = k % 2 === 0 ? r : r * latticeInner;
    const a = (Math.PI / 8) * k - Math.PI / 2;
    return [round(cx + radius * Math.cos(a)), round(cy + radius * Math.sin(a))];
  });
}

/** The same corners as an SVG `points` list. */
export function latticeStarPoints(cx: number, cy: number, r: number): string {
  return latticeStar(cx, cy, r)
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

/**
 * A surah's opening frame (Phase 7c): a cartouche of two rules ending in pointed caps, a lattice
 * star in each, around the calligraphic name. `cap` holds the start side's curves on its own grid,
 * as tall as the frame; the end side is their mirror. Each rule is a straight line at `y` from
 * where it leaves the start curve (`x`) to its mirror, so rules and caps join without a seam.
 */
export const surahFrameGlyph = {
  width: 42,
  height: 84,
  cap: {
    outer: 'M26 3 Q8 3 3 42 Q8 81 26 81',
    inner: 'M27 9 Q13 9 10 42 Q13 75 27 75',
    star: latticeStarPoints(26, 42, 9),
  },
  rules: [
    { y: 3, x: 26, stroke: iconStroke, faint: false },
    { y: 9, x: 27, stroke: 1, faint: true },
    { y: 75, x: 27, stroke: 1, faint: true },
    { y: 81, x: 26, stroke: iconStroke, faint: false },
  ],
} as const;

/** Al-Murshid's mark on a 64 grid (SPEC 6.7): the star over the horizon arc. */
export const markGlyph = {
  star: latticeStarPoints(32, 26, 15),
  arc: 'M6 52 Q32 38 58 52',
  arcStroke: 3.5,
} as const;
