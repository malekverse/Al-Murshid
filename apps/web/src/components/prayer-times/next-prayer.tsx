'use client';

import { useEffect, useState } from 'react';

// The next prayer's countdown on a city's public page (Phase 6): the page is cached for an hour,
// so the visitor's own clock picks the next prayer and the time left, minute by minute. Its line
// keeps its height before then, so nothing moves when it appears.

/** "1 hour, 20 minutes", in the page's language. */
function duration(minutes: number, locale: string): string {
  const unit = (value: number, unit: 'hour' | 'minute') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [h > 0 && unit(h, 'hour'), (m > 0 || h === 0) && unit(m, 'minute')].filter(
    (p): p is string => Boolean(p),
  );
  return new Intl.ListFormat(locale, { style: 'long', type: 'unit' }).format(parts);
}

export function NextPrayer({
  locale,
  prayers,
  template,
  className,
}: {
  locale: string;
  /** Today's prayers and tomorrow's Fajr, in order: name and instant (ISO). */
  prayers: { name: string; at: string }[];
  /** "Next: {prayer} in {duration}", in the page's language. */
  template: string;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const next = now === null ? null : prayers.find((p) => Date.parse(p.at) > now);
  return (
    <p className={className} aria-live="polite">
      {next && now !== null
        ? template
            .replace('{prayer}', next.name)
            .replace(
              '{duration}',
              duration(Math.max(1, Math.ceil((Date.parse(next.at) - now) / 60_000)), locale),
            )
        : ' '}
    </p>
  );
}
