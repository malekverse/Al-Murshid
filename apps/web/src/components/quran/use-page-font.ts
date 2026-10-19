'use client';

import { PAGE_COUNT } from '@murshid/content/quran';
import { useEffect, useState } from 'react';

// Each mushaf page has its own QCF V2 font (SPEC 5.5, 9), served with the app (or from the asset
// CDN once there is one). A page's font loads when the page is shown; its neighbours follow.

const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? '';
const loads = new Map<number, Promise<void>>();

export const pageFontFamily = (page: number) => `qcf-p${page}`;

function loadPageFont(page: number): Promise<void> {
  let p = loads.get(page);
  if (!p) {
    const face = new FontFace(pageFontFamily(page), `url(${base}/fonts/quran-v2/p${page}.ttf)`, {
      display: 'block',
    });
    p = face.load().then((loaded) => {
      document.fonts.add(loaded);
    });
    // A failed download (offline) may succeed later.
    p.catch(() => loads.delete(page));
    loads.set(page, p);
  }
  return p;
}

export type FontState = 'loading' | 'ready' | 'error';

export function usePageFont(
  page: number,
  neighbours = true,
): { state: FontState; retry: () => void } {
  const [states, setStates] = useState<Record<number, FontState>>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadPageFont(page).then(
      () => live && setStates((s) => ({ ...s, [page]: 'ready' })),
      () => live && setStates((s) => ({ ...s, [page]: 'error' })),
    );
    // The pages either side, so turning a page is instant.
    if (neighbours) {
      for (const next of [page + 1, page - 1, page + 2]) {
        if (next >= 1 && next <= PAGE_COUNT) loadPageFont(next).catch(() => {});
      }
    }
    return () => {
      live = false;
    };
  }, [page, attempt, neighbours]);
  return {
    state: states[page] ?? 'loading',
    retry: () => {
      setStates((s) => ({ ...s, [page]: 'loading' }));
      setAttempt((a) => a + 1);
    },
  };
}
