import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { Providers } from './providers';

/**
 * What the interactive app needs on the client: every message of the language, Motion and toasts.
 * Light pages (Phase 6) do without; their islands load what they need (lazy-intl).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
