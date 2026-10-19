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

/** Quran bookmarks (SPEC 9's quran_bookmarks, local side). Removing keeps a tombstone. */
export const quranBookmarks = sqliteTable('quran_bookmarks', {
  id: text('id').primaryKey(),
  surah: integer('surah').notNull(),
  ayah: integer('ayah').notNull(),
  color: text('color', { enum: bookmarkColors }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});
