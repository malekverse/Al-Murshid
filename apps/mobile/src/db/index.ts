import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { prayerLogs } from './schema';

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

export const db = drizzle(sqlite, { schema: { prayerLogs } });
export { prayerLogs };
