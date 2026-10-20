import type { Locale } from '@murshid/i18n';
import type { AbstractIntlMessages } from 'next-intl';

// The reader's messages (common, components, quran) in a language, loaded only when something on
// a light page needs them (Phase 6): the recitation player, or the full reader taking over.

const files = {
  ar: {
    common: () => import('@murshid/i18n/messages/ar/common.json'),
    components: () => import('@murshid/i18n/messages/ar/components.json'),
    quran: () => import('@murshid/i18n/messages/ar/quran.json'),
  },
  en: {
    common: () => import('@murshid/i18n/messages/en/common.json'),
    components: () => import('@murshid/i18n/messages/en/components.json'),
    quran: () => import('@murshid/i18n/messages/en/quran.json'),
  },
  fr: {
    common: () => import('@murshid/i18n/messages/fr/common.json'),
    components: () => import('@murshid/i18n/messages/fr/components.json'),
    quran: () => import('@murshid/i18n/messages/fr/quran.json'),
  },
} satisfies Record<Locale, Record<string, () => Promise<{ default: unknown }>>>;

const loads = new Map<Locale, Promise<AbstractIntlMessages>>();

/** The reader's messages in a language, loaded once. */
export function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  let p = loads.get(locale);
  if (!p) {
    p = Promise.all(
      Object.entries(files[locale]).map(
        async ([ns, load]) => [ns, (await load()).default] as const,
      ),
    ).then((entries) => Object.fromEntries(entries) as AbstractIntlMessages);
    p.catch(() => loads.delete(locale));
    loads.set(locale, p);
  }
  return p;
}
