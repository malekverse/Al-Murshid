// Message catalogs, imported statically so both bundlers (Turbopack and Metro) include them.
// Add a namespace: create messages/<locale>/<ns>.json for every locale and list it here.

import arCommon from '../messages/ar/common.json';
import arComponents from '../messages/ar/components.json';
import arGallery from '../messages/ar/gallery.json';
import arGlossary from '../messages/ar/glossary.json';
import arShowcase from '../messages/ar/showcase.json';
import enCommon from '../messages/en/common.json';
import enComponents from '../messages/en/components.json';
import enGallery from '../messages/en/gallery.json';
import enGlossary from '../messages/en/glossary.json';
import enShowcase from '../messages/en/showcase.json';
import frCommon from '../messages/fr/common.json';
import frComponents from '../messages/fr/components.json';
import frGallery from '../messages/fr/gallery.json';
import frGlossary from '../messages/fr/glossary.json';
import frShowcase from '../messages/fr/showcase.json';
import type { Locale } from './locales';

/** The English catalog is the type reference; the i18n check keeps the others in sync. */
const en = {
  common: enCommon,
  components: enComponents,
  gallery: enGallery,
  glossary: enGlossary,
  showcase: enShowcase,
};
export type Messages = typeof en;

export const messages: Record<Locale, Messages> = {
  ar: {
    common: arCommon,
    components: arComponents,
    gallery: arGallery,
    glossary: arGlossary,
    showcase: arShowcase,
  },
  en,
  fr: {
    common: frCommon,
    components: frComponents,
    gallery: frGallery,
    glossary: frGlossary,
    showcase: frShowcase,
  },
};

export const namespaces = Object.keys(en) as (keyof Messages)[];

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
