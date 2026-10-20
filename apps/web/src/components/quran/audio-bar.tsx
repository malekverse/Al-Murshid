'use client';

import { Pause, Play, SkipBack, SkipForward, X } from '@phosphor-icons/react';
import { surah as surahInfo } from '@murshid/content/quran';
import { spring } from '@murshid/tokens';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingDots } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useSurahName } from './common';
import { useRecitation } from './recitation-store';

/** The recitation, wherever you are in the app: play or pause, step ayah by ayah, stop. */
export function AudioBar({ className }: { className?: string }) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const name = useSurahName();
  const reduce = useReducedMotion();
  const r = useRecitation();
  const info = r.surah === null ? null : surahInfo(r.surah);

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          role="region"
          aria-label={t('audio.playing', {
            surah: name(info),
            reciter: t(`reciters.${r.reciter}`),
          })}
          className={cn('fixed inset-x-0 z-30 px-2 pb-2', className)}
          initial={reduce ? { opacity: 0 } : { y: '120%' }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: '120%' }}
          transition={{ type: 'spring', ...spring.gentle }}
        >
          <div className="mx-auto flex max-w-reading items-center gap-2 rounded-card border border-card-edge bg-surface p-2 shadow-lift">
            <IconButton
              icon={r.playing ? Pause : Play}
              label={r.playing ? t('audio.pause') : t('audio.play')}
              variant="tinted"
              onClick={r.playing ? r.pause : r.resume}
            />
            <Link
              href={
                r.ayah && r.ayah > 1
                  ? `/quran/${info.number}#ayah-${r.ayah}`
                  : `/quran/${info.number}`
              }
              className="flex min-w-0 flex-1 flex-col rounded-control px-2 hover:bg-ink/5"
            >
              <Text as="span" role="callout" className="truncate">
                {r.ayah ? `${name(info)} ${format.number(r.ayah)}` : name(info)}
              </Text>
              <Text as="span" role="caption" tone="muted" className="truncate" aria-live="polite">
                {r.error
                  ? t('audio.error')
                  : r.loading
                    ? t('audio.loading')
                    : r.turn
                      ? t('audio.yourTurn')
                      : r.passage
                        ? t('audio.range', {
                            from: format.number(r.passage.from),
                            to: format.number(r.passage.to),
                            pass: format.number(r.passage.pass),
                            times: format.number(r.passage.times),
                          })
                        : t(`reciters.${r.reciter}`)}
              </Text>
            </Link>
            {r.loading && <LoadingDots />}
            {/* Media controls are never mirrored (SPEC 7). */}
            <IconButton icon={SkipBack} label={t('audio.previous')} onClick={() => r.step(-1)} />
            <IconButton icon={SkipForward} label={t('audio.next')} onClick={() => r.step(1)} />
            <IconButton icon={X} label={t('audio.stop')} onClick={r.stop} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
