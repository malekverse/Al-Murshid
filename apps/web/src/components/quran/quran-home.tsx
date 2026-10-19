'use client';

import { BookOpenText } from '@phosphor-icons/react';
import {
  divisionStart,
  JUZ_COUNT,
  pageOf,
  surah as surahInfo,
  surahs,
} from '@murshid/content/quran';
import type { BookmarkColor } from '@murshid/data';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { readingPosition, useBookmarks } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import {
  readerHref,
  readerPlace,
  SurahCalligraphy,
  useSurahName,
  type ReaderPlace,
} from './common';
import { KhatmahCard } from './khatmah';
import { QuranSearch } from './quran-search';

export const markClass: Record<BookmarkColor, string> = {
  lantern: 'bg-lantern',
  sage: 'bg-mark-sage',
  sky: 'bg-mark-sky',
  plum: 'bg-mark-plum',
  clay: 'bg-mark-clay',
};

/** A bookmark's color as a soft tint, behind a marked ayah's number in the text. */
export const markTint: Record<BookmarkColor, string> = {
  lantern: 'bg-lantern/25',
  sage: 'bg-mark-sage/25',
  sky: 'bg-mark-sky/25',
  plum: 'bg-mark-plum/25',
  clay: 'bg-mark-clay/25',
};

type Tab = 'surahs' | 'juz' | 'bookmarks';

function ContinueCard({ place }: { place: ReaderPlace }) {
  const t = useTranslations('quran.home');
  const format = useFormatter();
  const name = useSurahName();
  const position = readingPosition.useValue();
  if (position === undefined) return <Skeleton className="h-24 w-full rounded-card" />;
  const href = position ? readerHref(position.surah, position.ayah, place) : readerHref(1);
  return (
    <Link href={href} className="group block rounded-card">
      <Card className="flex items-center gap-4 p-6 transition-colors group-hover:bg-ink/5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lantern/15 text-lantern-ink">
          <BookOpenText size={24} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="span" role="headline">
            {position ? t('continue') : t('begin')}
          </Text>
          {position && (
            <Text as="span" role="callout" tone="muted">
              {t('continueAt', {
                surah: name(surahInfo(position.surah)),
                ayah: format.number(position.ayah),
                page: format.number(position.page),
              })}
            </Text>
          )}
        </span>
      </Card>
    </Link>
  );
}

function SurahList({ place }: { place: ReaderPlace }) {
  const t = useTranslations('quran.surah');
  const format = useFormatter();
  const name = useSurahName();
  return (
    <ul className="flex flex-col">
      {surahs.map((s) => {
        const origin = t(s.revelationPlace);
        const ayahs = t('ayahs', { count: s.ayahCount });
        return (
          <li key={s.number}>
            <Link
              href={readerHref(s.number, 1, place)}
              aria-label={t('row', {
                number: format.number(s.number),
                name: name(s),
                place: origin,
                ayahs,
              })}
              className="flex min-h-touch items-center gap-4 rounded-card px-3 py-3 hover:bg-ink/5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline text-caption text-ink-muted">
                {format.number(s.number)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" role="body" className="truncate">
                  {name(s)}
                </Text>
                <Text as="span" role="caption" tone="muted">
                  {`${origin} · ${ayahs}`}
                </Text>
              </span>
              <SurahCalligraphy number={s.number} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function JuzList({ place }: { place: ReaderPlace }) {
  const t = useTranslations('quran.juz');
  const format = useFormatter();
  const name = useSurahName();
  return (
    <ul className="flex flex-col">
      {Array.from({ length: JUZ_COUNT }, (_, i) => {
        const start = divisionStart('juz', i + 1);
        return (
          <li key={i}>
            <Link
              href={readerHref(start.surah, start.ayah, place)}
              className="flex min-h-touch items-center gap-4 rounded-card px-3 py-3 hover:bg-ink/5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline text-caption text-ink-muted">
                {format.number(i + 1)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" role="body">
                  {t('name', { number: format.number(i + 1) })}
                </Text>
                <Text as="span" role="caption" tone="muted">
                  {t('starts', {
                    surah: name(surahInfo(start.surah)),
                    ayah: format.number(start.ayah),
                    page: format.number(pageOf(start.surah, start.ayah, place.edition)),
                  })}
                </Text>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BookmarkList({ place }: { place: ReaderPlace }) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const name = useSurahName();
  const bookmarks = useBookmarks();
  if (!bookmarks) return <Skeleton className="h-32 w-full rounded-card" />;
  if (bookmarks.length === 0) {
    return <EmptyState illustration="bookmarks" title={t('bookmarks.empty')} />;
  }
  return (
    <ul className="flex flex-col">
      {bookmarks.map((b) => (
        <li key={b.id}>
          <Link
            href={readerHref(b.surah, b.ayah, place)}
            className="flex min-h-touch items-center gap-4 rounded-card px-3 py-3 hover:bg-ink/5"
          >
            <span
              className={cn('size-3 shrink-0 rounded-full', markClass[b.color])}
              aria-label={t(`bookmarks.colors.${b.color}`)}
              role="img"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <Text as="span" role="body">
                {b.ayahEnd
                  ? t('range.label', {
                      surah: name(surahInfo(b.surah)),
                      from: format.number(b.ayah),
                      to: format.number(b.ayahEnd),
                    })
                  : `${name(surahInfo(b.surah))} ${format.number(b.ayah)}`}
              </Text>
              <Text as="span" role="caption" tone="muted">
                {t('mushaf.page', { page: format.number(pageOf(b.surah, b.ayah, place.edition)) })}
              </Text>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The Quran home (SPEC 5.5): continue reading, the khatmah, surahs, juz and bookmarks, search. */
export function QuranHome() {
  const t = useTranslations('quran');
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>('surahs');
  const [query, setQuery] = useState('');
  const place = readerPlace(settings?.quran);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 pt-6 pb-12 md:pt-12"
    >
      <Text as="h1" role="title1" className="px-2">
        {t('title')}
      </Text>
      <QuranSearch query={query} onQuery={setQuery} />
      {!query.trim() && (
        <>
          <ContinueCard place={place} />
          <KhatmahCard />
          <div className="flex justify-center">
            <Segmented
              label={t('home.tabs.label')}
              value={tab}
              onChange={setTab}
              options={[
                { value: 'surahs', label: t('home.tabs.surahs') },
                { value: 'juz', label: t('home.tabs.juz') },
                { value: 'bookmarks', label: t('home.tabs.bookmarks') },
              ]}
            />
          </div>
          {tab === 'surahs' && <SurahList place={place} />}
          {tab === 'juz' && <JuzList place={place} />}
          {tab === 'bookmarks' && <BookmarkList place={place} />}
        </>
      )}
    </main>
  );
}
