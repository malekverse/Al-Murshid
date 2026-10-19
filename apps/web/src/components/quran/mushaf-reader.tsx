'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import {
  ayahWords,
  divisionOf,
  firstAyahOfPage,
  loadMushafV2,
  loadSurahText,
  loadTranslation,
  loadTransliteration,
  PAGE_COUNT,
  pageOf,
  surah as surahInfo,
} from '@murshid/content/quran';
import { khatmahDay, readThrough } from '@murshid/core';
import { translationFor, translationLanguage } from '@murshid/data';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useRouter } from '@/i18n/navigation';
import { khatmahStore, saveReadingPosition, useBookmarks, useLoad } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { AyahActions, type ActionsTarget } from './ayah-overlays';
import { useSurahName, useToday } from './common';
import { MushafPage } from './mushaf-page';
import { ReaderBar } from './reader-bar';
import { ReadingSettings, setQuranPrefs } from './reading-settings';
import { ReadingSurface } from './reading-surface';
import { useRecitation } from './recitation';

/** Opens the actions for an ayah tapped on a page, once its words are loaded. */
function PageAyahActions({
  at,
  onClose,
}: {
  at: { surah: number; ayah: number };
  onClose: () => void;
}) {
  const locale = useLocale();
  const settings = useSettings();
  const recitation = useRecitation();
  const format = useFormatter();
  const name = useSurahName();
  const bookmarks = useBookmarks();
  const translation = settings ? translationFor(settings.quran, locale) : null;
  const lang = translation ? translationLanguage[translation] : locale === 'fr' ? 'fr' : 'en';
  const text = useLoad(() => loadSurahText(at.surah), `text/${at.surah}`);
  const extra = useLoad(() => loadTranslation(lang, at.surah), `${lang}/${at.surah}`);
  const translit = useLoad(() => loadTransliteration(at.surah), `translit/${at.surah}`);
  let target: ActionsTarget | null = null;
  if (text.data) {
    const words = ayahWords(text.data, at.ayah);
    target = {
      ...at,
      title: `${name(surahInfo(at.surah))} ${format.number(at.ayah)}`,
      text: words.map((w) => w.text + w.after).join(''),
      translation: translation
        ? (extra.data?.t[at.ayah - 1]?.filter((s): s is string => typeof s === 'string').join('') ??
          null)
        : null,
      words,
      meanings: extra.data?.m[at.ayah - 1] ?? null,
      transliteration: translit.data?.[at.ayah - 1] ?? null,
      bookmark: bookmarks?.find((b) => b.surah === at.surah && b.ayah === at.ayah)?.color ?? null,
    };
  }
  return (
    <AyahActions
      target={target}
      onClose={onClose}
      onPlay={(s, a) => recitation.play(s, a)}
      shareUrl={(s, a) => `${window.location.origin}/${locale}/quran/${s}/${a}`}
    />
  );
}

/**
 * The mushaf view (SPEC 5.5): the 604 printed pages. Turning pages matches a physical mushaf in
 * every app language: the next page lies to the left (swipe toward the right, or press ←). Pages
 * change in place; the Quran text itself never animates.
 */
