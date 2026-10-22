import { describe, expect, it } from 'vitest';
import { defaultSettings, prayerTimes } from './prayer-times';
import { nextWidgetPrayer, widgetPrayers } from './widget';

const tunis = { latitude: 36.8065, longitude: 10.1815 };
const settings = { ...defaultSettings, method: 'tunisia' as const };
const thursday = { year: 2026, month: 10, day: 15 };

describe('widget prayers', () => {
  it('lists five prayers a day, in order, with Friday’s Dhuhr as Jumu’ah', () => {
    const list = widgetPrayers(tunis, settings, thursday, 2);
    expect(list).toHaveLength(10);
    expect(list.map((p) => p.prayer).slice(0, 5)).toEqual([
      'fajr',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ]);
    expect(list.every((p, i) => i === 0 || p.at > list[i - 1]!.at)).toBe(true);
    expect(list.filter((p) => p.jumuah).map((p) => p.date)).toEqual([
      { year: 2026, month: 10, day: 16 },
    ]);
    expect(list[0]!.at).toEqual(prayerTimes(tunis, thursday, settings).fajr);
  });

  it('finds the next prayer, and nothing once the list has run out', () => {
    const list = widgetPrayers(tunis, settings, thursday, 1);
    const asr = list[2]!;
    expect(nextWidgetPrayer(list, new Date(asr.at.getTime() - 1))).toBe(asr);
    expect(nextWidgetPrayer(list, asr.at)?.prayer).toBe('maghrib');
    expect(nextWidgetPrayer(list, new Date(list[4]!.at.getTime() + 1))).toBeNull();
  });
});
