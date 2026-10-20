'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { ToastProvider } from './ui/toast';

/**
 * The interactive app's client setup: Reduce Motion is honored by every Motion animation, and
 * toasts. Light pages (Phase 6) go without both.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
