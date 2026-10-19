'use client';

import type { ReadingTheme } from '@murshid/data';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The reader's page color (SPEC 5.5): like the app, or light, sepia or dark whatever the app
 * theme. A data-theme scope redefines the color tokens inside it.
 */
export function ReadingSurface({
  theme,
  className,
  children,
}: {
  theme: ReadingTheme;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-theme={theme === 'app' ? undefined : theme}
      className={cn('min-h-dvh bg-canvas text-ink', className)}
    >
      {children}
    </div>
  );
}
