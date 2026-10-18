'use client';

import { spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useDirection } from '@/lib/use-direction';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. Use labelledBy when a visible title already names it. */
  label?: string;
  labelledBy?: string;
  disabled?: boolean;
}

// Track 56 x 32, thumb 24 with a 4 px inset: the thumb travels 24 px.
const TRAVEL = 24;

/** On/off switch. The thumb travels toward the reading end when on (mirrors in RTL). */
export function Toggle({ checked, onChange, label, labelledBy, disabled }: ToggleProps) {
  const reduce = useReducedMotion();
  const rtl = useDirection() === 'rtl';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      // The visible track is smaller than its 48 x 48 touch area.
      className="group inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={cn(
          'flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-(--duration-instant) ease-standard',
          // Off track keeps 3:1 against the surface (WCAG 1.4.11).
          checked ? 'bg-lantern' : 'bg-ink-muted/80',
        )}
      >
        <motion.span
          className="size-6 rounded-full bg-surface shadow-card dark:bg-ink"
          initial={false}
          animate={{ x: checked ? (rtl ? -TRAVEL : TRAVEL) : 0 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', ...spring.snappy }}
        />
      </span>
    </button>
  );
}
