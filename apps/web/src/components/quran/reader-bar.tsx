'use client';

import { BookOpen, CaretLeft, EyeSlash, Pause, Play, Rows, TextAa } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { readerBackClass, readerBarClass, readerBarRowClass } from './reader-markup';

/**
 * The reader's top bar: back to the Quran, where you are, and the reading controls. The view
 * button turns between the mushaf and the scrolling reader (its layout, text or translation, is
 * chosen in the reading settings).
 */
export function ReaderBar({
  title,
  subtitle,
  view,
  onToggleView,
  onSettings,
  memorizing,
  onMemorize,
  playing,
  onPlay,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  view: 'mushaf' | 'text' | 'translation';
  onToggleView: () => void;
  onSettings: () => void;
  /** Words or markers are hidden for memorizing. */
  memorizing: boolean;
  onMemorize: () => void;
  playing: boolean;
  onPlay: () => void;
}) {
  const t = useTranslations('quran');
  return (
    <header className={readerBarClass}>
      <div className={readerBarRowClass}>
        <Link href="/quran" aria-label={t('reader.back')} className={readerBackClass}>
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
          icon={view === 'mushaf' ? Rows : BookOpen}
          label={view === 'mushaf' ? t('reader.verses') : t('reader.page')}
          onClick={onToggleView}
        />
        <IconButton
          icon={EyeSlash}
          label={t('memorize.title')}
          aria-pressed={memorizing}
          className={memorizing ? 'bg-lantern/15 text-lantern-ink hover:bg-lantern/20' : undefined}
          onClick={onMemorize}
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
