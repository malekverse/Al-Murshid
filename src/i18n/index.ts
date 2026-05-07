import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';

const resources = {
  en: { common: enCommon },
  ar: { common: arCommon }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: 'ar', // Arabic is the primary language
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    }
  });

/**
 * Initialize language from persisted storage on app startup.
 * This runs once and overrides the default if the user previously picked English.
 */
export async function initLanguageFromStorage() {
  try {
    const stored = await AsyncStorage.getItem('app-language');
    if (stored === 'ar' || stored === 'en') {
      i18n.changeLanguage(stored);
    }
  } catch {
    // Ignore — Arabic default is already set
  }
}

/**
 * Change the app language. Text changes instantly.
 * RTL layout direction is set for the next cold start.
 */
export function setAppLanguage(lang: 'en' | 'ar') {
  // 1. Change i18n language immediately (triggers re-renders in all useTranslation hooks)
  i18n.changeLanguage(lang);

  // 2. Persist the choice for next app launch
  AsyncStorage.setItem('app-language', lang).catch(() => {});

  // 3. Set native RTL direction (takes effect on next cold start)
  const isArabic = lang === 'ar';
  I18nManager.allowRTL(isArabic);
  I18nManager.forceRTL(isArabic);
}

export default i18n;
