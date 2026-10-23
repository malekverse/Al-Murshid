'use client';

import { periodSun, skyAt, type SunPosition } from '@murshid/tokens';
import { useReducedMotion } from 'motion/react';
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { StarField } from './star-field';

export interface SkyBackgroundProps {
  sun: SunPosition;
  /** Ramadan's lantern-lit nights (SPEC 5.8). */
  ramadan?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * The living sky (SPEC 5.1). Colors blend continuously from the sun altitude; the gradient
 * itself transitions slowly between updates. With Reduce Motion it becomes the static
 * gradient of the current period and the stars stop twinkling.
 */
export function SkyBackground({ sun, ramadan, className, children }: SkyBackgroundProps) {
  const reduce = useReducedMotion();
  const grainId = useId();
  const state = useMemo(() => {
    const live = skyAt(sun, { ramadan });
    return reduce ? skyAt(periodSun[live.period], { ramadan }) : live;
  }, [sun, reduce, ramadan]);

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
      <StarField opacity={state.stars} twinkle={!reduce} grainId={grainId} />
      <div className="relative">{children}</div>
    </div>
  );
}
