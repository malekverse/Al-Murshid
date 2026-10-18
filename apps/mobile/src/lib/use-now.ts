import { useMemo, useSyncExternalStore } from 'react';

/** The current time, ticking once per `intervalMs`; re-renders only when the tick changes. */
export function useNow(intervalMs = 1000): Date {
  const tick = useSyncExternalStore(
    (onChange) => {
      // Poll a few times per interval so each tick lands close to its boundary.
      const id = setInterval(onChange, Math.max(50, intervalMs / 4));
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
  );
  return useMemo(() => new Date(tick), [tick]);
}
