'use client';

import { loadTafsir, tafsirOf, tafsirRuns } from '@murshid/content/quran';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useLoad } from '@/lib/quran';

/**
 * The short tafsir of an ayah (SPEC 5.5, Phase 5b): Al-Mukhtasar in the app's language. A passage
 * may explain several ayahs; it shows once, with the ayahs it covers. Its own bold and italic are
 * kept, but Arabic is never set in italics (SPEC 7).
 */
export function TafsirSheet({
  target,
  onClose,
}: {
  target: { surah: number; ayah: number; title: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations('quran.tafsir');
  const tReader = useTranslations('quran.reader');
  const format = useFormatter();
  const locale = useLocale() as 'ar' | 'en' | 'fr';
  const surah = target?.surah ?? 1;
  const data = useLoad(
    target ? () => loadTafsir(locale, surah) : null,
    `tafsir/${locale}/${surah}`,
  );
  const passage = target && data.data ? tafsirOf(data.data, target.ayah) : null;

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(o) => !o && onClose()}
      title={target ? `${t('title')} · ${target.title}` : ''}
    >
      <div className="flex flex-col gap-4 pb-4">
        {data.error ? (
          <div className="flex flex-col items-start gap-3">
            <Text role="body">{t('error')}</Text>
            <Button variant="secondary" onClick={data.retry}>
              {tReader('retry')}
            </Button>
          </div>
        ) : !passage ? (
          <div className="flex flex-col gap-2" aria-busy>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        ) : (
          <>
            {passage.from !== passage.to && (
              <Text role="callout" tone="lantern">
                {t('covers', {
                  from: format.number(passage.from),
                  to: format.number(passage.to),
                })}
              </Text>
            )}
            <Text role="body" className="whitespace-pre-line" lang={locale}>
              {tafsirRuns(passage.text).map((run, i) => (
                <span
                  key={i}
                  className={cn(
                    run.bold && 'font-semibold',
                    run.italic && locale !== 'ar' && 'italic',
                  )}
                >
                  {run.text}
                </span>
              ))}
            </Text>
            <Text role="caption" tone="muted">
              {t('source')}
            </Text>
          </>
        )}
      </div>
    </Sheet>
  );
}
