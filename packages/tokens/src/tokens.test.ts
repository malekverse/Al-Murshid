import { describe, expect, it } from 'vitest';
import {
  colors,
  contrastRatio,
  contrastRequirements,
  glassToneFor,
  parseColor,
  ramadanNight,
  sky,
  space,
  typeScale,
  type ThemeName,
} from './index';

describe('color contrast (WCAG 2.2 AA)', () => {
  for (const theme of Object.keys(colors) as ThemeName[]) {
    for (const [fg, bg, min] of contrastRequirements) {
      it(`${theme}: ${fg} on ${bg} >= ${min}:1`, () => {
        const ratio = contrastRatio(colors[theme][fg], colors[theme][bg]);
        expect(ratio).toBeGreaterThanOrEqual(min);
      });
    }
  }

  it('glass keeps ink and muted ink at 4.5:1 over every sky stop, Ramadan’s nights too', () => {
    // Blur averages the sky behind a card; the flat stop color is the worst case.
    for (const stop of [...Object.values(sky), ramadanNight]) {
      for (const backdrop of [stop.top, stop.bottom]) {
        const tone = glassToneFor(backdrop);
        const glass = parseColor(colors[tone].surfaceGlass);
        const flat = mix(colors[tone].surface, backdrop, glass.a);
        expect(contrastRatio(colors[tone].ink, flat)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(colors[tone].inkMuted, flat)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('computes known reference ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
});

describe('scales', () => {
  it('spacing stays on the 4-point grid', () => {
    for (const [step, px] of Object.entries(space)) {
      expect(px % 4).toBe(0);
      expect(px).toBe(Number(step) * 4);
    }
  });

  it('Arabic always runs at least as large and as loose as Latin', () => {
    for (const role of Object.values(typeScale)) {
      if (!('latin' in role)) continue;
      expect(role.arabic.size).toBeGreaterThanOrEqual(role.latin.size);
      expect(role.arabic.lineHeight).toBeGreaterThan(role.latin.lineHeight);
    }
  });
});

function mix(fg: string, bg: string, alpha: number): string {
  const p = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [p(fg), p(bg)];
  const out = a.map((c, i) => Math.round(c * alpha + (b[i] ?? 0) * (1 - alpha)));
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
