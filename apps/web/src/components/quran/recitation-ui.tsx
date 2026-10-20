'use client';

import type { Locale } from '@murshid/i18n';
import { MotionConfig } from 'motion/react';
import { LazyIntl } from '@/lib/lazy-intl';
import { AudioBar } from './audio-bar';
import { RecitationPlayer } from './recitation';

/** The player and its bar, with their messages and Motion: loaded together on the first play. */
export function RecitationUi({ locale, barClassName }: { locale: Locale; barClassName: string }) {
  return (
    <LazyIntl locale={locale}>
      <MotionConfig reducedMotion="user">
        <RecitationPlayer />
        <AudioBar className={barClassName} />
      </MotionConfig>
    </LazyIntl>
  );
}
