import {
  ayahWords,
  isGlyphMushaf,
  loadMushaf,
  loadSurahText,
  loadTranslation,
  loadTransliteration,
  pageOf,
  sajdaOf,
  surah as surahInfo,
  wordId,
  type SurahTranslation,
} from '@murshid/content/quran';
import { bookmarkCovering, translationFor, translationLanguage } from '@murshid/data';
import { space, typeScale } from '@murshid/tokens';
import { FlashList, type FlashListRef, type ViewToken } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAppLocale } from '@/lib/locale';
import { saveReadingPosition, useBookmarks, useLoad } from '@/lib/quran';
import { useSettings } from '@/lib/settings';
import {
  AyahActions,
  FootnoteSheet,
  WordPopover,
  type ActionsTarget,
  type WordTarget,
} from './ayah-overlays';
import { AyahView } from './ayah-view';
import {
  ReadingSurface,
  SurahCalligraphy,
  useReaderTheme,
  useSurahName,
  useSurahNameFont,
} from './common';
import { MemorizeSheet, useMemorize } from './memorize';
import { AudioBar, ReaderBar } from './reader-bars';
import { ReadingSettings, setQuranPrefs, type ReaderView } from './reading-settings';
import { useRecitation } from './recitation';
import { pageGroups, TextPage } from './surah-text';

/** The basmalah opening a surah: the words of Al-Fatihah 1 as published, without its number. */
export function Basmalah({ size }: { size: number }) {
  const text = useLoad(() => loadSurahText(1), 'text/1');
  if (!text.data) return <View style={{ height: size * typeScale.quran.arabic.lineHeight }} />;
  const words = ayahWords(text.data, 1).slice(0, -1);
  return (
    <RNText
      className="text-center font-quran text-ink"
      style={{ fontSize: size, lineHeight: size * typeScale.quran.arabic.lineHeight }}
    >
      {words.map((w, i) => (i === words.length - 1 ? w.text : w.text + w.after)).join('')}
    </RNText>
  );
}

/** The web app's address, once it is deployed; shares carry a link to the ayah only then. */
const webUrl = process.env.EXPO_PUBLIC_WEB_URL;

const plainTranslation = (tr: SurahTranslation | undefined, ayah: number) =>
  tr?.t[ayah - 1]?.filter((s): s is string => typeof s === 'string').join('') ?? null;

/**
 * The scrolling reader (SPEC 5.5, Phase 5b): verse by verse with translation, or the Arabic text
 * flowing in paragraphs by mushaf page, as the reading settings choose. Memorizing hides words or
 * markers in either.
 */
