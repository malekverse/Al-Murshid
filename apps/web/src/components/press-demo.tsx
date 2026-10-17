'use client';

import { motion as motionTokens, spring } from '@murshid/tokens';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';

/** The signature press: scale to 0.97, settle back on the snappy spring (SPEC 6.4). */
export function PressDemo() {
  const t = useTranslations('showcase.motion');
  const locale = useLocale();
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileTap={reduce ? { opacity: 0.8 } : { scale: motionTokens.pressScale }}
      transition={reduce ? { duration: 0 } : { type: 'spring', ...spring.snappy }}
      className={`min-h-touch rounded-full bg-lantern px-8 py-3 text-on-lantern shadow-card ${
        locale === 'ar' ? 'text-ar-headline' : 'text-headline'
      }`}
    >
      {t('press')}
    </motion.button>
  );
}
