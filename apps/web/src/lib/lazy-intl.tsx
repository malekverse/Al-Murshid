'use client';

import type { Locale } from '@murshid/i18n';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { loadMessages } from './lazy-messages';

// Messages for what a light page loads only when it is used (Phase 6): the recitation player and
// the full reader. Public pages render their words on the server and send no messages; these
// arrive with the code that needs them.

/** Its children, with the reader's messages, once they are in (nothing until then). */
export function LazyIntl({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);
  useEffect(() => {
    let live = true;
    void loadMessages(locale).then((m) => live && setMessages(m));
    return () => {
      live = false;
    };
  }, [locale]);
  if (!messages) return null;
  return (
    // As the server's request config: dates here are calendar-only.
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
