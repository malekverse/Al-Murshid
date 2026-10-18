'use client';

import { spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ProgressRingProps {
  /** 0 to 1. */
  progress: number;
  /** Diameter in px. */
  size?: number;
  stroke?: number;
  label: string;
  /** Read aloud, e.g. "12 of 33". */
  valueText?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * A ring that fills clockwise from the top. Never mirrored in RTL: like a clock face,
 * its direction is not a reading direction (SPEC 7).
 */
export function ProgressRing({
  progress,
  size = 56,
  stroke = 4,
  label,
  valueText,
  children,
  className,
}: ProgressRingProps) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuetext={valueText}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-lantern"
          initial={false}
          animate={{ pathLength: clamped, opacity: clamped === 0 ? 0 : 1 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', ...spring.gentle }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
