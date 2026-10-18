import type { HijriDate, Prayer, Step, TimeName } from '@murshid/core';
import { messages } from '@murshid/i18n';
import { useFormatter, useTranslations } from 'use-intl';

type MonthKey = keyof (typeof messages)['en']['glossary']['hijriMonths'];

/** "26 Rabi' al-Thani 1448 AH", with the person's digits. */
export function useHijriFormat() {
  const t = useTranslations('glossary');
  const format = useFormatter();
  return (h: HijriDate) =>
    t('hijriDate', {
      day: format.number(h.day),
      month: t(`hijriMonths.${String(h.month) as MonthKey}`),
      year: format.number(h.year, { useGrouping: false }),
    });
}

export function useHijriMonthName() {
  const t = useTranslations('glossary');
  return (month: number) => t(`hijriMonths.${String(month) as MonthKey}`);
}

/** A clock time in the place's own time zone (a chosen city can be far from this phone). */
export function useTimeFormat(timeZone: string) {
  const format = useFormatter();
  return (date: Date) => format.dateTime(date, { hour: 'numeric', minute: '2-digit', timeZone });
}

/** The prayer's name in the UI language, with Jumu'ah on Friday's Dhuhr. */
export function usePrayerName() {
  const t = useTranslations('glossary.prayer');
  return (name: TimeName, jumuah = false) => t(jumuah && name === 'dhuhr' ? 'jumuah' : name);
}

/** The Arabic name, shown with every prayer whatever the UI language (SPEC 5.1). */
export function arabicPrayerName(name: TimeName, jumuah = false): string {
  return messages.ar.glossary.prayer[jumuah && name === 'dhuhr' ? 'jumuah' : name];
}

/** "Two prayers a day", "Asr, every day". */
export function useStepLabel() {
  const t = useTranslations('journey.steps');
  const prayerName = usePrayerName();
  return (step: Step, focusPrayer?: Prayer) =>
    step === 'one-prayer'
      ? t('one-prayer', { prayer: prayerName(focusPrayer ?? 'maghrib') })
      : t(step as Exclude<Step, 'one-prayer'>);
}

/** Country names come from Intl (polyfilled on Hermes), in the UI language. */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
