'use client';

import { spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { RollingNumber } from './countdown';
import { ProgressRing } from './progress-ring';
import { Text } from './text';

export interface DhikrCardProps {
  /** Verbatim Arabic from packages/content, never generated or edited. */
  arabic: string;
  translation?: string;
  transliteration?: string;
  /** Source reference, e.g. "Muslim 2723". */
  reference: string;
  /** How many times to say it. */
  target: number;
  /** The text is Quran (e.g. Al-Ikhlas in the morning adhkar): render it in the Quran font. */
  quran?: boolean;
  showTranslation?: boolean;
  showTransliteration?: boolean;
  onComplete?: () => void;
}

/**
 * One dhikr: tap anywhere on the card to count, a ring fills around the count, and on the
 * last tap the card settles (SPEC 5.6). The Arabic itself never moves.
 */
export function DhikrCard({
  arabic,
  translation,
  transliteration,
  reference,
  target,
  quran = false,
  showTranslation = true,
  showTransliteration = false,
  onComplete,
}: DhikrCardProps) {
  const t = useTranslations('components.dhikr');
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  const done = count >= target;
  const format = new Intl.NumberFormat(locale);

  const tap = () => {
    if (done) return;
    const next = count + 1;
    setCount(next);
    if (next === target) onComplete?.();
  };

  return (
    <motion.button
      type="button"
      onClick={tap}
      aria-label={`${t('tapToCount')}. ${t('count', { count: format.format(count), target: format.format(target) })}`}
      aria-disabled={done}
      animate={done && !reduce ? { scale: [1, 0.985, 1] } : { scale: 1 }}
      transition={{ type: 'spring', ...spring.soft }}
      className={cn(
        'flex w-full flex-col gap-6 rounded-card border border-card-edge bg-surface p-6 text-start shadow-card',
        done ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <Text as="span" role="caption" tone="muted">
          {reference}
        </Text>
        <ProgressRing
          progress={count / target}
          label={t('count', { count: format.format(count), target: format.format(target) })}
          size={56}
        >
          <Text as="span" role="callout" tone={done ? 'lantern' : 'default'}>
            <RollingNumber value={format.format(done ? target : count)} />
          </Text>
        </ProgressRing>
      </div>

      {quran ? (
        <p lang="ar" dir="rtl" className="w-full font-quran text-quran text-ink">
          {arabic}
        </p>
      ) : (
        <Text role="dhikr" script="arabic" className="w-full">
          {arabic}
        </Text>
      )}

      {showTransliteration && transliteration && (
        <Text role="callout" tone="muted" dir="ltr" lang={locale === 'fr' ? 'fr' : 'en'}>
          {transliteration}
        </Text>
      )}
      {showTranslation && translation && (
        <Text role="body" dir="auto">
          {translation}
        </Text>
      )}
      {done && (
        <Text as="span" role="callout" tone="lantern">
          {t('done')}
        </Text>
      )}
    </motion.button>
  );
}
