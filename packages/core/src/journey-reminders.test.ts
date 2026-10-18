import { describe, expect, it } from 'vitest';
import {
  heldOn,
  nextStep,
  previousStep,
  shouldReduceReminders,
  shouldWelcomeBack,
  startingPrayerStep,
  stepToOffer,
  type DayRecord,
} from './journey';
import { defaultSettings, prayerTimes, type Prayer } from './prayer-times';
import { defaultReminders, IOS_PENDING_LIMIT, PLAN_DAYS, planReminders } from './reminders';
import { addDays, type CivilDate } from './time';

const today: CivilDate = { year: 2026, month: 10, day: 18 };
const day = (offset: number, overrides: Partial<DayRecord> = {}): DayRecord => ({
  date: addDays(today, offset),
  prayers: [],
  morningAdhkar: false,
  eveningAdhkar: false,
  ayahsRead: 0,
  pagesRead: 0,
  khatmahPortionDone: false,
  tasbihAfterPrayer: false,
  rawatib: 0,
  ...overrides,
});
const five: Prayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

describe('journey: steps, never scores', () => {
  it('holds each prayer step only when its own bar is met', () => {
    expect(heldOn('prayer', 'one-prayer', day(0, { prayers: ['asr'] }), 'asr')).toBe(true);
    expect(heldOn('prayer', 'one-prayer', day(0, { prayers: ['dhuhr'] }), 'asr')).toBe(false);
    expect(heldOn('prayer', 'one-prayer', day(0, { prayers: ['dhuhr'] }))).toBe(true);
    expect(heldOn('prayer', 'two-prayers', day(0, { prayers: ['asr', 'asr'] }))).toBe(false);
    expect(heldOn('prayer', 'five-prayers', day(0, { prayers: five }))).toBe(true);
    expect(
      heldOn('prayer', 'five-and-adhkar', day(0, { prayers: five, morningAdhkar: true })),
    ).toBe(false);
    expect(heldOn('prayer', 'rawatib', day(0, { prayers: five, rawatib: 2 }))).toBe(true);
  });

  it('holds Quran and remembrance steps', () => {
    expect(heldOn('quran', 'one-ayah', day(0, { ayahsRead: 1 }))).toBe(true);
    expect(heldOn('quran', 'one-page', day(0, { ayahsRead: 5 }))).toBe(false);
    expect(heldOn('quran', 'khatmah', day(0, { khatmahPortionDone: true }))).toBe(true);
    expect(heldOn('remembrance', 'morning-adhkar', day(0, { morningAdhkar: true }))).toBe(true);
    expect(heldOn('remembrance', 'evening-adhkar', day(0, { eveningAdhkar: true }))).toBe(false);
    expect(
      heldOn('remembrance', 'evening-adhkar', day(0, { morningAdhkar: true, eveningAdhkar: true })),
    ).toBe(true);
    expect(
      heldOn(
        'remembrance',
        'tasbih-after-prayer',
        day(0, { morningAdhkar: true, eveningAdhkar: true, tasbihAfterPrayer: true }),
      ),
    ).toBe(true);
  });

  it('offers the next step after 5 of the last 7 days, never before', () => {
    const held = (n: number) => Array.from({ length: n }, (_, i) => day(-i, { prayers: ['asr'] }));
    expect(
      stepToOffer({
        track: 'prayer',
        step: 'one-prayer',
        today,
        days: held(5),
        focusPrayer: 'asr',
      }),
    ).toBe('two-prayers');
    expect(
      stepToOffer({
        track: 'prayer',
        step: 'one-prayer',
        today,
        days: held(4),
        focusPrayer: 'asr',
      }),
    ).toBeNull();
  });

  it('ignores days outside the 7-day window (past or future) and duplicate records', () => {
    const old = [
      day(-7, { prayers: ['asr'] }),
      day(-8, { prayers: ['asr'] }),
      day(1, { prayers: ['asr'] }),
    ];
    const recent = [0, -1, -2, -3].map((o) => day(o, { prayers: ['asr'] }));
    const quiet = day(-4);
    expect(
      stepToOffer({
        track: 'prayer',
        step: 'one-prayer',
        today,
        days: [...recent, ...old, recent[0]!, quiet],
      }),
    ).toBeNull();
  });

  it('stays quiet for a week after an offer, and offers nothing past the last step', () => {
    const days = Array.from({ length: 7 }, (_, i) => day(-i, { prayers: five }));
    expect(
      stepToOffer({
        track: 'prayer',
        step: 'five-prayers',
        today,
        days,
        lastOfferedOn: addDays(today, -3),
      }),
    ).toBeNull();
    expect(
      stepToOffer({
        track: 'prayer',
        step: 'five-prayers',
        today,
        days,
        lastOfferedOn: addDays(today, -7),
      }),
    ).toBe('five-and-adhkar');
    expect(stepToOffer({ track: 'quran', step: 'khatmah', today, days })).toBeNull();
  });

  it('steps forward and back without ever leaving the track', () => {
    expect(nextStep('quran', 'one-ayah')).toBe('one-page');
    expect(nextStep('remembrance', 'tasbih-after-prayer')).toBeNull();
    expect(previousStep('prayer', 'two-prayers')).toBe('one-prayer');
    expect(previousStep('prayer', 'one-prayer')).toBe('one-prayer');
  });

  it('maps the onboarding answer to a starting step only', () => {
    expect(startingPrayerStep('just-starting')).toBe('one-prayer');
    expect(startingPrayerStep('sometimes')).toBe('two-prayers');
    expect(startingPrayerStep('most-days')).toBe('five-prayers');
    expect(startingPrayerStep('all-five')).toBe('five-and-adhkar');
  });

  it('welcomes back after 3 days away, and reduces reminders after 5 ignored', () => {
    expect(shouldWelcomeBack(addDays(today, -3), today)).toBe(true);
    expect(shouldWelcomeBack(addDays(today, -2), today)).toBe(false);
    expect(shouldWelcomeBack(null, today)).toBe(false);
    expect(shouldReduceReminders(5)).toBe(true);
    expect(shouldReduceReminders(4)).toBe(false);
  });
});

