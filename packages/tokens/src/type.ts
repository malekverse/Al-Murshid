// Type scale (SPEC 6.2). Arabic runs larger and looser than Latin, so every UI role has a
// Latin and an Arabic variant; the script-aware Text component picks the right one.

export type Script = 'latin' | 'arabic';
export type FontWeight = 400 | 500 | 600;

export interface TypeMetrics {
  /** Size in px (pt on native). */
  size: number;
  /** Unitless line-height multiplier. */
  lineHeight: number;
}

export interface TypeRole {
  weight: FontWeight;
  latin?: TypeMetrics;
  arabic: TypeMetrics;
}

export const typeScale = {
  display: {
    weight: 600,
    latin: { size: 40, lineHeight: 1.15 },
    arabic: { size: 42, lineHeight: 1.35 },
  },
  title1: {
    weight: 600,
    latin: { size: 28, lineHeight: 1.2 },
    arabic: { size: 30, lineHeight: 1.45 },
  },
  title2: {
    weight: 600,
    latin: { size: 22, lineHeight: 1.25 },
    arabic: { size: 24, lineHeight: 1.5 },
  },
  headline: {
    weight: 500,
    latin: { size: 18, lineHeight: 1.35 },
    arabic: { size: 19, lineHeight: 1.6 },
  },
  body: {
    weight: 400,
    latin: { size: 16, lineHeight: 1.5 },
    arabic: { size: 18, lineHeight: 1.75 },
  },
  callout: {
    weight: 400,
    latin: { size: 15, lineHeight: 1.45 },
    arabic: { size: 16, lineHeight: 1.7 },
  },
  caption: {
    weight: 400,
    latin: { size: 13, lineHeight: 1.4 },
    arabic: { size: 14, lineHeight: 1.6 },
  },
  // Sacred text roles exist in Arabic only.
  quran: { weight: 400, arabic: { size: 28, lineHeight: 2.1 } },
  dhikr: { weight: 400, arabic: { size: 24, lineHeight: 1.9 } },
} as const satisfies Record<string, TypeRole>;

export type TypeRoleName = keyof typeof typeScale;

/** UI roles that exist in both scripts. */
export const uiRoles = [
  'display',
  'title1',
  'title2',
  'headline',
  'body',
  'callout',
  'caption',
] as const;
export type UiRole = (typeof uiRoles)[number];

/** The reader can resize Quran text within this range (px). */
export const quranSizeRange = { min: 20, max: 48 } as const;

/** Calligraphic surah names (QUL surah name font): in lists, and heading a surah. */
export const surahNameSize = { list: 32, header: 52 } as const;

/**
 * The mushaf page (SPEC 5.5). Each page's QCF V2 font is sized from the page width so every line
 * fills it as printed: font size = width x fontPerWidth, up to maxWidth.
 */
export const mushafPage = {
  maxWidth: 600,
  fontPerWidth: 0.0545,
  lineHeight: 1.85,
  /** The basmalah line, drawn in page 1's font, is set a little smaller so it fits one line. */
  basmalah: 0.8,
  /**
   * The Indopak mushaf (Phase 5b) is set in one Unicode font (KFGQPC Nastaleeq), its tall script
   * needing more room between lines; each line is justified to the page's width.
   */
  indopak: { fontPerWidth: 0.06, lineHeight: 2 },
} as const;

/**
 * A word hidden while memorizing (Phase 5b): a thin rounded bar as wide as the word, near the
 * line's base, in em of the Quran text's size, so it scales with the text in every view.
 */
export const memorizeBar = {
  height: 0.16,
  /** From the bottom of the word's box. */
  offset: 0.32,
} as const;

/** In-app comfort size multiplies on top of the system text size, up to 200%. */
export const comfortScale = { min: 1, max: 2, step: 0.1 } as const;

/**
 * Font families. Web uses the variable Readex Pro through next/font; native loads static
 * weights, one family name per weight, so Arabic never gets synthetic bold.
 */
export const fonts = {
  web: {
    ui: 'var(--font-readex-pro), ui-sans-serif, system-ui, sans-serif',
    sacred: 'var(--font-amiri), serif',
    // King Fahd Complex QPC Hafs font, self-hosted (SPEC 6.2, 10); Amiri only if it fails to load.
    quran: 'var(--font-qpc-hafs), var(--font-amiri), serif',
    // QUL's surah name font: ligatures turn "surah002" into its calligraphy.
    surah: 'var(--font-surah-name)',
    // The King Fahd Complex's Nastaleeq font, for the Indopak mushaf (Phase 5b).
    indopak: 'var(--font-indopak)',
  },
  native: {
    ui: { 400: 'ReadexPro-Regular', 500: 'ReadexPro-Medium', 600: 'ReadexPro-SemiBold' },
    sacred: 'Amiri-Regular',
    quran: 'QPC-Hafs',
    surah: 'SurahName-V2',
    indopak: 'KFGQPC-Nastaleeq',
  },
} as const;
