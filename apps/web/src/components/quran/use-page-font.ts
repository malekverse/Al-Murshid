'use client';

import { editionPages } from '@murshid/content/quran';
import { colors, type ThemeName } from '@murshid/tokens';
import { useEffect, useState } from 'react';

// Each mushaf page has its own font in the Madani editions (SPEC 5.5, 9; Phase 5b: 1405H, 1421H
// and 1441H), served with the app (or from the asset CDN once there is one). A page's font loads
// when the page is shown; its neighbours follow.

export type GlyphEdition = 'v1' | 'v2' | 'v4';

const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? '';
const loads = new Map<string, Promise<void>>();

export const pageFontFamily = (page: number, edition: GlyphEdition = 'v2') =>
  `qcf-${edition}-p${page}`;

function loadPageFont(page: number, edition: GlyphEdition): Promise<void> {
  const key = `${edition}:${page}`;
  let p = loads.get(key);
  if (!p) {
    const face = new FontFace(
      pageFontFamily(page, edition),
      `url(${base}/fonts/quran-${edition}/p${page}.ttf)`,
      { display: 'block' },
    );
    p = face.load().then((loaded) => {
      document.fonts.add(loaded);
    });
    // A failed download (offline) may succeed later.
    p.catch(() => loads.delete(key));
    loads.set(key, p);
  }
  return p;
}

export type FontState = 'loading' | 'ready' | 'error';

/** A page's font, for an edition drawn with page fonts; null (the Indopak mushaf) needs none. */
export function usePageFont(
  page: number,
  edition: GlyphEdition | null = 'v2',
  neighbours = true,
): { state: FontState; retry: () => void } {
  const [states, setStates] = useState<Record<string, FontState>>({});
  const [attempt, setAttempt] = useState(0);
  const key = `${edition}:${page}`;
  useEffect(() => {
    if (!edition) return;
    let live = true;
    loadPageFont(page, edition).then(
      () => live && setStates((s) => ({ ...s, [key]: 'ready' })),
      () => live && setStates((s) => ({ ...s, [key]: 'error' })),
    );
    // The pages either side, so turning a page is instant.
    if (neighbours) {
      for (const next of [page + 1, page - 1, page + 2]) {
        if (next >= 1 && next <= editionPages[edition]) {
          loadPageFont(next, edition).catch(() => {});
        }
      }
    }
    return () => {
      live = false;
    };
  }, [page, edition, key, attempt, neighbours]);
  return {
    state: edition ? (states[key] ?? 'loading') : 'ready',
    retry: () => {
      setStates((s) => ({ ...s, [key]: 'loading' }));
      setAttempt((a) => a + 1);
    },
  };
}

// ---------- Tajweed colors (the 1441H fonts) ----------

// The 1441H page fonts are color fonts (COLRv0) with six palettes: tajweed colors for light and
// dark pages (0, 1), another light set (2), and the same without tajweed colors (3, 4, 5). The
// page picks one; its ink takes the reader's own ink, and the ayah markers' ornaments (entries 10
// to 12, colored rings in print) become an ink ring on the page's own color, as in the other
// editions, so only the tajweed colors stand out. Entry 14 draws nothing but hairline rings around
// the last vowel of 3,073 words (the vowel dropped when stopping there): a study aid the printed
// mushaf does not have, which at reading sizes looks like stray boxes, so it is left out. Letters,
// vowels and pause marks are never on it (docs/DECISIONS.md, Phase 5b).

/** The palette entries that are the text's ink: the rest are tajweed colors and ornaments. */
const inkEntries = [0, 10, 11, 13];
/** Without tajweed, every entry is ink but the markers' fill and the rings. */
const plainEntries = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15];
/** The ayah markers' fill. */
const fillEntry = 12;
/** The rings around stopping vowels. */
const ringEntry = 14;
const declared = new Set<string>();

/**
 * The `font-palette` to draw a 1441H page with: tajweed colors or plain, in the reader's theme. Its
 * @font-palette-values rule is declared once per page font, theme and mode.
 */
export function tajweedPalette(page: number, theme: ThemeName, tajweed: boolean): string {
  const family = pageFontFamily(page, 'v4');
  const name = `--${family}-${tajweed ? 'tajweed' : 'plain'}-${theme}`;
  if (!declared.has(name) && typeof document !== 'undefined') {
    const dark = theme === 'dark';
    const base = tajweed ? (dark ? 1 : 0) : dark ? 4 : 3;
    const { ink, canvas } = colors[theme];
    const overrides = [
      ...(tajweed ? inkEntries : plainEntries).map((i) => `${i} ${ink}`),
      `${fillEntry} ${canvas}`,
      `${ringEntry} transparent`,
    ].join(', ');
    const style = document.createElement('style');
    style.textContent = `@font-palette-values ${name} { font-family: ${family}; base-palette: ${base}; override-colors: ${overrides}; }`;
    document.head.appendChild(style);
    declared.add(name);
  }
  return name;
}
