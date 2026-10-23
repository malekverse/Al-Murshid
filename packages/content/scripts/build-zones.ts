// The main city of every time zone (the most populous in the GeoNames table the apps carry), so a
// page can show the sky and the next prayer where a visitor is from the browser's time zone alone,
// without asking for a location (SPEC 4, the landing page). Run after `pnpm cities`.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Row = [number, string, string, string, string, string, string, number, number, number, number];
const dir = join(import.meta.dirname, '..', 'places');
const table = JSON.parse(readFileSync(join(dir, 'cities.json'), 'utf8')) as {
  zones: string[];
  rows: Row[];
};

const best = new Map<number, Row>();
for (const row of table.rows) {
  const zone = row[9];
  const current = best.get(zone);
  if (!current || row[10] > current[10]) best.set(zone, row);
}

const zones: Record<string, [number, number, string, string, string, string]> = {};
for (const [zone, [, name, en, ar, fr, country, , lat, lon]] of [...best].sort(([a], [b]) =>
  table.zones[a]!.localeCompare(table.zones[b]!),
)) {
  zones[table.zones[zone]!] = [
    Math.round(lat * 100) / 100,
    Math.round(lon * 100) / 100,
    en || name,
    ar || en || name,
    fr || en || name,
    country,
  ];
}

writeFileSync(
  join(dir, 'zones.json'),
  `${JSON.stringify({
    source: 'GeoNames cities15000 (CC BY 4.0): the most populous city of each time zone',
    columns: ['latitude', 'longitude', 'en', 'ar', 'fr', 'country'],
    zones,
  })}\n`,
);
console.log(`${Object.keys(zones).length} zones`);
