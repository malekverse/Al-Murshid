'use client';

import type { Locale } from '@murshid/i18n';
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { loadMessages } from '@/lib/lazy-messages';
import { readIntent, type ReaderIntent } from './reader-intent';
import type { UpgradedReaderProps } from './upgraded-reader';

// The surah page the server sends is complete to read (Phase 6): text, translation, links. This
// island hands it to the full reader, with identical layout, on the first touch of anything the
// reader does (a word, an ayah's actions, a footnote, the bar's buttons), then does what was
// touched. Someone who uses the app (their settings are here) gets the full reader at once.

/** The app has been set up in this browser: its reader, settings and bookmarks apply. */
function usesApp(): boolean {
  try {
    const raw = localStorage.getItem('murshid-settings');
    return Boolean(raw && (JSON.parse(raw) as { onboarded?: unknown }).onboarded === true);
  } catch {
    return false;
  }
}

/** The ayah named by the address (`#ayah-255`), if any. */
function anchoredAyah(): number | undefined {
  const match = /^#ayah-(\d+)$/.exec(location.hash);
  return match ? Number(match[1]) : undefined;
}

export function ReaderUpgrade({
  locale,
  surah,
  translationLang,
  children,
}: {
  locale: Locale;
  surah: number;
  /** The translation the page shows, if any (the reader starts from the same data). */
  translationLang: 'en' | 'fr' | null;
  children: ReactNode;
}) {
  const [reader, setReader] = useState<{
    Reader: ComponentType<UpgradedReaderProps>;
    props: UpgradedReaderProps;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  // The latest touch: one made while the reader is on its way is done when it arrives.
  const latestIntent = useRef<ReaderIntent | null>(null);

  const upgrade = async (intent: ReaderIntent | null, startAyah?: number) => {
    if (intent) latestIntent.current = intent;
    if (started.current) return;
    started.current = true;
    try {
      const [{ UpgradedReader }, messages, content] = await Promise.all([
        import('./upgraded-reader'),
        loadMessages(locale),
        import('@murshid/content/quran'),
      ]);
      const [text, translation, name] = await Promise.all([
        content.loadSurahText(surah),
        translationLang ? content.loadTranslation(translationLang, surah) : null,
        content.loadSurahName(surah),
      ]);
      setReader({
        Reader: UpgradedReader,
        props: {
          locale,
          messages,
          surah,
          startAyah,
          intent: latestIntent.current,
          initial: {
            text,
            name,
            translation:
              translationLang && translation ? { lang: translationLang, data: translation } : null,
          },
        },
      });
    } catch {
      // Offline, or a failed chunk: the page stays as it is, and the next touch tries again.
      started.current = false;
      setBusy(false);
    }
  };

  // Someone who uses the app gets their reader (settings, bookmarks, tajweed) at once.
  useEffect(() => {
    if (!usesApp()) return;
    const start = anchoredAyah();
    queueMicrotask(() => void upgrade(null, start));
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opened at an ayah (`#ayah-255`): the browser scrolls there before the ayahs above it take
  // their real size (they are laid out only when near, ayahClass), which pushes it down, and so
  // can the fonts arriving. So it is put back at the top after the first frames and once the
  // fonts are in, unless the reader has moved meanwhile.
  useEffect(() => {
    const ayah = anchoredAyah();
    if (!ayah) return;
    let moved = false;
    const move = () => {
      moved = true;
    };
    const show = () => {
      if (!moved) document.getElementById(`ayah-${ayah}`)?.scrollIntoView({ block: 'start' });
    };
    const events = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;
    for (const e of events) window.addEventListener(e, move, { passive: true });
    let frame = requestAnimationFrame(() => {
      show();
      frame = requestAnimationFrame(show);
    });
    void document.fonts.ready.then(show);
    return () => {
      moved = true;
      cancelAnimationFrame(frame);
      for (const e of events) window.removeEventListener(e, move);
    };
  }, []);

  // A visitor's reading position is kept too, as the reader keeps it, so "Continue reading" works.
  useEffect(() => {
    if (reader) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!top) return;
        const { ayah, page } = (top.target as HTMLElement).dataset;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            localStorage.setItem(
              'murshid-reading',
              JSON.stringify({
                surah,
                ayah: Number(ayah),
                page: Number(page),
                at: new Date().toISOString(),
              }),
            );
          } catch {
            // Storage blocked: nothing to keep.
          }
        }, 600);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const el of document.querySelectorAll('article[data-ayah][data-page]'))
      observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [reader, surah]);

  if (reader) return <reader.Reader {...reader.props} />;
  return (
    <div
      className="contents"
      aria-busy={busy || undefined}
      onClickCapture={(e) => {
        const intent = readIntent(e.target as Element);
        if (!intent) return;
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        void upgrade(intent);
      }}
    >
      {children}
    </div>
  );
}
