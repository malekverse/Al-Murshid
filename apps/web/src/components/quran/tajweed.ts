'use client';

import { pageOfWord } from '@murshid/content/quran';
import type { ThemeName } from '@murshid/tokens';
import { useCallback, useState, type CSSProperties } from 'react';
import { pageFontFamily, tajweedPalette, usePageFont } from './use-page-font';

// Tajweed colors in the verse views (Phase 5b): each word drawn with its glyph from the 1441H
// mushaf, in its page's color font, the same source as the mushaf itself. Until those fonts are
// in, the words show as published, so reading never waits.

/** The 1441H glyphs and the reader's theme, when tajweed is on. */
export interface Tajweed {
  glyphs: string[];
  theme: ThemeName;
}

/**
 * Whether an element has come on screen or close to it (fonts load just ahead of the reader): a
 * ref for the element, and the answer, which stays true once it is.
 */
export function useNearViewport(): [(el: Element | null) => (() => void) | undefined, boolean] {
  const [near, setNear] = useState(false);
  const observe = useCallback((el: Element | null) => {
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [observe, near];
}

/**
 * How to draw words `first` to `last` (ids) with tajweed: a glyph and its style per word, or null
 * while tajweed is off or its fonts are not in yet. A run of words spans at most two pages.
 */
export function useTajweedWords(
  tajweed: Tajweed | null,
  first: number,
  last: number,
  near: boolean,
): ((id: number) => { glyph: string; style: CSSProperties }) | null {
  const firstPage = pageOfWord(first, 'v4');
  const lastPage = pageOfWord(last, 'v4');
  const load = tajweed && near ? 'v4' : null;
  const a = usePageFont(firstPage, load, false);
  const b = usePageFont(lastPage, load, false);
  if (!tajweed || !load || a.state !== 'ready' || b.state !== 'ready') return null;
  return (id) => {
    const page = pageOfWord(id, 'v4');
    return {
      glyph: tajweed.glyphs[id - 1]!,
      style: {
        fontFamily: pageFontFamily(page, 'v4'),
        fontPalette: tajweedPalette(page, tajweed.theme, true),
      },
    };
  };
}
