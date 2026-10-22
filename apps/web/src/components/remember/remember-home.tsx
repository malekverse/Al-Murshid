'use client';

import { civilDate, isoDate } from '@murshid/core';
import { placeOf } from '@murshid/data';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { useSettings } from '@/lib/settings';
import { useTasbihTotal } from '@/lib/tasbih';
import { useNow } from '@/lib/use-now';
import { BeadRing } from './bead-ring';

// Remember (SPEC 4, 5.6) shows only what exists: Tasbih now; the adhkar collections, duas and the
// 99 Names when their reviewed texts land (docs/PHASE-7.md).

export function RememberHome() {
  const t = useTranslations('remember');
  const format = useFormatter();
  const settings = useSettings();
  const now = useNow(60_000);
  const timeZone =
    (settings && placeOf(settings)?.timeZone) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const total = useTasbihTotal(now ? isoDate(civilDate(now, timeZone)) : null);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-col gap-8 px-4 pt-6 pb-12 md:pt-12"
    >
      <Text as="h1" role="title1" className="px-2">
        {t('title')}
      </Text>
      <Card
        as={Link}
        href="/remember/tasbih"
        className="flex items-center gap-4 p-6 transition-colors duration-(--duration-instant) ease-standard hover:bg-canvas focus-visible:outline-2 focus-visible:outline-lantern"
      >
        <BeadRing beads={33} lit={11} complete={false} className="size-16 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="span" role="headline">
            {t('tasbih.title')}
          </Text>
          <Text as="span" role="callout" tone="muted">
            {t('tasbih.body')}
          </Text>
          {total !== undefined && total > 0 && (
            <Text as="span" role="caption" tone="muted">
              {t('tasbih.today', { count: format.number(total) })}
            </Text>
          )}
        </span>
      </Card>
      <Text role="callout" tone="muted" className="px-2">
        {t('coming')}
      </Text>
    </main>
  );
}
