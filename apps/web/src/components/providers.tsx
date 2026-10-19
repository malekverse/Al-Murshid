'use client';

import { SerwistProvider } from '@serwist/turbopack/react';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { ToastProvider } from './ui/toast';

/**
 * Client-side app shell: Reduce Motion is honored by every Motion animation, toasts, and the
 * service worker (production only), which also caches pages reached by in-app navigation so
 * surahs read here open offline.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== 'production'}
      cacheOnNavigation
    >
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </SerwistProvider>
  );
}
