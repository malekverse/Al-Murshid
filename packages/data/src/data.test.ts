import { describe, expect, it } from 'vitest';
import { liveLogs, logKey, newLog, prayerLogSchema } from './prayer-log';
import {
  answerStepOffer,
  defaultSettings,
  dismissCard,
  dismissedToday,
  isWelcomeBack,
  journeyFocus,
  locationFromCity,
  locationLabel,
  markOpened,
  parseSettings,
  placeOf,
  prayerSettings,
  previousVisit,
  withLocation,
  withMethod,
  withStartingPoint,
  type LocationSetting,
} from './settings';

const today = { year: 2026, month: 10, day: 18 };
const tunis: LocationSetting = {
  label: 'Tunis',
  countryCode: 'TN',
  latitude: 36.8065,
  longitude: 10.1815,
  timeZone: 'Africa/Tunis',
  source: 'city',
  cityId: 2464470,
};

describe('settings', () => {
  it('starts from calm defaults: not onboarded, no location, one prayer at Maghrib', () => {
    const s = defaultSettings();
    expect(s).toMatchObject({ onboarded: false, location: null, method: 'mwl', hijriOffset: 0 });
    expect(s.journey.prayer).toEqual({ step: 'one-prayer', focusPrayer: 'maghrib' });
    expect(s.reminders.fajr).toEqual({ style: 'adhan', before: null });
    expect(placeOf(s)).toBeNull();
  });

  it('keeps every valid field when one stored field is damaged', () => {
    const s = parseSettings({ onboarded: true, hijriOffset: 7, method: 'nope', location: tunis });
    expect(s.onboarded).toBe(true);
    expect(s.hijriOffset).toBe(0);
    expect(s.method).toBe('mwl');
    expect(s.location).toEqual(tunis);
    expect(parseSettings(null)).toEqual(defaultSettings());
    expect(parseSettings('garbage')).toEqual(defaultSettings());
  });

  it("follows the location's country until the person picks a method", () => {
    const s = withLocation(defaultSettings(), tunis);
    expect(s.method).toBe('tunisia');
    expect(placeOf(s)).toEqual({ latitude: 36.8065, longitude: 10.1815, timeZone: 'Africa/Tunis' });
    const chosen = withMethod(s, 'mwl');
    expect(withLocation(chosen, { ...tunis, countryCode: 'EG' }).method).toBe('mwl');
    expect(prayerSettings(chosen)).toEqual({
      method: 'mwl',
      asr: 'standard',
      highLatitude: 'auto',
      adjustments: {},
    });
  });

  it('sets only the starting prayer step from onboarding', () => {
    const s = withStartingPoint(defaultSettings(), 'most-days');
    expect(s.journey.prayer.step).toBe('five-prayers');
    expect(s.journey.quran).toBeNull();
  });

  it('lists each active track for the Journey', () => {
    const s = parseSettings({
      journey: {
        prayer: { step: 'two-prayers', focusPrayer: 'asr', lastOfferedOn: '2026-10-10' },
        quran: { step: 'one-ayah' },
        remembrance: { step: 'morning-adhkar', lastOfferedOn: '2026-10-01' },
      },
    });
    expect(journeyFocus(s)).toEqual([
      {
        track: 'prayer',
        step: 'two-prayers',
        focusPrayer: 'asr',
        lastOfferedOn: { year: 2026, month: 10, day: 10 },
      },
      { track: 'quran', step: 'one-ayah', lastOfferedOn: undefined },
      {
        track: 'remembrance',
        step: 'morning-adhkar',
        lastOfferedOn: { year: 2026, month: 10, day: 1 },
      },
    ]);
    expect(journeyFocus(defaultSettings())).toHaveLength(1);
  });

  it('answers a step offer either way, then waits a quiet week', () => {
    const s = defaultSettings();
    const yes = answerStepOffer(s, 'prayer', 'two-prayers', true, today);
    expect(yes.journey.prayer).toMatchObject({ step: 'two-prayers', lastOfferedOn: '2026-10-18' });
    const no = answerStepOffer(s, 'prayer', 'two-prayers', false, today);
    expect(no.journey.prayer).toMatchObject({ step: 'one-prayer', lastOfferedOn: '2026-10-18' });
    expect(answerStepOffer(s, 'quran', 'one-page', true, today)).toBe(s);
  });

  it('remembers the visit before today for "Welcome back"', () => {
    let s = parseSettings({ lastOpenedOn: '2026-10-14' });
    expect(isWelcomeBack(s, today)).toBe(true);
    s = markOpened(s, today);
    expect(s).toMatchObject({ lastOpenedOn: '2026-10-18', previousOpenedOn: '2026-10-14' });
    expect(isWelcomeBack(s, today)).toBe(true);
    expect(markOpened(s, today)).toBe(s);
    expect(previousVisit(defaultSettings(), today)).toBeNull();
    expect(isWelcomeBack(markOpened(defaultSettings(), today), today)).toBe(false);
  });

  it('names the location in the UI language', () => {
    const named = { ...tunis, names: { ar: 'تونس', fr: 'Tunis' } };
    expect(locationLabel(named, 'ar')).toBe('تونس');
    expect(locationLabel(named, 'en-GB')).toBe('Tunis');
    expect(locationLabel(tunis, 'ar')).toBe('Tunis');
  });

  it('builds a location from a city or from a device position', () => {
    const city = {
      id: 360630,
      name: 'Cairo',
      names: { ar: 'القاهرة', fr: 'Le Caire' },
      countryCode: 'EG',
      latitude: 30.044,
      longitude: 31.236,
      timeZone: 'Africa/Cairo',
    };
    expect(locationFromCity(city)).toEqual({
      label: 'Cairo',
      countryCode: 'EG',
      latitude: 30.044,
      longitude: 31.236,
      timeZone: 'Africa/Cairo',
      source: 'city',
      cityId: 360630,
      names: { en: 'Cairo', ar: 'القاهرة', fr: 'Le Caire' },
    });
    const device = locationFromCity(
      { ...city, names: {} },
      { latitude: 30.12345, longitude: 31.98765 },
    );
    expect(device).toMatchObject({
      source: 'device',
      latitude: 30.123,
      longitude: 31.988,
      names: { en: 'Cairo' },
    });
  });

  it('sets cards aside for today only', () => {
    let s = dismissCard(defaultSettings(), 'welcome-back', today);
    s = dismissCard(s, 'jumuah', today);
    s = dismissCard(s, 'jumuah', today);
    expect(dismissedToday(s, today)).toEqual(['welcome-back', 'jumuah']);
    expect(dismissedToday(s, { ...today, day: 19 })).toEqual([]);
    expect(dismissCard(s, 'jumuah', { ...today, day: 19 }).dismissedCards).toEqual({
      date: '2026-10-19',
      kinds: ['jumuah'],
    });
  });
});

describe('prayer logs', () => {
  it('builds valid logs and reads only live ones', () => {
    const at = new Date('2026-10-18T12:00:00Z');
    const log = newLog(today, 'asr', 'notification', at);
    expect(prayerLogSchema.parse(log)).toEqual({
      date: '2026-10-18',
      prayer: 'asr',
      loggedAt: '2026-10-18T12:00:00.000Z',
      source: 'notification',
      deleted: false,
    });
    expect(liveLogs([log, { ...log, prayer: 'fajr', deleted: true }])).toEqual([
      { date: '2026-10-18', prayer: 'asr' },
    ]);
    expect(logKey(today, 'asr')).toBe('2026-10-18:asr');
    expect(logKey('2026-10-18', 'asr')).toBe('2026-10-18:asr');
    expect(newLog(today, 'fajr', 'app').source).toBe('app');
  });
});
