import { prayers } from '@murshid/core';
import { bookmarkColors, logSources } from '@murshid/data';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** One row per prayer per day (SPEC 9's prayer_logs, local side). Un-logging keeps a tombstone. */
export const prayerLogs = sqliteTable(
  'prayer_logs',
  {
    date: text('date').notNull(),
    prayer: text('prayer', { enum: prayers }).notNull(),
    loggedAt: text('logged_at').notNull(),
    source: text('source', { enum: logSources }).notNull(),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.date, t.prayer] })],
);

/** Ramadan's fasts and Taraweeh (SPEC 5.8), one row per date. */
export const ramadanLogs = sqliteTable('ramadan_logs', {
  date: text('date').primaryKey(),
  /** True for "fasted", false for "not today", null until the person says. */
  fasted: integer('fasted', { mode: 'boolean' }),
  taraweeh: integer('taraweeh', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Night reflections (SPEC 5.7), never synced (SPEC 9). Only the evening's date is readable:
 * the fields are sealed with AES-GCM (IV, ciphertext and tag together, base64).
 */
export const reflections = sqliteTable('reflections', {
  date: text('date').primaryKey(),
  sealed: text('sealed').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Quran bookmarks (SPEC 9's quran_bookmarks, local side). Removing keeps a tombstone. */
export const quranBookmarks = sqliteTable('quran_bookmarks', {
  id: text('id').primaryKey(),
  surah: integer('surah').notNull(),
  ayah: integer('ayah').notNull(),
  /** The last ayah of a marked passage (Phase 5b); null marks one ayah. */
  ayahEnd: integer('ayah_end'),
  color: text('color', { enum: bookmarkColors }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});
