'use client';

import { BookOpen, CaretLeft, Pause, Play, Rows, TextAa } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';

/** The reader's top bar: back to the Quran, where you are, and the reading controls. */
export function ReaderBar({
  title,
  subtitle,
  view,
  onToggleView,
  onSettings,
  playing,
  onPlay,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  view: 'verses' | 'mushaf';
  onToggleView: () => void;
  onSettings: () => void;
  playing: boolean;
  onPlay: () => void;
}) {
  const t = useTranslations('quran');
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-page items-center gap-2 px-2">
        <Link
          href="/quran"
          aria-label={t('reader.back')}
          className="flex size-touch shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <CaretLeft size={24} className="rtl:-scale-x-100" aria-hidden />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <Text as="h1" role="headline" className="truncate">
            {title}
          </Text>
          {subtitle && (
            <Text as="p" role="caption" tone="muted" className="truncate">
              {subtitle}
            </Text>
          )}
        </div>
        <IconButton
          icon={view === 'verses' ? BookOpen : Rows}
          label={view === 'verses' ? t('reader.page') : t('reader.verses')}
          onClick={onToggleView}
        />
        <IconButton icon={TextAa} label={t('reader.settings')} onClick={onSettings} />
        <IconButton
          icon={playing ? Pause : Play}
          label={playing ? t('audio.pause') : t('audio.play')}
          variant="tinted"
          onClick={onPlay}
        />
      </div>
    </header>
  );
}
