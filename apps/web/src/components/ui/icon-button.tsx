'use client';

import type { Icon } from '@phosphor-icons/react';
import { motion as tokens, spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'plain' | 'tinted' | 'glass';

const variants: Record<Variant, string> = {
  plain: 'text-ink hover:bg-ink/5',
  tinted:
    'border border-hairline bg-surface text-ink shadow-card hover:bg-canvas dark:border-card-edge dark:shadow-none',
  glass: 'glass border border-hairline text-ink',
};

export interface IconButtonProps extends Omit<ComponentProps<typeof motion.button>, 'children'> {
  icon: Icon;
  /** Spoken by screen readers and shown as a tooltip. Required: icons alone are not labels. */
  label: string;
  variant?: Variant;
  /** Directional icons (back, chevrons) flip in RTL; clocks, checks and media controls never do. */
  mirror?: boolean;
}

/** A 48 x 48 round button holding one icon (SPEC 6.3 touch targets). */
export function IconButton({
  icon: IconComponent,
  label,
  variant = 'plain',
  mirror = false,
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      whileTap={disabled ? undefined : reduce ? { opacity: 0.7 } : { scale: tokens.pressScale }}
      transition={{ type: 'spring', ...spring.snappy }}
      className={cn(
        'inline-flex size-touch shrink-0 items-center justify-center rounded-full',
        'transition-colors duration-(--duration-instant) ease-standard',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        className,
      )}
      {...rest}
    >
      <IconComponent
        size={22}
        weight="regular"
        aria-hidden
        className={mirror ? 'rtl:-scale-x-100' : undefined}
      />
    </motion.button>
  );
}
