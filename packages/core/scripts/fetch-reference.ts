// Fetch independent reference prayer times from the Aladhan API (a separate implementation of
// the same methods) and save them as a test fixture. Run rarely; the fixture is committed so the
// accuracy test (SPEC 11: within 1 minute, 20+ cities, high latitudes, DST) runs offline.
//
//   pnpm --filter @murshid/core reference

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CalculationMethod } from 'adhan';
import { HIGH_LATITUDE } from '../src/prayer-times';
import { methods, type MethodId } from '../src/methods';
import { cities, type ReferenceCity } from '../src/reference-cities';

// Aladhan method ids for our methods (https://api.aladhan.com/v1/methods).
const aladhanMethod: Record<MethodId, number> = {
  karachi: 1,
  isna: 2,
  mwl: 3,
  'umm-al-qura': 4,
  egypt: 5,
  gulf: 8,
  kuwait: 9,
  qatar: 10,
  singapore: 11,
  uoif: 12,
  turkey: 13,
  moonsighting: 15,
  dubai: 16,
  jakim: 17,
  tunisia: 18,
  algeria: 19,
  kemenag: 20,
  morocco: 21,
  jordan: 23,
};

/**
 * adhan-js adds small minute adjustments to some methods; pass the same to Aladhan. Our own
 * method minutes (Morocco, Jordan) are not passed: Aladhan's methods 21 and 23 include them, so
 * the comparison checks them independently.
 */
function tune(method: MethodId): string {
  const def = methods[method];
  const adj = def.adhan
    ? CalculationMethod[def.adhan]().methodAdjustments
    : { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  // Aladhan order: Imsak, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Sunset, Isha, Midnight
  return [0, adj.fajr, adj.sunrise, adj.dhuhr, adj.asr, adj.maghrib, 0, adj.isha, 0].join(',');
}

const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('-');

async function fetchDay(city: ReferenceCity, date: string) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    method: String(aladhanMethod[city.method]),
    school: '0',
    // adhan's recommended rule: one seventh of the night above 48°, middle of the night below.
    latitudeAdjustmentMethod: Math.abs(city.latitude) > HIGH_LATITUDE ? '2' : '1',
    timezonestring: city.timeZone,
    tune: tune(city.method),
    iso8601: 'true',
  });
  const url = `https://api.aladhan.com/v1/timings/${ddmmyyyy(date)}?${params}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const body = (await res.json()) as { data: { timings: Record<string, string> } };
      const t = body.data.timings;
      return {
        fajr: t.Fajr,
        sunrise: t.Sunrise,
        dhuhr: t.Dhuhr,
        asr: t.Asr,
        maghrib: t.Maghrib,
        isha: t.Isha,
      };
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error(`Aladhan request failed: ${url}`);
}

async function main() {
  const entries = [];
  for (const city of cities) {
    for (const date of city.dates) {
      entries.push({ city: city.name, date, times: await fetchDay(city, date) });
      await new Promise((r) => setTimeout(r, 150));
    }
    console.log(`✓ ${city.name}`);
  }
  const out = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'fixtures',
    'reference-times.json',
  );
  writeFileSync(
    out,
    JSON.stringify(
      {
        source:
          'https://api.aladhan.com/v1/timings (school=0, method and latitudeAdjustmentMethod per city, tune = adhan-js method adjustments)',
        retrieved: new Date().toISOString().slice(0, 10),
        entries,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`wrote ${entries.length} reference days`);
}

await main();
