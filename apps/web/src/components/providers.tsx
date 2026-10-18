'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { ToastProvider } from './ui/toast';

/** Client-side app shell: Reduce Motion is honored by every Motion animation, and toasts. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
