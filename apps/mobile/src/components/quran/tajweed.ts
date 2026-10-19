import { pageOfWord } from '@murshid/content/quran';
import { pageFontFamily, usePageFont } from '@/lib/quran-files';

// Tajweed colors in the verse views (Phase 5b): each word drawn with its glyph from the 1441H
// mushaf, in its page's color font, the same source as the mushaf itself. Until those fonts are
// in, the words show as published, so reading never waits. The list only mounts rows near the
// screen, so only their pages' fonts load.

/**
 * How to draw words `first` to `last` (ids) with tajweed: each word's glyph and font, or null
 * while tajweed is off (no glyphs) or its fonts are not in yet. A run of words spans at most two
 * pages.
 */
export function useTajweedGlyphs(
  glyphs: string[] | null,
  first: number,
  last: number,
): ((id: number) => { glyph: string; fontFamily: string }) | null {
  const edition = glyphs ? 'v4' : null;
  const a = usePageFont(pageOfWord(first, 'v4'), edition, false);
  const b = usePageFont(pageOfWord(last, 'v4'), edition, false);
  if (!glyphs || a.state !== 'ready' || b.state !== 'ready') return null;
  return (id) => ({
    glyph: glyphs[id - 1]!,
    fontFamily: pageFontFamily(pageOfWord(id, 'v4'), 'v4'),
  });
}
