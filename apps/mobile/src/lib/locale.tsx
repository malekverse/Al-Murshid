import {
  direction as directionOf,
  getMessages,
  intlLocale,
  isLocale,
  matchLocale,
  type Direction,
  type Locale,
} from '@murshid/i18n';
import { getCalendars, getLocales } from 'expo-localization';
import { createContext, use, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { IntlProvider } from 'use-intl';
import { keys, storage } from './storage';

interface LocaleState {
  locale: Locale;
  direction: Direction;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleState | null>(null);

function initialLocale(): Locale {
  const stored = storage.getString(keys.locale);
  if (isLocale(stored)) return stored;
  return matchLocale(getLocales().map((l) => l.languageTag));
}

/**
 * Keeps the native layout direction in step with the app language, for the next cold start
 * (headers, gestures and system UI read I18nManager when the app boots).
 */
function persistNativeDirection(locale: Locale) {
  const rtl = directionOf(locale) === 'rtl';
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

/**
 * App language and direction. Direction switches at runtime: expo-router's LocaleProvider
 * flips navigation, and the root view's `direction` style flips content (no reload).
 */
export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const value = initialLocale();
    persistNativeDirection(value);
    return value;
  });
  const region = getLocales()[0]?.regionCode;

  const setLocale = (next: Locale) => {
    storage.set(keys.locale, next);
    persistNativeDirection(next);
    setLocaleState(next);
  };

  return (
    <LocaleContext value={{ locale, direction: directionOf(locale), setLocale }}>
      <IntlProvider
        locale={intlLocale(locale, region)}
        messages={getMessages(locale)}
        timeZone={getCalendars()[0]?.timeZone ?? 'UTC'}
      >
        {children}
      </IntlProvider>
    </LocaleContext>
  );
}

export function useAppLocale(): LocaleState {
  const value = use(LocaleContext);
  if (!value) throw new Error('useAppLocale must be used inside AppLocaleProvider');
  return value;
}
