import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings } from './settings';
import { addToTasbihDay, FREE_PHRASE, parseTasbihCount, tasbihKey } from './tasbih';

describe('tasbih', () => {
  it('adds to the day’s total, phrase by phrase', () => {
    const now = new Date('2026-10-21T20:00:00Z');
    const first = addToTasbihDay(undefined, '2026-10-21', FREE_PHRASE, 1, now);
    expect(first).toEqual({
      date: '2026-10-21',
      phrase: 'free',
      count: 1,
      updatedAt: '2026-10-21T20:00:00.000Z',
    });
    expect(addToTasbihDay(first, '2026-10-21', FREE_PHRASE, 32, now).count).toBe(33);
    expect(tasbihKey('2026-10-21', FREE_PHRASE)).toBe('2026-10-21:free');
  });

  it('keeps the count on screen, and starts again at 0 from anything damaged', () => {
    expect(parseTasbihCount(12)).toBe(12);
    expect(parseTasbihCount(-1)).toBe(0);
    expect(parseTasbihCount('12')).toBe(0);
    expect(parseTasbihCount(null)).toBe(0);
  });

  it('targets 33 by default, takes none or a custom one, and turns haptics off on request', () => {
    expect(defaultSettings()).toMatchObject({ tasbihTarget: 33, haptics: true });
    expect(parseSettings({ tasbihTarget: null }).tasbihTarget).toBeNull();
    expect(parseSettings({ tasbihTarget: 500 }).tasbihTarget).toBe(500);
    expect(parseSettings({ tasbihTarget: 0 }).tasbihTarget).toBe(33);
    expect(parseSettings({ haptics: false }).haptics).toBe(false);
  });
});
