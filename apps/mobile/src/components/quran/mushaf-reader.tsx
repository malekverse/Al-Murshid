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
import { space } from '@murshid/tokens';
import * as Haptics from 'expo-haptics';
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
import { MushafPage } from './mushaf-page';
import { AudioBar, ReaderBar } from './reader-bars';
import { ReadingSettings, setQuranPrefs } from './reading-settings';
import { useRecitation } from './recitation';

const SWIPE = 60;

/** The actions for an ayah tapped on a page, once its words are loaded. */
function PageAyahActions({
  at,
  onClose,
}: {
  at: { surah: number; ayah: number };
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
  const text = useLoad(() => loadSurahText(at.surah), `text/${at.surah}`);
  const extra = useLoad(() => loadTranslation(lang, at.surah), `${lang}/${at.surah}`);
  const translit = useLoad(() => loadTransliteration(at.surah), `translit/${at.surah}`);
  if (!text.data) return null;
  const words = ayahWords(text.data, at.ayah);
  const target: ActionsTarget = {
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
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
  return (
    <AyahActions
      target={target}
      onClose={onClose}
      onPlay={(s, a) => recitation.play(s, a)}
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
  const mushaf = useLoad(loadMushafV2, 'mushaf-v2');
  const [page, setPage] = useState(startPage);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<{ surah: number; ayah: number } | null>(null);
  const prefs = settings.quran;

  const go = (next: number) => {
    const p = Math.min(PAGE_COUNT, Math.max(1, next));
    if (p !== page) void Haptics.selectionAsync();
    setPage(p);
  };

  useEffect(() => {
    const first = firstAyahOfPage(page);
    saveReadingPosition(first.surah, first.ayah, page);
  }, [page]);

  // Follow the recitation onto its page, only when it moves to another page.
  const playingPage =
    recitation.surah !== null && recitation.ayah !== null
      ? pageOf(recitation.surah, recitation.ayah)
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

  const first = firstAyahOfPage(page);
  const juz = divisionOf('juz', first.surah, first.ayah);
  const day = plan ? khatmahDay(plan, today) : null;
  const endsPortion = day && !day.done && day.readToday < day.to - day.from + 1 && page === day.to;
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

  return (
    <ReadingSurface>
      <ReaderBar
        title={t('mushaf.page', { page: format.number(page) })}
        subtitle={`${name(surahInfo(first.surah))} · ${t('mushaf.juz', { number: format.number(juz) })}`}
        view="mushaf"
        onToggleView={toggleView}
        onSettings={() => setSettingsOpen(true)}
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
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
              playing={playing}
              onWord={(surah, ayah) => setSelected({ surah, ayah })}
            />
          )}
          {/* The next page is on the left in every language. */}
          <View className="flex-row items-center justify-between" style={{ direction: 'ltr' }}>
            <Button variant="ghost" onPress={() => go(page + 1)} disabled={page >= PAGE_COUNT}>
              {t('mushaf.next')}
            </Button>
            <Button variant="ghost" onPress={() => go(page - 1)} disabled={page <= 1}>
              {t('mushaf.previous')}
            </Button>
          </View>
        </ScrollView>
      </GestureDetector>

      <AudioBar />
      {selected && <PageAyahActions at={selected} onClose={() => setSelected(null)} />}
      <ReadingSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        surah={first.surah}
      />
    </ReadingSurface>
  );
}
