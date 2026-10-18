'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * The current time, ticking once per `intervalMs`. Null while the page renders on the server
 * and hydrates, so nothing time-based can mismatch. Re-renders only when the tick changes.
 */
export function useNow(intervalMs = 1000): Date | null {
  const tick = useSyncExternalStore(
    (onChange) => {
      // Poll a few times per interval so each tick lands close to its boundary.
      const id = setInterval(onChange, Math.max(50, intervalMs / 4));
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
  return useMemo(() => (tick === null ? null : new Date(tick)), [tick]);
}
