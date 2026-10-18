'use client';

import { duration, motion as tokens, spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useScript } from '@/lib/use-direction';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-lantern text-on-lantern shadow-card hover:bg-lantern/90',
  secondary:
    'border border-hairline bg-surface text-ink shadow-card hover:bg-canvas dark:border-card-edge dark:shadow-none',
  ghost: 'text-lantern-ink hover:bg-lantern/10',
};

const sizes: Record<Size, { box: string; latin: string; arabic: string }> = {
  md: { box: 'min-h-touch px-6 gap-2', latin: 'text-callout', arabic: 'text-ar-callout' },
  lg: { box: 'min-h-16 w-full px-8 gap-3', latin: 'text-headline', arabic: 'text-ar-headline' },
};

export interface ButtonProps extends Omit<ComponentProps<typeof motion.button>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/** Calm, pill-shaped button. One primary action per screen (SPEC 2). */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const reduce = useReducedMotion();
  const script = useScript();
  const inert = disabled || loading;

  return (
    <motion.button
      type="button"
      disabled={inert}
      aria-busy={loading || undefined}
      whileTap={inert ? undefined : reduce ? { opacity: 0.8 } : { scale: tokens.pressScale }}
      transition={{ type: 'spring', ...spring.snappy }}
      className={cn(
        'relative inline-flex select-none items-center justify-center rounded-full font-medium',
        'transition-colors duration-(--duration-instant) ease-standard',
        'disabled:cursor-not-allowed',
        disabled && 'opacity-40',
        variants[variant],
        sizes[size].box,
        sizes[size][script],
        className,
      )}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-[inherit]', loading && 'opacity-0')}>
        {icon}
        {children}
      </span>
      {loading && <LoadingDots />}
    </motion.button>
  );
}

/** Three soft dots, shown only if loading lasts long enough to notice. */
export function LoadingDots({ className }: { className?: string }) {
  const t = useTranslations('components');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), tokens.loadingDelay);
    return () => clearTimeout(id);
  }, []);

  return (
    <span
      role="status"
      aria-label={t('loading')}
      className={cn('absolute inset-0 flex items-center justify-center gap-1', className)}
    >
      {visible &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-current"
            style={{
              animation: `murshid-dot var(--duration-ambient) ${(i * duration.ambient) / 8}ms infinite ease-in-out`,
            }}
          />
        ))}
    </span>
  );
}
