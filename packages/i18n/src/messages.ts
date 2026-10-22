// Message catalogs, imported statically so both bundlers (Turbopack and Metro) include them.
// Add a namespace: create messages/<locale>/<ns>.json for every locale and list it here.

import arCalendar from '../messages/ar/calendar.json';
import arCommon from '../messages/ar/common.json';
import arComponents from '../messages/ar/components.json';
import arGallery from '../messages/ar/gallery.json';
import arGlossary from '../messages/ar/glossary.json';
import arJourney from '../messages/ar/journey.json';
import arReflection from '../messages/ar/reflection.json';
import arRemember from '../messages/ar/remember.json';
import arNotifications from '../messages/ar/notifications.json';
import arOnboarding from '../messages/ar/onboarding.json';
import arPlaces from '../messages/ar/places.json';
import arQibla from '../messages/ar/qibla.json';
import arQuran from '../messages/ar/quran.json';
import arSettings from '../messages/ar/settings.json';
import arShowcase from '../messages/ar/showcase.json';
import arSky from '../messages/ar/sky.json';
import arToday from '../messages/ar/today.json';
import enCalendar from '../messages/en/calendar.json';
import enCommon from '../messages/en/common.json';
import enComponents from '../messages/en/components.json';
import enGallery from '../messages/en/gallery.json';
import enGlossary from '../messages/en/glossary.json';
import enJourney from '../messages/en/journey.json';
import enReflection from '../messages/en/reflection.json';
import enRemember from '../messages/en/remember.json';
import enNotifications from '../messages/en/notifications.json';
import enOnboarding from '../messages/en/onboarding.json';
import enPlaces from '../messages/en/places.json';
import enQibla from '../messages/en/qibla.json';
import enQuran from '../messages/en/quran.json';
import enSettings from '../messages/en/settings.json';
import enShowcase from '../messages/en/showcase.json';
import enSky from '../messages/en/sky.json';
import enToday from '../messages/en/today.json';
import frCalendar from '../messages/fr/calendar.json';
import frCommon from '../messages/fr/common.json';
import frComponents from '../messages/fr/components.json';
import frGallery from '../messages/fr/gallery.json';
import frGlossary from '../messages/fr/glossary.json';
import frJourney from '../messages/fr/journey.json';
import frReflection from '../messages/fr/reflection.json';
import frRemember from '../messages/fr/remember.json';
import frNotifications from '../messages/fr/notifications.json';
import frOnboarding from '../messages/fr/onboarding.json';
import frPlaces from '../messages/fr/places.json';
import frQibla from '../messages/fr/qibla.json';
import frQuran from '../messages/fr/quran.json';
import frSettings from '../messages/fr/settings.json';
import frShowcase from '../messages/fr/showcase.json';
import frSky from '../messages/fr/sky.json';
import frToday from '../messages/fr/today.json';
import type { Locale } from './locales';

/** The English catalog is the type reference; the i18n check keeps the others in sync. */
const en = {
  calendar: enCalendar,
  common: enCommon,
  components: enComponents,
  gallery: enGallery,
  glossary: enGlossary,
  journey: enJourney,
  reflection: enReflection,
  remember: enRemember,
  notifications: enNotifications,
  onboarding: enOnboarding,
  places: enPlaces,
  qibla: enQibla,
  quran: enQuran,
  settings: enSettings,
  showcase: enShowcase,
  sky: enSky,
  today: enToday,
};
export type Messages = typeof en;

export const messages: Record<Locale, Messages> = {
  ar: {
    calendar: arCalendar,
    common: arCommon,
    components: arComponents,
    gallery: arGallery,
    glossary: arGlossary,
    journey: arJourney,
    reflection: arReflection,
    remember: arRemember,
    notifications: arNotifications,
    onboarding: arOnboarding,
    places: arPlaces,
    qibla: arQibla,
    quran: arQuran,
    settings: arSettings,
    showcase: arShowcase,
    sky: arSky,
    today: arToday,
  },
  en,
  fr: {
    calendar: frCalendar,
    common: frCommon,
    components: frComponents,
    gallery: frGallery,
    glossary: frGlossary,
    journey: frJourney,
    reflection: frReflection,
    remember: frRemember,
    notifications: frNotifications,
    onboarding: frOnboarding,
    places: frPlaces,
    qibla: frQibla,
    quran: frQuran,
    settings: frSettings,
    showcase: frShowcase,
    sky: frSky,
    today: frToday,
  },
};

export const namespaces = Object.keys(en) as (keyof Messages)[];

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
