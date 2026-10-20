'use client';

import type { SurahName, SurahText, SurahTranslation } from '@murshid/content/quran';
import type { Locale } from '@murshid/i18n';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { Providers } from '@/components/providers';
import type { ReaderIntent } from './reader-intent';
import { SurahReader } from './surah-reader';

export interface UpgradedReaderProps {
  locale: Locale;
  messages: AbstractIntlMessages;
  surah: number;
  startAyah?: number;
  intent: ReaderIntent | null;
  initial: {
    text: SurahText;
    name: SurahName;
    translation: { lang: 'en' | 'fr'; data: SurahTranslation } | null;
  };
}

/** The full reader, with what it needs on the client, taking over a surah page (Phase 6). */
export function UpgradedReader({ locale, messages, ...reader }: UpgradedReaderProps) {
  return (
    // As the server's request config: dates here are calendar-only.
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <Providers>
        <SurahReader {...reader} />
      </Providers>
    </NextIntlClientProvider>
  );
}
