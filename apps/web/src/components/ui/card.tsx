import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/lib/cn';

type CardProps<T extends ElementType> = {
  as?: T;
  /** Paper for everything off Today; glass only over the sky (SPEC 6.3). */
  variant?: 'solid' | 'glass';
} & ComponentProps<T>;

export function Card<T extends ElementType = 'div'>({
  as,
  variant = 'solid',
  className,
  ...rest
}: CardProps<T>) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      className={cn(
        'rounded-card',
        variant === 'solid'
          ? 'border border-card-edge bg-surface shadow-card'
          : 'glass border border-hairline',
        className,
      )}
      {...rest}
    />
  );
}
