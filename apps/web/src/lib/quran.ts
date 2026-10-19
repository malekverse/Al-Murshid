'use client';

import { pageOf } from '@murshid/content/quran';
import {
  newBookmark,
  parseKhatmah,
  parseReadingPosition,
  type BookmarkColor,
  type QuranBookmark,
} from '@murshid/data';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from './db';
import { localValue } from './local-value';

// The reader's personal data on web (SPEC 9): the last position and the khatmah plan in
// localStorage, bookmarks in IndexedDB. Nothing leaves the browser until sync (Phase 8).

export const readingPosition = localValue('murshid-reading', parseReadingPosition);
export const khatmahStore = localValue('murshid-khatmah', parseKhatmah);

export function saveReadingPosition(surah: number, ayah: number, page = pageOf(surah, ayah)) {
  const current = readingPosition.read();
  if (current && current.surah === surah && current.ayah === ayah && current.page === page) return;
  readingPosition.write({ surah, ayah, page, at: new Date().toISOString() });
}

/** Bookmarks, most recent first, live. */
export function useBookmarks(): QuranBookmark[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.bookmarks.toArray();
    return rows.filter((b) => !b.deleted).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });
}

/**
 * Marks an ayah, or a passage up to `ayahEnd`, in a color; or removes the bookmark starting at
 * that ayah (null). A bookmark already starting there keeps its passage unless a new end is given.
 */
export async function setBookmark(
  surah: number,
  ayah: number,
  color: BookmarkColor | null,
  ayahEnd?: number | null,
) {
  const existing = (await db.bookmarks.where({ surah, ayah }).toArray()).find((b) => !b.deleted);
  const now = new Date().toISOString();
  if (color === null) {
    if (existing) await db.bookmarks.update(existing.id, { deleted: true, updatedAt: now });
  } else if (existing) {
    const end = ayahEnd === undefined ? (existing.ayahEnd ?? null) : ayahEnd;
    await db.bookmarks.update(existing.id, {
      color,
      ayahEnd: end !== null && end > ayah ? end : null,
      updatedAt: now,
    });
  } else {
    await db.bookmarks.put(newBookmark(surah, ayah, color, ayahEnd ?? null));
  }
}

export interface Loaded<T> {
  data: T | undefined;
  error: unknown;
  retry: () => void;
}

/**
 * Loads reading data (a surah's words, a translation, the mushaf) named by `key`. Data shows only
 * for the key asked, and a failed load (offline) can be retried.
 */
export function useLoad<T>(load: (() => Promise<T>) | null, key: string): Loaded<T> {
  const [state, setState] = useState<{ key: string; data?: T; error?: unknown }>({ key: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!load) return;
    let live = true;
    load().then(
      (data) => live && setState({ key, data }),
      (error: unknown) => live && setState((s) => ({ ...s, key, error })),
    );
    return () => {
      live = false;
    };
    // `load` is recreated each render; `key` names what it loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return {
    data: load && state.key === key ? state.data : undefined,
    error: state.key === key ? state.error : undefined,
    retry: () => setAttempt((a) => a + 1),
  };
}
