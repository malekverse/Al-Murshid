import { describe, expect, it } from 'vitest';
import { ramadanLogSchema, withFasted, withTaraweeh } from './ramadan-log';
import { defaultSettings } from './settings';

const day = { year: 2027, month: 2, day: 8 };
const now = new Date('2027-02-08T12:00:00Z');

describe('Ramadan logs', () => {
  it('records a fast as "fasted" or "not today", and the same answer again clears it', () => {
    const fasted = withFasted(undefined, day, true, now);
    expect(fasted).toEqual({
      date: '2027-02-08',
      fasted: true,
      taraweeh: false,
      updatedAt: now.toISOString(),
    });
    expect(ramadanLogSchema.parse(fasted)).toEqual(fasted);
    expect(withFasted(fasted, day, false, now).fasted).toBe(false);
    expect(withFasted(fasted, day, true, now).fasted).toBeNull();
  });

  it('records that evening’s Taraweeh without touching the fast', () => {
    const both = withTaraweeh(withFasted(undefined, day, true, now), day, true, now);
    expect(both).toMatchObject({ fasted: true, taraweeh: true });
    expect(withTaraweeh(both, day, false, now)).toMatchObject({ fasted: true, taraweeh: false });
    expect(withTaraweeh(undefined, day, true).taraweeh).toBe(true);
  });

  it('Ramadan mode is on unless turned off', () => {
    expect(defaultSettings().ramadanMode).toBe(true);
  });
});
