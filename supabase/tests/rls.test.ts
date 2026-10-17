// Row Level Security tests (SPEC 9: "RLS on every table, with RLS tests in CI").
//
// Runs the real migrations in PGlite (Postgres compiled to WebAssembly), so it needs no Docker
// and runs the same on a laptop and in CI. A small stand-in recreates the parts of Supabase the
// policies rely on: the auth schema, auth.uid() and the anon / authenticated roles.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const AMINA = '11111111-1111-4111-8111-111111111111';
const YASSINE = '22222222-2222-4222-8222-222222222222';

const syncedTables = [
  'profiles',
  'settings',
  'prayer_logs',
  'fasting_logs',
  'journey_state',
  'reading_progress',
  'quran_bookmarks',
  'khatmah_plans',
  'tasbih_daily',
];

const supabaseStandIn = `
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  -- Supabase grants table privileges broadly and relies on RLS; mirror that.
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

let db: PGlite;

/** Run statements as a signed-in user (or anon when userId is null), then return to superuser. */
async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${userId ? 'authenticated' : 'anon'}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

async function logPrayer(userId: string, prayer: string, date = '2026-10-17') {
  return db.query(
    `insert into public.prayer_logs (user_id, date, prayer, logged_at) values ($1, $2, $3, now())`,
    [userId, date, prayer],
  );
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(supabaseStandIn);
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.exec(`truncate auth.users cascade`);
  await db.query(`insert into auth.users (id) values ($1), ($2)`, [AMINA, YASSINE]);
});

describe('row level security', () => {
  it('is enabled and forced on every table in public', async () => {
    const { rows } = await db.query<{ relname: string; on: boolean; forced: boolean }>(`
      select c.relname, c.relrowsecurity as on, c.relforcerowsecurity as forced
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`);
    expect(rows.map((r) => r.relname).sort()).toEqual([...syncedTables].sort());
    for (const row of rows) {
      expect(row, row.relname).toMatchObject({ on: true, forced: true });
    }
  });

  it('lets a user write and read their own rows', async () => {
    await as(AMINA, () => logPrayer(AMINA, 'fajr'));
    const { rows } = await as(AMINA, () => db.query(`select prayer from public.prayer_logs`));
    expect(rows).toEqual([{ prayer: 'fajr' }]);
  });

  it("never shows one user another user's rows", async () => {
    await as(AMINA, () => logPrayer(AMINA, 'fajr'));
    await as(YASSINE, () => logPrayer(YASSINE, 'asr'));
    const { rows } = await as(YASSINE, () =>
      db.query<{ user_id: string }>(`select user_id from public.prayer_logs`),
    );
    expect(rows).toEqual([{ user_id: YASSINE }]);
  });

  it('refuses writing rows for someone else, on every table', async () => {
    const attempts: Record<string, string> = {
      profiles: `insert into public.profiles (user_id) values ('${YASSINE}')`,
      settings: `insert into public.settings (user_id) values ('${YASSINE}')`,
      prayer_logs: `insert into public.prayer_logs (user_id, date, prayer, logged_at) values ('${YASSINE}', '2026-10-17', 'isha', now())`,
      fasting_logs: `insert into public.fasting_logs (user_id, date, fasted) values ('${YASSINE}', '2026-10-17', true)`,
      journey_state: `insert into public.journey_state (user_id, track, current_step) values ('${YASSINE}', 'prayer', 'one-prayer')`,
      reading_progress: `insert into public.reading_progress (user_id, surah, ayah) values ('${YASSINE}', 1, 1)`,
      quran_bookmarks: `insert into public.quran_bookmarks (user_id, surah, ayah) values ('${YASSINE}', 2, 255)`,
      khatmah_plans: `insert into public.khatmah_plans (user_id, start_date, pages_per_day) values ('${YASSINE}', '2026-10-17', 4)`,
      tasbih_daily: `insert into public.tasbih_daily (user_id, date, phrase, device_id, count) values ('${YASSINE}', '2026-10-17', 'subhanallah', gen_random_uuid(), 33)`,
    };
    expect(Object.keys(attempts).sort()).toEqual([...syncedTables].sort());
    for (const [table, sql] of Object.entries(attempts)) {
      await expect(
        as(AMINA, () => db.exec(sql)),
        table,
      ).rejects.toThrow(/row-level security/);
    }
  });

  it("cannot update, re-own or delete someone else's rows", async () => {
    await as(YASSINE, () => logPrayer(YASSINE, 'maghrib'));

    const updated = await as(AMINA, () =>
      db.query(`update public.prayer_logs set deleted = true where user_id = $1`, [YASSINE]),
    );
    expect(updated.affectedRows).toBe(0);

    await as(AMINA, () => logPrayer(AMINA, 'dhuhr'));
    await expect(
      as(AMINA, () => db.query(`update public.prayer_logs set user_id = $1`, [YASSINE])),
    ).rejects.toThrow(/row-level security/);

    const deleted = await as(AMINA, () =>
      db.query(`delete from public.prayer_logs where user_id = $1`, [YASSINE]),
    );
    expect(deleted.affectedRows).toBe(0);
  });

  it('gives signed-out visitors no access at all', async () => {
    await as(AMINA, () => logPrayer(AMINA, 'fajr'));
    await expect(as(null, () => db.query(`select * from public.prayer_logs`))).rejects.toThrow(
      /permission denied/,
    );
    await expect(as(null, () => logPrayer(AMINA, 'asr'))).rejects.toThrow(/permission denied/);
  });
});

describe('sync columns', () => {
  it('sets server_updated_at from the server clock, ignoring the client', async () => {
    await as(AMINA, () =>
      db.query(
        `insert into public.fasting_logs (user_id, date, fasted, server_updated_at)
         values ($1, '2026-03-01', true, '2000-01-01')`,
        [AMINA],
      ),
    );
    const { rows } = await db.query<{ recent: boolean }>(
      `select server_updated_at > now() - interval '1 minute' as recent from public.fasting_logs`,
    );
    expect(rows[0]?.recent).toBe(true);
  });

  it('logging the same prayer twice is idempotent with an upsert', async () => {
    const upsert = () =>
      db.query(
        `insert into public.prayer_logs (user_id, date, prayer, logged_at, source)
         values ($1, '2026-10-17', 'asr', now(), 'notification')
         on conflict (user_id, date, prayer) do update set deleted = false, updated_at = now()`,
        [AMINA],
      );
    await as(AMINA, upsert);
    await as(AMINA, upsert);
    const { rows } = await db.query(`select 1 from public.prayer_logs`);
    expect(rows).toHaveLength(1);
  });

  it('stores coordinates rounded to about 1 km', async () => {
    await as(AMINA, () =>
      db.query(`insert into public.settings (user_id, latitude, longitude) values ($1, $2, $3)`, [
        AMINA,
        36.806495,
        10.181532,
      ]),
    );
    const { rows } = await db.query<{ latitude: string; longitude: string }>(
      `select latitude::text, longitude::text from public.settings`,
    );
    expect(rows[0]).toEqual({ latitude: '36.81', longitude: '10.18' });
  });

  it('rejects values outside their domain', async () => {
    await expect(as(AMINA, () => logPrayer(AMINA, 'brunch'))).rejects.toThrow(/check constraint/);
    await expect(
      as(AMINA, () =>
        db.query(`insert into public.settings (user_id, hijri_offset) values ($1, 3)`, [AMINA]),
      ),
    ).rejects.toThrow(/check constraint/);
  });
});

describe('account deletion', () => {
  it('removes every row of the user and nothing else', async () => {
    await as(AMINA, async () => {
      await logPrayer(AMINA, 'fajr');
      await db.query(`insert into public.profiles (user_id) values ($1)`, [AMINA]);
      await db.query(
        `insert into public.quran_bookmarks (user_id, surah, ayah) values ($1, 18, 10)`,
        [AMINA],
      );
    });
    await as(YASSINE, () => logPrayer(YASSINE, 'isha'));

    await db.query(`delete from auth.users where id = $1`, [AMINA]);

    for (const table of syncedTables) {
      const { rows } = await db.query(`select 1 from public.${table} where user_id = $1`, [AMINA]);
      expect(rows, table).toHaveLength(0);
    }
    const { rows } = await db.query(`select 1 from public.prayer_logs where user_id = $1`, [
      YASSINE,
    ]);
    expect(rows).toHaveLength(1);
  });
});
