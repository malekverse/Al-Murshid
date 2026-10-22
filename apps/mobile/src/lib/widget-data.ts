import { civilDate, sunPosition, toHijri, widgetPrayers, type CivilDate } from '@murshid/core';
import { placeOf, prayerSettings, type Settings } from '@murshid/data';
import { getMessages, intlLocale, type Locale } from '@murshid/i18n';
import { colors, glassToneFor, skyAt } from '@murshid/tokens';
import { getLocales } from 'expo-localization';
import { createFormatter, createTranslator } from 'use-intl';

// What the widgets show (SPEC 5.9), computed once by the app for the coming week: every prayer's
// name and time already in the person's language and digits, the minute labels with their plurals,
// and the sky every half hour. A widget then only finds the entry for "now", offline.

export const WIDGET_DAYS = 7;
const SKY_STEP_MINUTES = 30;
/** Where the countdown goes in the "in {time}" text. */
export const COUNTDOWN_SLOT = '%T%';

export interface WidgetRow {
  /** Epoch milliseconds. */
  at: number;
  name: string;
  time: string;
}

export interface WidgetSky {
  from: number;
  top: string;
  bottom: string;
  ink: string;
  muted: string;
  accent: string;
}

export interface WidgetData {
  v: 1;
  rtl: boolean;
  /** The locale's digits, 0 to 9, for the countdown the widget formats itself. */
  digits: string;
  text: {
    next: string;
    /** "in %T%" */
    in: string;
    empty: string;
    /** The label for 1 to 59 minutes; index 0 is unused. */
    minutes: string[];
  };
  /** Each day's five prayers, in order. */
  days: WidgetRow[][];
  sky: WidgetSky[];
}

export function widgetData(
  settings: Settings,
  locale: Locale,
  now = new Date(),
): WidgetData | null {
  const place = placeOf(settings);
  if (!place || !settings.onboarded) return null;
  const intl = intlLocale(locale, getLocales()[0]?.regionCode);
  const t = createTranslator({ locale: intl, messages: getMessages(locale) });
  const format = createFormatter({ locale: intl, timeZone: place.timeZone });
  const today = civilDate(now, place.timeZone);
  const prayers = widgetPrayers(place, prayerSettings(settings), today, WIDGET_DAYS);
  const number = new Intl.NumberFormat(intl, { useGrouping: false });

  const days: WidgetRow[][] = [];
  prayers.forEach((p, i) => {
    const row = {
      at: p.at.getTime(),
      name: t(`glossary.prayer.${p.jumuah ? 'jumuah' : p.prayer}`),
      time: format.dateTime(p.at, { hour: 'numeric', minute: '2-digit' }),
    };
    (days[Math.floor(i / 5)] ??= []).push(row);
  });

  // Ramadan's nights keep their lantern-lit sky (SPEC 5.8), by the Hijri date of each day.
  const ramadanDay = (date: CivilDate) =>
    settings.ramadanMode && toHijri(date, settings.hijriOffset).month === 9;
  const start = Math.floor(now.getTime() / (SKY_STEP_MINUTES * 60_000)) * SKY_STEP_MINUTES * 60_000;
  const steps = (WIDGET_DAYS * 24 * 60) / SKY_STEP_MINUTES;
  const sky: WidgetSky[] = Array.from({ length: steps }, (_, i) => {
    const at = new Date(start + i * SKY_STEP_MINUTES * 60_000);
    const state = skyAt(sunPosition(at, place), {
      ramadan: ramadanDay(civilDate(at, place.timeZone)),
    });
    const tone = colors[glassToneFor(state.bottom)];
    return {
      from: at.getTime(),
      top: state.top,
      bottom: state.bottom,
      ink: tone.ink,
      muted: tone.inkMuted,
      accent: tone.lanternInk,
    };
  });

  return {
    v: 1,
    rtl: locale === 'ar',
    digits: Array.from({ length: 10 }, (_, d) => number.format(d)).join(''),
    text: {
      next: t('widgets.next'),
      in: t('widgets.in', { time: COUNTDOWN_SLOT }),
      empty: t('widgets.empty'),
      minutes: Array.from({ length: 60 }, (_, n) =>
        n === 0 ? '' : t('common.time.minutes', { count: n }),
      ),
    },
    days,
    sky,
  };
}
