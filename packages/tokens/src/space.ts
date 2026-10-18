// Space, shape and depth (SPEC 6.3). 4-point grid; Tailwind's default `--spacing: 0.25rem`
// already lands every utility on it, and these are the named steps feature code should use.

/** Tailwind step -> px. Use these steps only (p-1, p-2, p-3, p-4, p-6, p-8, p-12, p-16). */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 } as const;
export type SpaceStep = keyof typeof space;

export const radius = { control: 12, card: 20, sheet: 28 } as const;
export type RadiusName = keyof typeof radius;

/** Minimum touch target, elders and kids (48 x 48). */
export const touchTarget = 48;

/** Max content widths on web. */
export const layout = { reading: 720, page: 1200 } as const;

/** Soft, layered shadow for solid cards in light theme. Dark theme uses a hairline edge instead. */
export const shadow = {
  card: '0 1px 2px rgb(28 27 25 / 0.04), 0 4px 12px rgb(28 27 25 / 0.05), 0 16px 32px rgb(28 27 25 / 0.06)',
  lift: '0 2px 4px rgb(28 27 25 / 0.05), 0 12px 24px rgb(28 27 25 / 0.08), 0 32px 64px rgb(28 27 25 / 0.08)',
} as const;

/** Backdrop blur of glass cards over the sky (px). Reduce Transparency turns glass solid. */
export const glassBlur = 24;

/** Opacity ceiling for the eight-fold star lattice motif (never behind text). */
export const patternOpacity = 0.04;
