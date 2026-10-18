import { prayers } from '@murshid/core';
import { logSources } from '@murshid/data';
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
