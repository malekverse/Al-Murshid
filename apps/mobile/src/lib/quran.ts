import { pageOf } from '@murshid/content/quran';
import {
  newBookmark,
  parseKhatmah,
  parseReadingPosition,
  type BookmarkColor,
  type QuranBookmark,
} from '@murshid/data';
import { and, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { db, quranBookmarks } from '@/db';
import { mmkvValue } from './mmkv-value';

// The reader's personal data on the phone (SPEC 9): the last position and the khatmah plan in
// MMKV, bookmarks in SQLite. Nothing leaves the device until sync (Phase 8).

export const readingPosition = mmkvValue('reading-position', parseReadingPosition);
export const khatmahStore = mmkvValue('khatmah', parseKhatmah);

export function saveReadingPosition(surah: number, ayah: number, page = pageOf(surah, ayah)) {
  const current = readingPosition.read();
  if (current && current.surah === surah && current.ayah === ayah && current.page === page) return;
  readingPosition.write({ surah, ayah, page, at: new Date().toISOString() });
}

/** Bookmarks, most recent first, live. */
export function useBookmarks(): QuranBookmark[] | undefined {
  const { data, updatedAt } = useLiveQuery(
    db.select().from(quranBookmarks).where(eq(quranBookmarks.deleted, false)),
  );
  if (!updatedAt) return undefined;
  return [...data].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Marks an ayah, or a passage up to `ayahEnd`, in a color; or removes the bookmark starting at
 * that ayah (null). A bookmark already starting there keeps its passage unless a new end is given.
 */
export function setBookmark(
  surah: number,
  ayah: number,
  color: BookmarkColor | null,
  ayahEnd?: number | null,
) {
  const existing = db
    .select()
    .from(quranBookmarks)
    .where(
      and(
        eq(quranBookmarks.surah, surah),
        eq(quranBookmarks.ayah, ayah),
        eq(quranBookmarks.deleted, false),
      ),
    )
    .get();
  const now = new Date().toISOString();
  if (color === null) {
    if (existing) {
      db.update(quranBookmarks)
        .set({ deleted: true, updatedAt: now })
        .where(eq(quranBookmarks.id, existing.id))
        .run();
    }
  } else if (existing) {
    const end = ayahEnd === undefined ? existing.ayahEnd : ayahEnd;
    db.update(quranBookmarks)
      .set({ color, ayahEnd: end !== null && end > ayah ? end : null, updatedAt: now })
      .where(eq(quranBookmarks.id, existing.id))
      .run();
  } else {
    db.insert(quranBookmarks)
      .values(newBookmark(surah, ayah, color, ayahEnd ?? null))
      .run();
  }
}

export interface Loaded<T> {
  data: T | undefined;
  error: unknown;
  retry: () => void;
}

/** Loads reading data named by `key`; data shows only for the key asked. */
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
