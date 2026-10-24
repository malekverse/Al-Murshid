// The landing page's prayer times, computed before each build and dev start (SPEC 4, Phase 7c):
// public/zones/<time zone>.json holds the zone's main city and its times from yesterday through
// the next two months. The page's sky reads one small file instead of shipping the calculation;
// past the table's end (no build for two months) it computes them itself.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import table from '@murshid/content/zones';
import { addDays, civilDate, defaultMethodFor, encodeZoneTimes, prayerTimes } from '@murshid/core';

const DAYS = 62;
const out = join(import.meta.dirname, '../public/zones');
const zones = table.zones as unknown as Record<
  string,
  [number, number, string, string, string, string]
>;

rmSync(out, { recursive: true, force: true });
const now = new Date();
for (const [zone, [latitude, longitude, en, ar, fr, country]] of Object.entries(zones)) {
  const place = { latitude, longitude };
  const settings = {
    method: defaultMethodFor(country),
    asr: 'standard',
    highLatitude: 'auto',
  } as const;
  const first = addDays(civilDate(now, zone), -1);
  const days = Array.from({ length: DAYS }, (_, i) =>
    prayerTimes(place, addDays(first, i), settings),
  );
  const file = join(out, `${zone}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    JSON.stringify({
      names: { en, ar, fr },
      country,
      latitude,
      longitude,
      ...encodeZoneTimes(days),
    }),
  );
}
console.log(`Prayer times for ${Object.keys(zones).length} time zones written to public/zones`);
