import { describe, expect, it } from 'vitest';
import { colors } from './color';
import { toOklab } from './oklab';
import { paperScene } from './paper';
import { periodSun, skyAt, starlight } from './sky';

const scene = (seed: string, period: keyof typeof periodSun) =>
  paperScene(
    seed,
    skyAt(periodSun[period]),
    periodSun[period],
    colors.light.canvas,
    starlight,
    colors.light.lantern,
  );

describe('paper and light', () => {
  it('lays four paper horizons, each nearer one closer to the page', () => {
    const { layers } = scene('bookmarks', 'dhuhr');
    expect(layers).toHaveLength(4);
    const distance = (hex: string) => {
      const [l1, a1, b1] = toOklab(hex);
      const [l2, a2, b2] = toOklab(colors.light.canvas);
      return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
    };
    for (let i = 1; i < layers.length; i++) {
      expect(distance(layers[i]!.fill)).toBeLessThan(distance(layers[i - 1]!.fill));
    }
    expect(layers[3]!.fill).toBe(colors.light.canvas.toUpperCase());
    expect(layers.map((l) => l.depth)).toEqual([0, 1 / 3, 2 / 3, 1]);
  });

  it('gives each place its own skyline, the same every time', () => {
    expect(scene('bookmarks', 'dhuhr').layers[0]!.d).toBe(scene('bookmarks', 'dhuhr').layers[0]!.d);
    expect(scene('search', 'dhuhr').layers[0]!.d).not.toBe(
      scene('bookmarks', 'dhuhr').layers[0]!.d,
    );
  });

  it('closes every horizon along the bottom of the picture', () => {
    for (const layer of scene('notes', 'asr').layers) {
      expect(layer.d.startsWith('M0 ')).toBe(true);
      expect(layer.d.endsWith('L320 200 L0 200 Z')).toBe(true);
    }
  });

  it('raises the light with the sun, warm by day and cool by night', () => {
    const noon = scene('offline', 'dhuhr').light;
    const dusk = scene('offline', 'maghrib').light;
    const night = scene('offline', 'night').light;
    expect(noon.cy).toBeLessThan(dusk.cy);
    expect(noon.glow).toBe(colors.light.lantern);
    expect(night.glow).toBe(starlight);
  });
});
