'use client';

import { SerwistProvider } from '@serwist/turbopack/react';
import type { ReactNode } from 'react';

/**
 * The service worker (production only), on every page: it also caches pages reached by in-app
 * navigation, so surahs read here open offline.
 */
export function ServiceWorker({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== 'production'}
      cacheOnNavigation
    >
      {children}
    </SerwistProvider>
  );
}