export function MushafReader({ startPage }: { startPage: number }) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const settings = useSettings();
  const recitation = useRecitation();
  const name = useSurahName();
  const today = useToday();
  const plan = khatmahStore.useValue();
  const mushaf = useLoad(loadMushafV2, 'mushaf-v2');
  const [page, setPage] = useState(startPage);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<{ surah: number; ayah: number } | null>(null);
  const [wide, setWide] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Two facing pages on wide screens: odd on the right, even on the left, as printed.
  useEffect(() => {
    const media = matchMedia('(min-width: 1024px)');
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const spreadStart = wide ? page - ((page + 1) % 2) : page;
  const shown = wide ? [spreadStart, spreadStart + 1].filter((p) => p <= PAGE_COUNT) : [page];
  const step = wide ? 2 : 1;

  const go = (next: number) => setPage(Math.min(PAGE_COUNT, Math.max(1, next)));

  // Keep the address and the last position on the page shown.
  useEffect(() => {
    window.history.replaceState(null, '', `/${locale}/quran/page/${page}`);
    const first = firstAyahOfPage(page);
    saveReadingPosition(first.surah, first.ayah, page);
  }, [page, locale]);

  // Follow the recitation onto its page.
  const playingPage =
    recitation.surah !== null && recitation.ayah !== null
      ? pageOf(recitation.surah, recitation.ayah)
      : null;
  const [followed, setFollowed] = useState(playingPage);
  if (playingPage !== followed) {
    // Only when the recitation moves to another page, so turning pages by hand still works.
    setFollowed(playingPage);
    if (playingPage !== null && recitation.playing && !shown.includes(playingPage)) {
      setPage(playingPage);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') go(page + step);
      if (e.key === 'ArrowRight') go(page - step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!settings) return null;
  const prefs = settings.quran;
  const first = firstAyahOfPage(page);
  const juz = divisionOf('juz', first.surah, first.ayah);

  const day = plan && today ? khatmahDay(plan, today) : null;
  const endsPortion =
    day && !day.done && day.readToday < day.to - day.from + 1 && shown.includes(day.to);

  const play = () => {
    if (recitation.playing) recitation.pause();
    else if (recitation.surah !== null) recitation.resume();
    else recitation.play(first.surah, first.ayah);
  };
  const toggleView = () => {
    setQuranPrefs({ view: 'verses' });
    router.push(first.ayah > 1 ? `/quran/${first.surah}/${first.ayah}` : `/quran/${first.surah}`);
  };

  const playing =
    recitation.surah !== null && recitation.ayah !== null
      ? { surah: recitation.surah, ayah: recitation.ayah, word: recitation.word }
      : null;

  return (
    <ReadingSurface theme={prefs.theme}>
      <ReaderBar
        title={t('mushaf.page', { page: format.number(page) })}
        subtitle={`${name(surahInfo(first.surah))} · ${t('mushaf.juz', { number: format.number(juz) })}`}
        view="mushaf"
        onToggleView={toggleView}
        onSettings={() => setSettingsOpen(true)}
        playing={recitation.playing}
        onPlay={play}
      />
      <main
        id="main"
        className="mx-auto flex w-full max-w-page flex-col items-center gap-6 px-4 pt-6 pb-32"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(e.clientY - start.y)) return;
          // Toward the right brings the next page in from the left, like a paper mushaf.
          go(dx > 0 ? page + step : page - step);
        }}
      >
        {endsPortion && day && plan && today && (
          <Card className="flex w-full max-w-reading flex-wrap items-center justify-between gap-4 p-4">
            <Text role="callout">{t('khatmah.today', { from: day.from, to: day.to })}</Text>
            <Button
              variant="secondary"
              onClick={() => khatmahStore.write({ ...plan, ...readThrough(plan, day.to, today) })}
            >
              {t('khatmah.markRead')}
            </Button>
          </Card>
        )}

        <div dir="ltr" className="flex w-full items-start justify-center gap-6">
          {/* The next page is on the left in every language. */}
          <button
            type="button"
            onClick={() => go(page + step)}
            disabled={shown.at(-1)! >= PAGE_COUNT}
            aria-label={t('mushaf.next')}
            className="mt-24 hidden size-touch shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5 disabled:opacity-30 md:flex"
          >
            <CaretLeft size={24} aria-hidden />
          </button>
          {mushaf.error ? (
            <Card className="flex max-w-reading flex-col items-start gap-4 p-6">
              <Text role="body">{t('reader.error')}</Text>
              <Button variant="secondary" onClick={mushaf.retry}>
                {t('reader.retry')}
              </Button>
            </Card>
          ) : !mushaf.data ? (
            <Skeleton className="aspect-[2/3] w-full max-w-reading rounded-card" />
          ) : (
            [...shown].reverse().map((p) => (
              <div key={p} className="flex min-w-0 flex-1 justify-center">
                <MushafPage
                  page={p}
                  mushaf={mushaf.data!}
                  playing={playing}
                  onWord={(surah, ayah) => setSelected({ surah, ayah })}
                />
              </div>
            ))
          )}
          <button
            type="button"
            onClick={() => go(page - step)}
            disabled={shown[0]! <= 1}
            aria-label={t('mushaf.previous')}
            className="mt-24 hidden size-touch shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5 disabled:opacity-30 md:flex"
          >
            <CaretRight size={24} aria-hidden />
          </button>
        </div>

        <div dir="ltr" className="flex w-full items-center justify-between gap-4 md:hidden">
          <Button
            variant="ghost"
            className="whitespace-nowrap"
            onClick={() => go(page + 1)}
            disabled={page >= PAGE_COUNT}
          >
            {t('mushaf.next')}
          </Button>
          <Button
            variant="ghost"
            className="whitespace-nowrap"
            onClick={() => go(page - 1)}
            disabled={page <= 1}
          >
            {t('mushaf.previous')}
          </Button>
        </div>
      </main>

      {selected && <PageAyahActions at={selected} onClose={() => setSelected(null)} />}
      <ReadingSettings open={settingsOpen} onOpenChange={setSettingsOpen} prefs={prefs} />
    </ReadingSurface>
  );
}
