// Message catalogs, imported statically so both bundlers (Turbopack and Metro) include them.
// Add a namespace: create messages/<locale>/<ns>.json for every locale and list it here.

import arCommon from '../messages/ar/common.json';
import arGlossary from '../messages/ar/glossary.json';
import arShowcase from '../messages/ar/showcase.json';
import enCommon from '../messages/en/common.json';
import enGlossary from '../messages/en/glossary.json';
import enShowcase from '../messages/en/showcase.json';
import frCommon from '../messages/fr/common.json';
import frGlossary from '../messages/fr/glossary.json';
import frShowcase from '../messages/fr/showcase.json';
import type { Locale } from './locales';

/** The English catalog is the type reference; the i18n check keeps the others in sync. */
const en = { common: enCommon, glossary: enGlossary, showcase: enShowcase };
export type Messages = typeof en;

export const messages: Record<Locale, Messages> = {
  ar: { common: arCommon, glossary: arGlossary, showcase: arShowcase },
  en,
  fr: { common: frCommon, glossary: frGlossary, showcase: frShowcase },
};

export const namespaces = Object.keys(en) as (keyof Messages)[];

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
