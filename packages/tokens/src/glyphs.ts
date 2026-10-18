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
