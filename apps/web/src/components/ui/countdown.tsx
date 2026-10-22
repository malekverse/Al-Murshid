'use client';

import { duration, easing, spring } from '@murshid/tokens';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';

const isDigit = (ch: string) => /\p{Nd}/u.test(ch);

/**
 * Digits roll one by one when they change (SPEC 6.4). Numbers keep left-to-right order in
 * every language, so the container is always LTR.
 */
export function RollingNumber({ value, className }: { value: string; className?: string }) {
  const reduce = useReducedMotion();
  const chars = [...value];

  return (
    <span dir="ltr" aria-hidden className={cn('tabular inline-flex overflow-hidden', className)}>
      {chars.map((ch, i) => {
        // Key from the end so ones stay ones when the number gains a digit.
        const place = chars.length - i;
        if (!isDigit(ch)) return <span key={`s${place}`}>{ch}</span>;
        return (
          <span key={`d${place}`} className="relative inline-block">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={ch}
                className="inline-block"
                initial={reduce ? { opacity: 0 } : { y: '0.6em', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                // The old digit leaves quickly, so fast changes (tasbih taps) never pile up.
                exit={
                  reduce
                    ? { opacity: 0 }
                    : {
                        y: '-0.6em',
                        opacity: 0,
                        transition: { duration: duration.quick / 1000, ease: easing.exit },
                      }
                }
                transition={{ type: 'spring', ...spring.snappy }}
              >
                {ch}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}

interface Parts {
  number: string;
  unit: string | null;
  spoken: string;
}

/**
 * Time left until a moment: hours and minutes, minutes, then seconds in the final minute
 * only (SPEC 5.1). The unit is localized by Intl; the spoken label by ICU plurals.
 */
export function Countdown({
  seconds,
  numberClassName,
  unitClassName,
}: {
  seconds: number;
  numberClassName?: string;
  unitClassName?: string;
}) {
  const locale = useLocale();
  const t = useTranslations();

  const parts = useMemo<Parts>(() => {
    const total = Math.max(0, Math.floor(seconds));
    const plain = new Intl.NumberFormat(locale);
    if (total >= 3600) {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const two = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
      return {
        number: `${plain.format(h)}:${two.format(m)}`,
        unit: null,
        spoken: t('common.time.hoursMinutes', {
          hours: t('common.time.hours', { count: h }),
          minutes: t('common.time.minutes', { count: m }),
        }),
      };
    }
    const inMinutes = total >= 60;
    const amount = inMinutes ? Math.ceil(total / 60) : total;
    const unitParts = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: inMinutes ? 'minute' : 'second',
      unitDisplay: 'short',
    }).formatToParts(amount);
    return {
      number: plain.format(amount),
      unit: unitParts
        .filter((p) => p.type === 'unit')
        .map((p) => p.value)
        .join(''),
      spoken: inMinutes
        ? t('common.time.minutes', { count: amount })
        : t('components.countdown.seconds', { count: amount }),
    };
  }, [locale, seconds, t]);

  return (
    <span
      role="timer"
      aria-label={t('components.countdown.remaining', { duration: parts.spoken })}
      className="inline-flex items-baseline gap-1"
    >
      <RollingNumber value={parts.number} className={numberClassName} />
      {parts.unit && (
        <span aria-hidden className={unitClassName}>
          {parts.unit}
        </span>
      )}
    </span>
  );
}
