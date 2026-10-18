'use client';

import { periodSun, skyAt, starlight, type SunPosition } from '@murshid/tokens';
import { useReducedMotion } from 'motion/react';
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

// Deterministic star field: the same sky on every render and on the server.
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rand = seeded(1447);
  // Rounded so server and browser produce identical markup (Math.pow differs in the last bits).
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return Array.from({ length: 90 }, () => ({
    x: r2(rand() * 100),
    // Stars thin out toward the horizon.
    y: r2(rand() ** 1.6 * 70),
    r: r2(0.4 + rand() * 1.1),
    o: r2(0.35 + rand() * 0.65),
    twinkle: rand() < 0.2,
    delay: r2(rand()),
  }));
})();

export interface SkyBackgroundProps {
  sun: SunPosition;
  className?: string;
  children?: ReactNode;
}

/**
 * The living sky (SPEC 5.1). Colors blend continuously from the sun altitude; the gradient
 * itself transitions slowly between updates. With Reduce Motion it becomes the static
 * gradient of the current period and the stars stop twinkling.
 */
export function SkyBackground({ sun, className, children }: SkyBackgroundProps) {
  const reduce = useReducedMotion();
  const grainId = useId();
  const state = useMemo(() => {
    const live = skyAt(sun);
    return reduce ? skyAt(periodSun[live.period]) : live;
  }, [sun, reduce]);

  const style = {
    '--sky-top': state.top,
    '--sky-bottom': state.bottom,
    backgroundImage: 'linear-gradient(to bottom, var(--sky-top), var(--sky-bottom))',
    transition: reduce
      ? undefined
      : '--sky-top var(--duration-ambient) var(--ease-standard), --sky-bottom var(--duration-ambient) var(--ease-standard)',
  } as CSSProperties;

  return (
    <div className={cn('relative isolate overflow-hidden', className)} style={style}>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        style={{
          opacity: state.stars,
          transition: reduce ? undefined : 'opacity var(--duration-ambient) var(--ease-standard)',
        }}
      >
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill={starlight}
            opacity={s.o}
            style={
              s.twinkle && !reduce
                ? {
                    animation: `murshid-twinkle calc(var(--duration-ambient) * 4) ease-in-out infinite`,
                    animationDelay: `calc(var(--duration-ambient) * ${(s.delay * 4).toFixed(2)})`,
                  }
                : undefined
            }
          />
        ))}
      </svg>
      {/* Fine grain keeps long gradients from banding on 8-bit screens. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-[0.06] mix-blend-overlay"
      >
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
