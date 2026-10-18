'use client';

import { BookOpenText, HandHeart, SunHorizon, UserCircle, type Icon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { Text } from './text';

export type Destination = 'today' | 'quran' | 'remember' | 'you';

export const destinations: { key: Destination; icon: Icon }[] = [
  { key: 'today', icon: SunHorizon },
  { key: 'quran', icon: BookOpenText },
  { key: 'remember', icon: HandHeart },
  { key: 'you', icon: UserCircle },
];

export interface TabBarProps {
  active: Destination;
  /** Links for each destination (the app shell); without them the tabs are buttons. */
  hrefs?: Record<Destination, string>;
  onSelect?: (key: Destination) => void;
  /** Bottom bar on small screens, slim rail on the start side on desktop (SPEC 4). */
  layout?: 'bar' | 'rail';
  className?: string;
}

/**
 * The four destinations, icon and label always visible. In RTL the order mirrors on its own,
 * so Today sits on the right (SPEC 4).
 */
export function TabBar({ active, hrefs, onSelect, layout = 'bar', className }: TabBarProps) {
  const t = useTranslations('components.tabs');
  const rail = layout === 'rail';

  return (
    <nav
      aria-label={t('label')}
      className={cn(
        'flex bg-surface',
        rail
          ? 'w-24 flex-col items-stretch gap-2 border-e border-hairline py-6'
          : 'border-t border-hairline',
        className,
      )}
    >
      {destinations.map(({ key, icon: IconComponent }) => {
        const selected = key === active;
        const className = cn(
          'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-(--duration-quick) ease-standard',
          selected ? 'text-lantern-ink' : 'text-ink-muted hover:text-ink',
          rail && 'flex-none',
        );
        const content = (
          <>
            <IconComponent size={24} weight={selected ? 'fill' : 'regular'} aria-hidden />
            <Text
              as="span"
              role="caption"
              tone="inherit"
              className={selected ? 'font-medium' : undefined}
            >
              {t(key)}
            </Text>
          </>
        );
        return hrefs ? (
          <Link
            key={key}
            href={hrefs[key]}
            aria-current={selected ? 'page' : undefined}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <button
            key={key}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onSelect?.(key)}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
