import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { prayerLogs, quranBookmarks, ramadanLogs, reflections } from './schema';

// The personal database (SPEC 8.3): expo-sqlite with Drizzle for queries. Migrations are plain
// SQL run in order and tracked with SQLite's user_version, so nothing needs a bundler plugin.

const migrations = [
  `CREATE TABLE IF NOT EXISTS prayer_logs (
     date TEXT NOT NULL,
     prayer TEXT NOT NULL,
     logged_at TEXT NOT NULL,
     source TEXT NOT NULL,
     deleted INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (date, prayer)
   );
   CREATE INDEX IF NOT EXISTS prayer_logs_date ON prayer_logs (date);`,
  `CREATE TABLE IF NOT EXISTS quran_bookmarks (
     id TEXT PRIMARY KEY NOT NULL,
     surah INTEGER NOT NULL,
     ayah INTEGER NOT NULL,
     color TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     deleted INTEGER NOT NULL DEFAULT 0
   );
   CREATE INDEX IF NOT EXISTS quran_bookmarks_ayah ON quran_bookmarks (surah, ayah);`,
  // Phase 5b: a bookmark may mark a passage, up to ayah_end.
  `ALTER TABLE quran_bookmarks ADD COLUMN ayah_end INTEGER;`,
  // Phase 7: Ramadan's fasts and Taraweeh, one row per date.
  `CREATE TABLE IF NOT EXISTS ramadan_logs (
     date TEXT PRIMARY KEY NOT NULL,
     fasted INTEGER,
     taraweeh INTEGER NOT NULL DEFAULT 0,
     updated_at TEXT NOT NULL
   );`,
  // Phase 7: night reflections, sealed.
  `CREATE TABLE IF NOT EXISTS reflections (
     date TEXT PRIMARY KEY NOT NULL,
     sealed TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );`,
];

const sqlite = openDatabaseSync('murshid.db', { enableChangeListener: true });

function migrate() {
  const version =
    sqlite.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  for (let v = version; v < migrations.length; v++) {
    sqlite.withTransactionSync(() => {
      sqlite.execSync(migrations[v]!);
      sqlite.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
migrate();

export const db = drizzle(sqlite, {
  schema: { prayerLogs, quranBookmarks, ramadanLogs, reflections },
});
export { prayerLogs, quranBookmarks, ramadanLogs, reflections };