describe('reminder plan', () => {
  const tunis = { latitude: 36.8065, longitude: 10.1815 };
  const days = Array.from({ length: PLAN_DAYS }, (_, i) =>
    prayerTimes(tunis, addDays(today, i), { ...defaultSettings, method: 'tunisia' }),
  );
  const morning = new Date(days[0]!.fajr.getTime() - 60 * 60_000);

  it('stays within the iOS pending limit even with every heads-up on', () => {
    const settings = Object.fromEntries(
      Object.entries(defaultReminders).map(([k, v]) => [k, { ...v, before: 10 }]),
    ) as typeof defaultReminders;
    const plan = planReminders({ now: morning, days, settings });
    expect(plan.length).toBeLessThanOrEqual(IOS_PENDING_LIMIT);
    expect(plan.length).toBe(PLAN_DAYS * 5 * 2);
    expect(new Set(plan.map((n) => n.id)).size).toBe(plan.length);
    expect(plan.map((n) => n.at.getTime())).toEqual(
      [...plan.map((n) => n.at.getTime())].sort((a, b) => a - b),
    );
  });

  it('drops past times, "off" prayers and caps the count nearest-first', () => {
    const afternoon = new Date(days[0]!.asr.getTime() + 60_000);
    const settings = { ...defaultReminders, dhuhr: { style: 'off' as const, before: null } };
    const plan = planReminders({ now: afternoon, days, settings, limit: 3 });
    expect(plan.map((n) => n.prayer)).toEqual(['maghrib', 'isha', 'fajr']);
  });

  it('keeps heads-ups quiet, clamps them to 5-30 minutes and never lets them log a prayer', () => {
    const settings = { ...defaultReminders, asr: { style: 'adhan' as const, before: 90 } };
    const plan = planReminders({ now: morning, days: days.slice(0, 1), settings });
    const before = plan.find((n) => n.prayer === 'asr' && n.kind === 'before')!;
    expect(before.style).toBe('soft');
    expect(before.canLog).toBe(false);
    expect((days[0]!.asr.getTime() - before.at.getTime()) / 60_000).toBe(30);
  });

  it('keeps a soft or silent heads-up as chosen, and skips a time that could not be computed', () => {
    const settings = {
      ...defaultReminders,
      asr: { style: 'silent' as const, before: 10 },
      maghrib: { style: 'soft' as const, before: 1 },
    };
    const broken = { ...days[0]!, isha: new Date(Number.NaN) };
    const plan = planReminders({ now: morning, days: [broken], settings });
    expect(plan.find((n) => n.prayer === 'asr' && n.kind === 'before')!.style).toBe('silent');
    const maghrib = plan.find((n) => n.prayer === 'maghrib' && n.kind === 'before')!;
    expect(maghrib.style).toBe('soft');
    expect((days[0]!.maghrib.getTime() - maghrib.at.getTime()) / 60_000).toBe(5);
    expect(plan.some((n) => n.prayer === 'isha')).toBe(false);
  });

  it('reduces quietly to the focus prayer, opens Fajr and Isha in dark, and marks Jumu’ah', () => {
    const reduced = planReminders({
      now: morning,
      days,
      settings: defaultReminders,
      reducedTo: 'isha',
    });
    expect(new Set(reduced.map((n) => n.prayer))).toEqual(new Set(['isha']));
    expect(reduced.every((n) => n.openInDark)).toBe(true);
    const friday = [
      prayerTimes(
        tunis,
        { year: 2026, month: 10, day: 16 },
        { ...defaultSettings, method: 'tunisia' },
      ),
    ];
    const plan = planReminders({
      now: new Date(friday[0]!.fajr.getTime() - 1),
      days: friday,
      settings: defaultReminders,
    });
    expect(plan.find((n) => n.prayer === 'dhuhr')!.jumuah).toBe(true);
    expect(plan.find((n) => n.prayer === 'asr')!.jumuah).toBe(false);
  });
});
