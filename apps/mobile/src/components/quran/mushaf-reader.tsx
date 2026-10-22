import {
  ayahWords,
  divisionOf,
  editionPages,
  firstAyahOfPage,
  loadMushaf,
  loadSurahText,
  loadTranslation,
  loadTransliteration,
  pageOf,
  pageOfWord,
  pageWords,
  surah as surahInfo,
} from '@murshid/content/quran';
import { khatmahDay, readThrough } from '@murshid/core';
import { bookmarkCovering, translationFor, translationLanguage } from '@murshid/data';
import { space } from '@murshid/tokens';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAppLocale } from '@/lib/locale';
import { khatmahStore, saveReadingPosition, useBookmarks, useLoad } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import { AyahActions, type ActionsTarget } from './ayah-overlays';
import { ReadingSurface, useSurahName, useSurahNameFont, useToday } from './common';
import { MemorizeSheet, useMemorize } from './memorize';
import { MushafPage } from './mushaf-page';
import { AudioBar, ReaderBar } from './reader-bars';
import { ReadingSettings, setQuranPrefs, type ReaderView } from './reading-settings';
import { useRecitation } from './recitation';
import { haptics } from '@/lib/haptics';

const SWIPE = 60;

/**
 * The actions for an ayah tapped on a page, once its words are loaded. It stays mounted, so a
 * passage sheet opened from it outlives the actions sheet.
 */
function PageAyahActions({
  at,
  onClose,
}: {
  at: { surah: number; ayah: number } | null;
  onClose: () => void;
}) {
  const { locale } = useAppLocale();
  const settings = useSettings();
  const recitation = useRecitation();
  const format = useFormatter();
  const name = useSurahName();
  const bookmarks = useBookmarks();
  const translation = translationFor(settings.quran, locale);
  const lang = translation ? translationLanguage[translation] : locale === 'fr' ? 'fr' : 'en';
  const n = at?.surah ?? 1;
  const text = useLoad(at ? () => loadSurahText(n) : null, `text/${n}`);
  const extra = useLoad(at ? () => loadTranslation(lang, n) : null, `${lang}/${n}`);
  const translit = useLoad(at ? () => loadTransliteration(n) : null, `translit/${n}`);
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
  let target: ActionsTarget | null = null;
  if (at && text.data) {
    const words = ayahWords(text.data, at.ayah);
    target = {
      ...at,
      title: `${name(surahInfo(at.surah))} ${format.number(at.ayah)}`,
      surahName: name(surahInfo(at.surah)),
      text: words.map((w) => w.text + w.after).join(''),
      translation: translation
        ? (extra.data?.t[at.ayah - 1]?.filter((s): s is string => typeof s === 'string').join('') ??
          null)
        : null,
      words,
      meanings: extra.data?.m[at.ayah - 1] ?? null,
      transliteration: translit.data?.[at.ayah - 1] ?? null,
      bookmark: bookmarkCovering(bookmarks, at.surah, at.ayah),
    };
  }
  return (
    <AyahActions
      target={target}
      onClose={onClose}
      onPlay={(s, a) => recitation.play(s, a)}
      onRepeat={(s, a, plan) => recitation.play(s, a, plan)}
      shareUrl={(s, a) => (webUrl ? `${webUrl}/${locale}/quran/${s}/${a}` : null)}
    />
  );
}

/**
 * The mushaf view (SPEC 5.5): the 604 printed pages. Turning pages matches a paper mushaf in every
 * app language: the next page lies to the left, so swipe toward the right. Pages change in place;
 * the Quran text itself never animates.
 */
