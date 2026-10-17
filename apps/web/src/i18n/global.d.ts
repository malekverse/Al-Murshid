import type { Locale, Messages } from '@murshid/i18n';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
