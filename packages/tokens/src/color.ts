// Quiet Light color tokens (SPEC 6.1). The real sky is the only strong color;
// one warm lantern accent marks what matters.
//
// Token names differ slightly from the SPEC table so Tailwind utilities read well:
//   SPEC bg -> canvas, text -> ink, text-muted -> ink-muted (see docs/DECISIONS.md).

export type ThemeName = 'light' | 'dark';

export interface ColorTokens {
  /** App background off Today (SPEC `bg`). */
  canvas: string;
  /** Cards and sheets. */
  surface: string;
  /**
   * Cards over the sky, Today only (paired with a backdrop blur). The glass tone follows the
   * sky, not the app theme: see glassToneFor().
   */
  surfaceGlass: string;
  /** Primary text (SPEC `text`). */
  ink: string;
  /** Secondary text (SPEC `text-muted`). */
  inkMuted: string;
  /** Dividers and decorative borders. */
  hairline: string;
  /** Edge of a solid card: transparent in light (shadow does the work), a hairline in dark. */
  cardEdge: string;
  /** The one accent: primary action fill, logged-prayer lights, focus. */
  lantern: string;
  /** Text and icons placed on a lantern fill. */
  onLantern: string;
  /** Lantern used as text or a thin icon on canvas/surface (needs 4.5:1). */
  lanternInk: string;
  /** Focus ring (needs 3:1 against canvas and surface). */
  focus: string;
  /** Rare confirmations outside prayer lights. */
  positive: string;
  /** Destructive actions only. Never used for worship. */
  danger: string;
}

export const colors: Record<ThemeName, ColorTokens> = {
  light: {
    canvas: '#F7F4EE',
    surface: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.76)',
    ink: '#1C1B19',
    inkMuted: '#6B665D',
    hairline: 'rgba(28, 27, 25, 0.08)',
    cardEdge: 'rgba(28, 27, 25, 0)',
    lantern: '#BB7E25',
    onLantern: '#1C1B19',
    lanternInk: '#8C5C14',
    focus: '#8C5C14',
    positive: '#2F7D6D',
    danger: '#B5483B',
  },
  dark: {
    canvas: '#0E1116',
    surface: '#161A21',
    surfaceGlass: 'rgba(22, 26, 33, 0.65)',
    ink: '#F2EFE8',
    inkMuted: '#A39F96',
    hairline: 'rgba(242, 239, 232, 0.10)',
    cardEdge: 'rgba(242, 239, 232, 0.10)',
    lantern: '#E8B25A',
    onLantern: '#0E1116',
    lanternInk: '#E8B25A',
    focus: '#E8B25A',
    positive: '#5FB8A3',
    danger: '#E07A6C',
  },
};

/** Pairs that must meet WCAG AA in both themes: [foreground, background, minimum ratio]. */
export const contrastRequirements: ReadonlyArray<
  readonly [keyof ColorTokens, keyof ColorTokens, number]
> = [
  ['ink', 'canvas', 4.5],
  ['ink', 'surface', 4.5],
  ['inkMuted', 'canvas', 4.5],
  ['inkMuted', 'surface', 4.5],
  ['onLantern', 'lantern', 4.5],
  ['lanternInk', 'canvas', 4.5],
  ['lanternInk', 'surface', 4.5],
  ['positive', 'surface', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'canvas', 4.5],
  // Non-text UI (WCAG 1.4.11): lights, rings, focus outlines.
  ['lantern', 'canvas', 3],
  ['lantern', 'surface', 3],
  ['focus', 'canvas', 3],
  ['focus', 'surface', 3],
];

/** Kebab-case CSS name for a token key: inkMuted -> ink-muted. */
export function cssName(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