export function SurahReader({ surah, startAyah = 1 }: { surah: number; startAyah?: number }) {
  const format = useFormatter();
  const t = useTranslations('quran');
  const { locale } = useAppLocale();
  const settings = useSettings();
  const recitation = useRecitation();
  const name = useSurahName();
  const fontReady = useSurahNameFont();
  const info = surahInfo(surah);
  const prefs = settings.quran;

  const translation = translationFor(prefs, locale);
  // Word meanings come in the translation's language, or the app's (English in Arabic).
  const lang = translation ? translationLanguage[translation] : locale === 'fr' ? 'fr' : 'en';
  const text = useLoad(() => loadSurahText(surah), `text/${surah}`);
  const extra = useLoad(() => loadTranslation(lang, surah), `${lang}/${surah}`);
  const translit = useLoad(() => loadTransliteration(surah), `translit/${surah}`);
  const bookmarks = useBookmarks();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memorizeOpen, setMemorizeOpen] = useState(false);
  const memorize = useMemorize(prefs.hide);
  const layout = prefs.layout;
  // Tajweed colors here too, with the 1441H glyphs (loaded only then), on light and sepia pages:
  // Android draws the fonts' own colors, whose ink is black. A hidden word's zero-alpha ink still
  // hides a color glyph (the alpha applies, only the color is the font's).
  const theme = useReaderTheme();
  const tajweedOn = prefs.tajweed && prefs.edition === 'v4' && theme !== 'dark';
  const v4 = useLoad(tajweedOn ? () => loadMushaf('v4') : null, tajweedOn ? 'mushaf/v4' : '');
  const glyphs = tajweedOn && v4.data && isGlyphMushaf(v4.data) ? v4.data.glyphs : null;
  const groups = useMemo(() => pageGroups(surah, info.ayahCount), [surah, info.ayahCount]);
  /** The list row holding an ayah: the ayah itself, or its paragraph in the text layout. */
  const rowOf = useCallback(
    (ayah: number) =>
      layout === 'text'
        ? Math.max(
            0,
            groups.findIndex((g) => g.ayahs.includes(ayah)),
          )
        : ayah - 1,
    [layout, groups],
  );
  const [word, setWord] = useState<WordTarget | null>(null);
  const [actions, setActions] = useState<ActionsTarget | null>(null);
  const [note, setNote] = useState<{ mark: string; text: string } | null>(null);
  const list = useRef<FlashListRef<number>>(null);
  const visible = useRef(new Set<number>());

  const size = prefs.arabicSize ?? typeScale.quran.arabic.size;
  const playingHere = recitation.surah === surah;
  // Rows: ayahs (from 1) in the translation layout, paragraphs (from 0) in the text layout.
  const rows = !text.data
    ? []
    : layout === 'text'
      ? groups.map((_, i) => i)
      : Array.from({ length: info.ayahCount }, (_, i) => i + 1);

  // Open at the ayah asked for.
  const ready = Boolean(text.data);
  useEffect(() => {
    if (!ready || startAyah <= 1) return;
    const id = setTimeout(
      () => list.current?.scrollToIndex({ index: rowOf(startAyah), animated: false }),
      50,
    );
    return () => clearTimeout(id);
  }, [ready, startAyah, rowOf]);

  // Follow the recitation: keep the ayah being recited in view.
  useEffect(() => {
    if (!playingHere || recitation.ayah === null) return;
    const row = rowOf(recitation.ayah);
    if (visible.current.has(row)) return;
    list.current?.scrollToIndex({ index: row, animated: true, viewPosition: 0.3 });
  }, [playingHere, recitation.ayah, rowOf]);

  // Remember the ayah at the top of the screen as the last position.
  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<number>[] }) => {
      visible.current = new Set(viewableItems.map((v) => v.item));
      const top = viewableItems.find((v) => v.isViewable)?.item;
      if (top === undefined) return;
      if (layout === 'text') {
        const first = groups[top]?.ayahs[0];
        if (first) saveReadingPosition(surah, first);
      } else if (top) saveReadingPosition(surah, top);
    },
    [surah, layout, groups],
  );

  const play = () => {
    if (playingHere && recitation.playing) recitation.pause();
    else if (playingHere) recitation.resume();
    else recitation.play(surah, 1);
  };
  const toggleView = () => {
    setQuranPrefs({ view: 'mushaf' });
    const at = playingHere && recitation.ayah ? recitation.ayah : startAyah;
    router.replace(`/quran/page/${pageOf(surah, at, prefs.edition)}`);
  };
  const onView = (v: ReaderView) => {
    if (v === 'mushaf') toggleView();
    else setQuranPrefs({ view: 'verses', layout: v });
  };
  const openActions = (ayah: number) => {
    const words = ayahWords(text.data!, ayah);
    setActions({
      surah,
      ayah,
      title: `${name(info)} ${format.number(ayah)}`,
      surahName: name(info),
      text: words.map((w) => w.text + w.after).join(''),
      translation: translation ? plainTranslation(extra.data, ayah) : null,
      words,
      meanings: extra.data?.m[ayah - 1] ?? null,
      transliteration: translit.data?.[ayah - 1] ?? null,
      bookmark: bookmarkCovering(bookmarks, surah, ayah),
    });
  };

  const header = (
    <View className="items-center gap-2 py-8">
      {fontReady && <SurahCalligraphy number={surah} size="header" />}
      {locale !== 'ar' && (
        <Text role="callout" tone="muted">
          {info.nameSimple}
        </Text>
      )}
      {info.bismillahPre && (
        <View className="w-full pt-2">
          <Basmalah size={size} />
        </View>
      )}
    </View>
  );

  const footer = (
    <View className="flex-row flex-wrap justify-between gap-4 py-8">
      {surah > 1 ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace(`/quran/${surah - 1}`)}
          className="px-4 py-3"
        >
          <Text role="callout" tone="lantern">
            {t('reader.previous', { surah: name(surahInfo(surah - 1)) })}
          </Text>
        </Pressable>
      ) : (
        <View />
      )}
      {surah < 114 && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace(`/quran/${surah + 1}`)}
          className="px-4 py-3"
        >
          <Text role="callout" tone="lantern">
            {t('reader.next', { surah: name(surahInfo(surah + 1)) })}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ReadingSurface>
      <ReaderBar
        title={name(info)}
        subtitle={`${t(`surah.${info.revelationPlace}`)} · ${t('surah.ayahs', { count: info.ayahCount })}`}
        view={layout}
        onToggleView={toggleView}
        onSettings={() => setSettingsOpen(true)}
        memorizing={memorize.mode !== 'off'}
        onMemorize={() => setMemorizeOpen(true)}
        playing={playingHere && recitation.playing}
        onPlay={play}
      />
      {text.error ? (
        <View className="p-4">
          <Card className="gap-4 p-6">
            <Text role="body">{t('reader.error')}</Text>
            <Button variant="secondary" onPress={text.retry} className="self-start">
              {t('reader.retry')}
            </Button>
          </Card>
        </View>
      ) : !text.data ? (
        <View className="gap-6 p-4" accessibilityLabel={t('reader.loading')}>
          {header}
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </View>
      ) : (
        <FlashList
          // A new layout is a new list: its rows and their positions differ.
          key={layout}
          ref={list}
          data={rows}
          keyExtractor={(row) => `${layout}-${row}`}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          contentContainerStyle={{ paddingHorizontal: space[4], paddingBottom: space[16] * 2 }}
          extraData={[
            recitation.ayah,
            recitation.word,
            playingHere,
            bookmarks,
            extra.data,
            translit.data,
            prefs,
            size,
            memorize,
            layout,
            glyphs,
          ]}
          renderItem={({ item }) => {
            if (layout === 'text') {
              const group = groups[item]!;
              const here = playingHere && recitation.ayah !== null;
              return (
                <TextPage
                  surah={surah}
                  text={text.data!}
                  page={group.page}
                  ayahs={group.ayahs}
                  size={size}
                  bookmarks={bookmarks}
                  memorize={memorize}
                  glyphs={glyphs}
                  playing={here ? { ayah: recitation.ayah!, word: recitation.word } : null}
                  onWord={(ayah, w, at) => {
                    const words = ayahWords(text.data!, ayah);
                    setWord({
                      word: words[w]!,
                      meaning: extra.data?.m[ayah - 1]?.[w] ?? null,
                      transliteration: translit.data?.[ayah - 1]?.[w] ?? null,
                      at,
                    });
                  }}
                  onActions={openActions}
                />
              );
            }
            const ayah = item;
            const i = ayah - 1;
            const words = ayahWords(text.data!, ayah);
            const meanings = extra.data?.m[i] ?? null;
            const tl = translit.data?.[i] ?? null;
            const here = playingHere && recitation.ayah === ayah;
            return (
              <AyahView
                surah={surah}
                ayah={ayah}
                surahName={name(info)}
                words={words}
                meanings={prefs.wordMeanings && meanings ? meanings : undefined}
                transliteration={prefs.transliteration && tl ? tl : undefined}
                translation={translation ? extra.data?.t[i] : undefined}
                footnotes={extra.data?.f}
                size={size}
                playing={here}
                playingWord={here ? recitation.word : null}
                bookmark={bookmarkCovering(bookmarks, surah, ayah)}
                sajda={sajdaOf(surah, ayah) !== null}
                memorize={memorize}
                firstWordId={wordId(surah, ayah, 1)}
                glyphs={glyphs}
                onWord={(w, at) =>
                  setWord({
                    word: words[w]!,
                    meaning: meanings?.[w] ?? null,
                    transliteration: tl?.[w] ?? null,
                    at,
                  })
                }
                onFootnote={(mark, noteText) => setNote({ mark, text: noteText })}
                onActions={() => openActions(ayah)}
              />
            );
          }}
        />
      )}

      <AudioBar />
      {word && <WordPopover target={word} onClose={() => setWord(null)} />}
      <AyahActions
        target={actions}
        onClose={() => setActions(null)}
        onPlay={(s, a) => recitation.play(s, a)}
        onRepeat={(s, a, plan) => recitation.play(s, a, plan)}
        shareUrl={(s, a) => (webUrl ? `${webUrl}/${locale}/quran/${s}/${a}` : null)}
      />
      <FootnoteSheet note={note} onClose={() => setNote(null)} />
      <ReadingSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        surah={surah}
        view={layout}
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