export function MushafReader({ startPage }: { startPage: number }) {
  const t = useTranslations('quran');
  const format = useFormatter();
  const settings = useSettings();
  const recitation = useRecitation();
  const name = useSurahName();
  const today = useToday();
  const plan = khatmahStore.useValue();
  useSurahNameFont();
  const edition = settings.quran.edition;
  const pageCount = editionPages[edition];
  const mushaf = useLoad(() => loadMushaf(edition), `mushaf/${edition}`);
  const [wanted, setPage] = useState(startPage);
  const page = Math.min(wanted, pageCount);
  // Another edition: stay with the ayah that opened the page.
  const [shownEdition, setShownEdition] = useState(edition);
  if (edition !== shownEdition) {
    const anchor = firstAyahOfPage(Math.min(page, editionPages[shownEdition]), shownEdition);
    setShownEdition(edition);
    setPage(pageOf(anchor.surah, anchor.ayah, edition));
  }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<{ surah: number; ayah: number } | null>(null);
  const [memorizeOpen, setMemorizeOpen] = useState(false);
  const prefs = settings.quran;
  const memorize = useMemorize(prefs.hide);
  const bookmarks = useBookmarks();

  const go = (next: number) => {
    const p = Math.min(pageCount, Math.max(1, next));
    if (p !== page) haptics.selection();
    setPage(p);
  };

  useEffect(() => {
    // The position keeps the ayah (and its 1421H page); every edition finds its page from it.
    const first = firstAyahOfPage(page, edition);
    saveReadingPosition(first.surah, first.ayah);
  }, [page, edition]);

  // Follow the recitation onto its page, only when it moves to another page.
  const playingPage =
    recitation.surah !== null && recitation.ayah !== null
      ? pageOf(recitation.surah, recitation.ayah, edition)
      : null;
  const [followed, setFollowed] = useState(playingPage);
  if (playingPage !== followed) {
    setFollowed(playingPage);
    if (playingPage !== null && recitation.playing && playingPage !== page) setPage(playingPage);
  }

  // Toward the right brings the next page in from the left, like a paper mushaf.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (Math.abs(e.translationX) < SWIPE) return;
      go(e.translationX > 0 ? page + 1 : page - 1);
    });

  const first = firstAyahOfPage(page, edition);
  const juz = divisionOf('juz', first.surah, first.ayah);
  // A khatmah keeps its pace in 1421H pages; here its portion ends on the page holding the last
  // word of its last page.
  const day = plan ? khatmahDay(plan, today) : null;
  const endsPortion =
    day &&
    !day.done &&
    day.readToday < day.to - day.from + 1 &&
    page === pageOfWord(pageWords(day.to)[1], edition);
  const playing =
    recitation.surah !== null && recitation.ayah !== null
      ? { surah: recitation.surah, ayah: recitation.ayah, word: recitation.word }
      : null;

  const play = () => {
    if (recitation.playing) recitation.pause();
    else if (recitation.surah !== null) recitation.resume();
    else recitation.play(first.surah, first.ayah);
  };
  const toggleView = () => {
    setQuranPrefs({ view: 'verses' });
    router.replace(
      first.ayah > 1 ? `/quran/${first.surah}/${first.ayah}` : `/quran/${first.surah}`,
    );
  };
  const onView = (v: ReaderView) => {
    if (v === 'mushaf') return;
    setQuranPrefs({ layout: v });
    toggleView();
  };

  return (
    <ReadingSurface>
      <ReaderBar
        title={t('mushaf.page', { page: format.number(page) })}
        subtitle={`${name(surahInfo(first.surah))} · ${t('mushaf.juz', { number: format.number(juz) })}`}
        view="mushaf"
        onToggleView={toggleView}
        onSettings={() => setSettingsOpen(true)}
        memorizing={memorize.mode !== 'off'}
        onMemorize={() => setMemorizeOpen(true)}
        playing={recitation.playing}
        onPlay={play}
      />
      <GestureDetector gesture={swipe}>
        <ScrollView
          contentContainerStyle={{ padding: space[4], paddingBottom: space[16] * 2, gap: space[6] }}
        >
          {endsPortion && day && plan && (
            <Card className="flex-row flex-wrap items-center justify-between gap-4 p-4">
              <Text role="callout">{t('khatmah.today', { from: day.from, to: day.to })}</Text>
              <Button
                variant="secondary"
                onPress={() => {
                  khatmahStore.write({ ...plan, ...readThrough(plan, day.to, today) });
                  haptics.success();
                }}
              >
                {t('khatmah.markRead')}
              </Button>
            </Card>
          )}
          {mushaf.error ? (
            <Card className="gap-4 p-6">
              <Text role="body">{t('reader.error')}</Text>
              <Button variant="secondary" onPress={mushaf.retry} className="self-start">
                {t('reader.retry')}
              </Button>
            </Card>
          ) : !mushaf.data ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <MushafPage
              page={page}
              mushaf={mushaf.data}
              edition={edition}
              playing={playing}
              memorize={memorize}
              bookmarks={bookmarks}
              onWord={(surah, ayah) => setSelected({ surah, ayah })}
            />
          )}
          {/* The next page is on the left in every language. */}
          <View className="flex-row items-center justify-between" style={{ direction: 'ltr' }}>
            <Button variant="ghost" onPress={() => go(page + 1)} disabled={page >= pageCount}>
              {t('mushaf.next')}
            </Button>
            <Button variant="ghost" onPress={() => go(page - 1)} disabled={page <= 1}>
              {t('mushaf.previous')}
            </Button>
          </View>
        </ScrollView>
      </GestureDetector>

      <AudioBar />
      <PageAyahActions at={selected} onClose={() => setSelected(null)} />
      <ReadingSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        surah={first.surah}
        view="mushaf"
        onView={onView}
      />
      <MemorizeSheet
        open={memorizeOpen}
        onClose={() => setMemorizeOpen(false)}
        memorize={memorize}
      />
    </ReadingSurface>
  );
}
