'use client';

import { litBeads, tapTasbih } from '@murshid/core';
import { motion } from '@murshid/tokens';
import { useState, type CSSProperties } from 'react';

// The landing page's tasbih (SPEC 4): the same counting as Remember's, in a lighter ring drawn
// with CSS, so the page carries no animation library. It never stores anything.

const BEADS = 33;
const SIZE = 240;
const RADIUS = 104;

export function TasbihDemo({
  locale,
  label,
  hint,
}: {
  locale: string;
  /** "Count {count}", for screen readers. */
  label: string;
  hint: string;
}) {
  const [count, setCount] = useState(0);
  const lit = litBeads(count, BEADS);
  const format = new Intl.NumberFormat(locale);
  const display = locale.startsWith('ar') ? 'text-ar-display' : 'text-display';
  const callout = locale.startsWith('ar') ? 'text-ar-callout' : 'text-callout';

  return (
    <button
      type="button"
      onClick={() => setCount((c) => tapTasbih(c, BEADS).count)}
      aria-label={label.replace('{count}', format.format(count))}
      // Every pressable settles to the token's press scale (SPEC 6.4), here without a library.
      style={{ '--press': motion.pressScale } as CSSProperties}
      className="flex w-full select-none flex-col items-center gap-4 rounded-card p-4 outline-offset-4 transition-transform duration-(--duration-instant) ease-standard active:scale-(--press)"
    >
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: SIZE, height: SIZE }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          {Array.from({ length: BEADS }, (_, i) => {
            const angle = (i / BEADS) * 2 * Math.PI - Math.PI / 2;
            return (
              <circle
                key={i}
                // Rounded, so the server and the browser draw the same numbers.
                cx={Math.round((SIZE / 2 + RADIUS * Math.cos(angle)) * 100) / 100}
                cy={Math.round((SIZE / 2 + RADIUS * Math.sin(angle)) * 100) / 100}
                r={i === lit - 1 ? 7 : 5.5}
                className={`transition-[fill,r] duration-(--duration-quick) ${i < lit ? 'fill-lantern' : 'fill-hairline'}`}
              />
            );
          })}
        </svg>
        <span className={`absolute text-ink tabular-nums ${display}`}>{format.format(count)}</span>
      </span>
      <span className={`text-ink-muted ${callout}`}>{hint}</span>
    </button>
  );
}
