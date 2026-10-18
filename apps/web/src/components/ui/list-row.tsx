'use client';

import { CaretRight, type Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Text } from './text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
  /** A short value at the end, e.g. the current setting. */
  value?: string;
  /** A control at the end instead of a value (a Toggle). Rows with a control are not buttons. */
  control?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Links the control's accessible name to the title. */
  titleId?: string;
}

/**
 * One row of a settings-style list. Pressable rows show a chevron that points in the
 * reading direction; rows with a control leave the press to the control.
 */
export function ListRow({
  title,
  subtitle,
  icon: IconComponent,
  value,
  control,
  onPress,
  disabled,
  titleId,
}: ListRowProps) {
  const interactive = Boolean(onPress) && !control;
  const content = (
    <>
      {IconComponent && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-canvas text-ink">
          <IconComponent size={20} aria-hidden />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col items-start text-start">
        <Text as="span" role="body" id={titleId}>
          {title}
        </Text>
        {subtitle && (
          <Text as="span" role="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </span>
      {value && (
        <Text as="span" role="callout" tone="muted" className="shrink-0">
          {value}
        </Text>
      )}
      {control}
      {interactive && (
        <CaretRight size={18} aria-hidden className="shrink-0 text-ink-muted rtl:-scale-x-100" />
      )}
    </>
  );

  const rowClass = 'flex min-h-16 w-full items-center gap-4 px-4 py-3';

  if (!interactive) return <div className={rowClass}>{content}</div>;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={cn(
        rowClass,
        'transition-colors duration-(--duration-instant) ease-standard hover:bg-ink/5 active:bg-ink/10',
        'focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {content}
    </button>
  );
}

/** Rows grouped on one paper card, separated by hairlines. */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'divide-y divide-hairline overflow-hidden rounded-card border border-card-edge bg-surface shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}
