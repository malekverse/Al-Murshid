'use client';

import { spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';

const SIZE = 288;
const RADIUS = 128;

/**
 * Tasbih's ring of beads (SPEC 6.4): each tap lights the next bead, which settles with a snappy
 * spring. It runs clockwise from the top and is never mirrored: like the progress ring and a
 * clock face, its direction is not a reading direction (SPEC 7).
 */
export function BeadRing({
  beads,
  lit,
  complete,
  className = 'size-72',
}: {
  beads: number;
  lit: number;
  complete: boolean;
  /** Its size (classes), 288 px by default. */
  className?: string;
}) {
  const reduce = useReducedMotion();
  const bead = beads <= 33 ? 7 : beads <= 66 ? 4.5 : 3.5;
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className={className}>
      {Array.from({ length: beads }, (_, i) => {
        const angle = (i / beads) * 2 * Math.PI - Math.PI / 2;
        const cx = SIZE / 2 + RADIUS * Math.cos(angle);
        const cy = SIZE / 2 + RADIUS * Math.sin(angle);
        const on = i < lit;
        const latest = on && i === lit - 1 && !complete;
        return (
          <motion.circle
            key={latest ? `latest-${lit}` : i}
            cx={cx}
            cy={cy}
            r={bead}
            className={on ? 'fill-lantern' : 'fill-hairline'}
            initial={latest && !reduce ? { scale: 1.8 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', ...spring.snappy }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        );
      })}
    </svg>
  );
}
