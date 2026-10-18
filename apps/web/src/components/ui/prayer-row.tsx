'use client';

import { messages } from '@murshid/i18n';
import type { PrayerName } from '@murshid/tokens';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { PrayerGlyph } from './prayer-glyph';
import { Text } from './text';

export type PrayerRowState = 'upcoming' | 'current' | 'logged';

export interface PrayerRowProps {
  prayer: PrayerName;
  time: Date;
  /** Sunrise is a marker, not a prayer: it never has a state. */
  state?: PrayerRowState;
  /** Friday's Dhuhr reads "Jumu'ah" (SPEC 5.8). */
  jumuah?: boolean;
  onPress?: () => void;
}

/**
 * One line of today's prayer times. Logged prayers show a filled light, others a neutral
 * outline. Never red, never "missed" (SPEC 2, 5.1).
 */
export function PrayerRow({
  prayer,
  time,
  state = 'upcoming',
  jumuah = false,
  onPress,
}: PrayerRowProps) {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();

  const key = jumuah && prayer === 'dhuhr' ? 'jumuah' : prayer;
  const name = t(`glossary.prayer.${key}`);
  const arabicName = messages.ar.glossary.prayer[key];
  const timeText = format.dateTime(time, { hour: 'numeric', minute: '2-digit' });
  const marker = prayer === 'sunrise';
  const current = state === 'current' && !marker;

  const body = (
    <>
      <PrayerGlyph
        prayer={prayer}
        className={cn('shrink-0', current ? 'text-lantern-ink' : 'text-ink-muted')}
      />
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <Text
          as="span"
          role={marker ? 'callout' : 'body'}
          tone={marker ? 'muted' : current ? 'lantern' : 'default'}
          className={current ? 'font-medium' : undefined}
        >
          {name}
        </Text>
        {/* The Arabic name is always present (SPEC 5.1). */}
        {locale !== 'ar' && (
          <Text as="span" role="caption" tone="muted" script="arabic">
            {arabicName}
          </Text>
        )}
      </span>
      <Text
        as="time"
        dateTime={time.toISOString()}
        role={marker ? 'callout' : 'body'}
        tone={marker ? 'muted' : 'default'}
        className="tabular"
      >
        {timeText}
      </Text>
      {!marker && (
        <span
          aria-hidden
          className={cn(
            'size-3 shrink-0 rounded-full transition-colors duration-(--duration-gentle) ease-standard',
            state === 'logged' && 'bg-lantern shadow-[0_0_12px_var(--color-lantern)]',
            state === 'current' && 'border-2 border-lantern',
            state === 'upcoming' && 'border-2 border-ink-muted/70',
          )}
        />
      )}
    </>
  );

  const label = t('components.prayer.row', {
    name,
    time: timeText,
    state: marker ? 'other' : state,
  });
  const rowClass = cn(
    'flex w-full items-center gap-4 rounded-control px-4',
    marker ? 'min-h-12' : 'min-h-16',
    current && 'bg-lantern/10',
  );

  if (!onPress || marker) {
    return (
      <div className={rowClass} aria-label={label} role="group">
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={cn(
        rowClass,
        'text-start transition-colors duration-(--duration-instant) ease-standard hover:bg-ink/5',
      )}
    >
      {body}
    </button>
  );
}
