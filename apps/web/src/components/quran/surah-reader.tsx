'use client';

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
  type SurahName,
  type SurahText as SurahWords,
  type SurahTranslation,
} from '@murshid/content/quran';
import { bookmarkCovering, translationFor, translationLanguage } from '@murshid/data';
import { surahNameSize, typeScale } from '@murshid/tokens';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Link, useRouter } from '@/i18n/navigation';
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
import { SurahCalligraphy, useReaderTheme, useSurahName } from './common';
import { MemorizeSheet, useMemorize } from './memorize';
import { ReaderBar } from './reader-bar';
import { ReadingSettings, setQuranPrefs, type ReaderView } from './reading-settings';
import { ReadingSurface } from './reading-surface';
import {
  readerMainClass,
  surahNavClass,
  surahNavLinkClass,
  surahOpeningClass,
} from './reader-markup';
import type { ReaderIntent } from './reader-intent';
import { SurahFrame } from './surah-frame';
import { SurahNameOutline } from './surah-name-outline';
import { useRecitation } from './recitation-store';
import { SurahText } from './surah-text';
import type { Tajweed } from './tajweed';

/** The basmalah that opens a surah: the words of Al-Fatihah 1 as published, without its number. */
export function Basmalah({ size }: { size: number }) {
  const text = useLoad(() => loadSurahText(1), 'text/1');
  if (!text.data) return <div style={{ height: size * typeScale.quran.arabic.lineHeight }} />;
  const words = ayahWords(text.data, 1).slice(0, -1);
  return (
    <p
      lang="ar"
      dir="rtl"
      className="text-center font-quran text-ink"
      style={{ fontSize: size, lineHeight: typeScale.quran.arabic.lineHeight }}
    >
      {words.map((w, i) => (i === words.length - 1 ? w.text : w.text + w.after)).join('')}
    </p>
  );
}

function plainTranslation(tr: SurahTranslation | undefined, ayah: number) {
  return tr?.t[ayah - 1]?.filter((s): s is string => typeof s === 'string').join('') ?? null;
}

/**
 * The scrolling reader (SPEC 5.5, Phase 5b): verse by verse with translation, or the Arabic text
 * flowing, as the reading settings choose. Memorizing hides words or markers in either. It takes
 * over the page the server sent (Phase 6) with that page's data, and does what was asked there.
 */
