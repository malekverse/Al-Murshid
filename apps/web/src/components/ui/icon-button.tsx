'use client';

import type { Icon } from '@phosphor-icons/react';
import { motion as tokens, spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import type { ComponentProps } from 'react';
import {
  ICON_SIZE,
  iconButtonClass,
  type IconButtonVariant as Variant,
} from '@/components/quran/reader-markup';

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
      className={iconButtonClass(variant, className)}
      {...rest}
    >
      <IconComponent
        size={ICON_SIZE}
        weight="regular"
        aria-hidden
        className={mirror ? 'rtl:-scale-x-100' : undefined}
      />
    </motion.button>
  );
}
