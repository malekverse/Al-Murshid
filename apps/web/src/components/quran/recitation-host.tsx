'use client';

import type { Locale } from '@murshid/i18n';
import { usePathname } from 'next/navigation';
import { lazy, Suspense } from 'react';
import { usePlayerWanted } from './recitation-store';

// The recitation player and its bar, at the root so listening carries on from page to page
// (SPEC 5.5), loaded only once a screen first asks to play (Phase 6: public pages stay light).
// Everything it needs, its messages and Motion included, comes with it.

const Ui = lazy(() => import('./recitation-ui').then((m) => ({ default: m.RecitationUi })));

export function RecitationHost({ locale }: { locale: Locale }) {
  const wanted = usePlayerWanted();
  const pathname = usePathname();
  if (!wanted) return null;
  // Reading a surah or a page fills small screens: no tab bar below the audio bar there.
  const reading = /^\/[a-z]{2}\/quran\/.+/.test(pathname);
  return (
    <Suspense fallback={null}>
      <Ui
        locale={locale}
        barClassName={
          reading
            ? 'bottom-0 mb-[env(safe-area-inset-bottom)] lg:start-24'
            : 'bottom-16 lg:start-24 lg:bottom-0'
        }
      />
    </Suspense>
  );
}
