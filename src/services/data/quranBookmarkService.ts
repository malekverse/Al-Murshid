import { getDb } from '../../store/db';

export interface QuranBookmark {
  id?: number;
  surah_number: number;
  ayah_number: number;
  surah_name: string;
  notes?: string;
  date: string;
  timestamp: number;
  synced?: number;
}

export async function addBookmark(bookmark: Omit<QuranBookmark, 'id' | 'synced'>): Promise<void> {
  const db = getDb();
  const existing = await db.getAllAsync(
    'SELECT id FROM quran_bookmarks WHERE surah_number = ? AND ayah_number = ?',
    bookmark.surah_number, bookmark.ayah_number
  );
  if (existing.length > 0) return;
  await db.runAsync(
    `INSERT INTO quran_bookmarks (surah_number, ayah_number, surah_name, notes, date, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    bookmark.surah_number, bookmark.ayah_number, bookmark.surah_name,
    bookmark.notes || null, bookmark.date, bookmark.timestamp
  );
}

export async function removeBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'DELETE FROM quran_bookmarks WHERE surah_number = ? AND ayah_number = ?',
    surahNumber, ayahNumber
  );
}

export async function isBookmarked(surahNumber: number, ayahNumber: number): Promise<boolean> {
  const db = getDb();
  const rows = await db.getAllAsync(
    'SELECT id FROM quran_bookmarks WHERE surah_number = ? AND ayah_number = ?',
    surahNumber, ayahNumber
  );
  return rows.length > 0;
}

export async function getAllBookmarks(): Promise<QuranBookmark[]> {
  const db = getDb();
  return await db.getAllAsync(
    'SELECT * FROM quran_bookmarks ORDER BY surah_number ASC, ayah_number ASC'
  ) as QuranBookmark[];
}

export async function getBookmarksBySurah(surahNumber: number): Promise<QuranBookmark[]> {
  const db = getDb();
  return await db.getAllAsync(
    'SELECT * FROM quran_bookmarks WHERE surah_number = ? ORDER BY ayah_number ASC',
    surahNumber
  ) as QuranBookmark[];
}