export function SurahReader({
  surah,
  startAyah = 1,
  initial,
  intent = null,
}: {
  surah: number;
  /** Scroll to this ayah once open. */
  startAyah?: number;
  /** The surah's text and translation the page already holds. */
  initial?: {
    text: SurahWords;
    /** The surah's calligraphic name as an outline (the page drew it so; no name font). */
    name?: SurahName;
    translation: { lang: 'en' | 'fr'; data: SurahTranslation } | null;
  };
  /** What was asked on the page before this reader took over. */
  intent?: ReaderIntent | null;
}) {
  const format = useFormatter();
  const t = useTranslations('quran');
  const locale = useLocale();
  const router = useRouter();
  const settings = useSettings();
  const recitation = useRecitation();
  const name = useSurahName();
  const info = surahInfo(surah);
  const prefs = settings?.quran;

  const translation = prefs ? translationFor(prefs, locale) : null;
  // Word meanings come in the translation's language, or the app's (English in Arabic).
  const lang = translation ? translationLanguage[translation] : locale === 'fr' ? 'fr' : 'en';
  const text = useLoad(() => loadSurahText(surah), `text/${surah}`, initial?.text);
  const extra = useLoad(
    () => loadTranslation(lang, surah),
    `${lang}/${surah}`,
    initial?.translation?.lang === lang ? initial.translation.data : undefined,
  );
  const translit = useLoad(() => loadTransliteration(surah), `translit/${surah}`);
  const bookmarks = useBookmarks();
  // Tajweed colors here too, with the 1441H mushaf (its glyphs load only then).
  const theme = useReaderTheme(prefs?.theme);
  const tajweedOn = Boolean(prefs?.tajweed && prefs.edition === 'v4');
  const v4 = useLoad(tajweedOn ? () => loadMushaf('v4') : null, tajweedOn ? 'mushaf/v4' : '');
  const tajweed: Tajweed | null =
    tajweedOn && v4.data && isGlyphMushaf(v4.data) ? { glyphs: v4.data.glyphs, theme } : null;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memorizeOpen, setMemorizeOpen] = useState(false);
  const memorize = useMemorize(prefs?.hide ?? 'off');
  const [word, setWord] = useState<WordTarget | null>(null);
  const [actions, setActions] = useState<ActionsTarget | null>(null);
  const [note, setNote] = useState<{ mark: string; text: string } | null>(null);
  const ayahRefs = useRef(new Map<number, HTMLElement>());

  const size = prefs?.arabicSize ?? typeScale.quran.arabic.size;
  const playingHere = recitation.surah === surah;

  // Open at the ayah asked for, again once the fonts are in (text taking its size moves it).
  const ready = Boolean(text.data);
  useEffect(() => {
    if (!ready || startAyah <= 1) return;
    let live = true;
    const show = () => live && ayahRefs.current.get(startAyah)?.scrollIntoView({ block: 'start' });
    show();
    void document.fonts.ready.then(show);
    return () => {
      live = false;
    };
  }, [ready, startAyah]);

  // Remember the ayah at the top of the screen as the last position.
  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!top) return;
        const ayah = Number((top.target as HTMLElement).dataset.ayah);
        clearTimeout(timer);
        timer = setTimeout(() => saveReadingPosition(surah, ayah), 600);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const el of ayahRefs.current.values()) observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [ready, surah]);

  // Follow the recitation: keep the ayah being recited in view.
  useEffect(() => {
    if (!playingHere || recitation.ayah === null) return;
    const el = ayahRefs.current.get(recitation.ayah);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 96) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [playingHere, recitation.ayah]);

  const bookmarkOf = (ayah: number) => bookmarkCovering(bookmarks, surah, ayah);
  const play = () => {
    if (playingHere && recitation.playing) recitation.pause();
    else if (playingHere && recitation.surah !== null) recitation.resume();
    else recitation.play(surah, 1);
  };
  const toggleView = () => {
    setQuranPrefs({ view: 'mushaf' });
    const position = recitation.surah === surah && recitation.ayah ? recitation.ayah : startAyah;
    router.push(`/quran/page/${pageOf(surah, position, prefs?.edition)}`);
  };
  const openWord = (ayah: number, index: number, el: HTMLElement) => {
    const words = ayahWords(text.data!, ayah);
    setWord({
      word: words[index]!,
      meaning: extra.data?.m[ayah - 1]?.[index] ?? null,
      transliteration: translit.data?.[ayah - 1]?.[index] ?? null,
      rect: el.getBoundingClientRect(),
    });
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
      bookmark: bookmarkOf(ayah),
    });
  };

  // What was asked on the page this reader took over, once what it needs is in.
  const pendingIntent = useRef(intent);
  useEffect(() => {
    const pending = pendingIntent.current;
    if (!pending || !prefs || !text.data) return;
    if (
      (pending.kind === 'word' || pending.kind === 'actions' || pending.kind === 'footnote') &&
      !extra.data
    )
      return;
    pendingIntent.current = null;
    switch (pending.kind) {
      case 'word': {
        const el = ayahRefs.current
          .get(pending.ayah)
          ?.querySelector<HTMLElement>(`[data-word="${pending.index}"]`);
        if (el) openWord(pending.ayah, pending.index, el);
        break;
      }
      case 'actions':
        openActions(pending.ayah);
        break;
      case 'footnote': {
        const text = extra.data?.f[pending.ref];
        if (text) setNote({ mark: pending.mark, text });
        break;
      }
      case 'settings':
        setSettingsOpen(true);
        break;
      case 'memorize':
        setMemorizeOpen(true);
        break;
      case 'play':
        play();
        break;
      case 'view':
        toggleView();
        break;
    }
    // The handlers are this render's; the intent runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, text.data, extra.data]);

  if (!prefs) return null;

  const layout = prefs.layout;
  const onView = (v: ReaderView) => {
    if (v === 'mushaf') toggleView();
    else setQuranPrefs({ view: 'verses', layout: v });
  };

  return (
    <ReadingSurface theme={prefs.theme}>
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
      <main id="main" className={readerMainClass}>
        <div className={surahOpeningClass}>
          <SurahFrame>
            {initial?.name ? (
              <SurahNameOutline name={initial.name} size={surahNameSize.header} />
            ) : (
              <SurahCalligraphy number={surah} size="header" />
            )}
          </SurahFrame>
          {locale !== 'ar' && (
            <Text role="callout" tone="muted">
              {info.nameSimple}
            </Text>
          )}
        </div>
        {info.bismillahPre && (
          <div className="pb-4">
            <Basmalah size={size} />
          </div>
        )}

        {text.error ? (
          <Card className="flex flex-col items-start gap-4 p-6">
            <Text role="body">{navigator.onLine ? t('reader.error') : t('reader.offline')}</Text>
            <Button variant="secondary" onClick={text.retry}>
              {t('reader.retry')}
            </Button>
          </Card>
        ) : !text.data ? (
          <div className="flex flex-col gap-6 py-6" aria-label={t('reader.loading')} aria-busy>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : layout === 'text' ? (
          <SurahText
            surah={surah}
            text={text.data}
            size={size}
            bookmarks={bookmarks}
            memorize={memorize}
            tajweed={tajweed}
            playing={
              playingHere && recitation.ayah
                ? { ayah: recitation.ayah, word: recitation.word }
                : null
            }
            ayahRefs={ayahRefs}
            onWord={openWord}
            onActions={openActions}
          />
        ) : (
          text.data.w.map((_, i) => {
            const ayah = i + 1;
            const words = ayahWords(text.data!, ayah);
            const meanings = extra.data?.m[i] ?? null;
            const tl = translit.data?.[i] ?? null;
            return (
              <AyahView
                key={ayah}
                ref={(el) => {
                  if (el) ayahRefs.current.set(ayah, el);
                  else ayahRefs.current.delete(ayah);
                }}
                surah={surah}
                ayah={ayah}
                surahName={name(info)}
                words={words}
                meanings={prefs.wordMeanings && meanings ? meanings : undefined}
                transliteration={prefs.transliteration && tl ? tl : undefined}
                translation={translation ? extra.data?.t[i] : undefined}
                footnotes={extra.data?.f}
                size={size}
                playing={playingHere && recitation.ayah === ayah}
                playingWord={playingHere && recitation.ayah === ayah ? recitation.word : null}
                bookmark={bookmarkOf(ayah)}
                sajda={sajdaOf(surah, ayah) !== null}
                memorize={memorize}
                firstWordId={wordId(surah, ayah, 1)}
                tajweed={tajweed}
                onWord={(w, el) =>
                  setWord({
                    word: words[w]!,
                    meaning: meanings?.[w] ?? null,
                    transliteration: tl?.[w] ?? null,
                    rect: el.getBoundingClientRect(),
                  })
                }
                onFootnote={(mark, noteText) => setNote({ mark, text: noteText })}
                onActions={() => openActions(ayah)}
              />
            );
          })
        )}

        {text.data && (
          <nav className={surahNavClass}>
            {surah > 1 ? (
              <Link href={`/quran/${surah - 1}`} className={surahNavLinkClass}>
                <Text as="span" role="callout" tone="lantern">
                  {t('reader.previous', { surah: name(surahInfo(surah - 1)) })}
                </Text>
              </Link>
            ) : (
              <span />
            )}
            {surah < 114 && (
              <Link href={`/quran/${surah + 1}`} className={surahNavLinkClass}>
                <Text as="span" role="callout" tone="lantern">
                  {t('reader.next', { surah: name(surahInfo(surah + 1)) })}
                </Text>
              </Link>
            )}
          </nav>
        )}
      </main>

      {word && <WordPopover target={word} onClose={() => setWord(null)} />}
      <AyahActions
        target={actions}
        onClose={() => setActions(null)}
        onPlay={(s, a) => recitation.play(s, a)}
        onRepeat={(s, a, plan) => recitation.play(s, a, plan)}
        shareUrl={(s, a) => `${window.location.origin}/${locale}/quran/${s}/${a}`}
      />
      <FootnoteSheet note={note} onClose={() => setNote(null)} />
      <ReadingSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        prefs={prefs}
        view={layout}
        onView={onView}
      />
      <MemorizeSheet open={memorizeOpen} onOpenChange={setMemorizeOpen} memorize={memorize} />
    </ReadingSurface>
  );
}
