// Builds places/cities.json from GeoNames (CC BY 4.0, https://www.geonames.org): every city of
// 15,000+ people with its Arabic, French and English names, country, first-level region, time
// zone and coordinates. Run once per refresh:
//
//   1. Download cities15000.zip, alternateNamesV2.zip and admin1CodesASCII.txt from
//      https://download.geonames.org/export/dump/ into an empty folder and unzip both archives.
//   2. pnpm --filter @murshid/content cities <that folder>
//   3. Update the GeoNames entry in sources.json (date and SHA-256).

import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) throw new Error('Usage: import-cities <folder with the GeoNames files>');

type Lang = 'ar' | 'fr' | 'en';
interface Row {
  id: number;
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  population: number;
}

const admin1 = new Map<string, string>();
for (const line of readFileSync(join(dir, 'admin1CodesASCII.txt'), 'utf8').split('\n')) {
  const [code, , ascii] = line.split('\t');
  if (code && ascii) admin1.set(code, ascii);
}

// Neighbourhoods (PPLX) and historical, abandoned or destroyed places are not where people set
// their prayer times.
const skippedFeatures = new Set(['PPLX', 'PPLH', 'PPLQ', 'PPLW']);

const cities = new Map<number, Row>();
for (const line of readFileSync(join(dir, 'cities15000.txt'), 'utf8').split('\n')) {
  const f = line.split('\t');
  if (f.length < 19 || skippedFeatures.has(f[7]!)) continue;
  const id = Number(f[0]);
  cities.set(id, {
    id,
    name: f[1]!,
    country: f[8]!,
    admin1: admin1.get(`${f[8]}.${f[10]}`) ?? '',
    // Three decimals is about 100 m: plenty for prayer times.
    latitude: Math.round(Number(f[4]) * 1000) / 1000,
    longitude: Math.round(Number(f[5]) * 1000) / 1000,
    timeZone: f[17]!,
    population: Number(f[14]),
  });
}

// Per city and language, the best name: preferred over plain, never historic or colloquial.
const names = new Map<string, { name: string; rank: number }>();
const lines = createInterface({ input: createReadStream(join(dir, 'alternateNamesV2.txt')) });
for await (const line of lines) {
  const f = line.split('\t');
  const id = Number(f[1]);
  const lang = f[2] as Lang;
  if (!cities.has(id) || (lang !== 'ar' && lang !== 'fr' && lang !== 'en')) continue;
  if (f[7] === '1' || f[6] === '1') continue;
  const rank = (f[4] === '1' ? 2 : 0) + (f[5] === '1' ? 0 : 1);
  const key = `${id}:${lang}`;
  const best = names.get(key);
  if (!best || rank > best.rank) names.set(key, { name: f[3]!, rank });
}

const zones = [...new Set([...cities.values()].map((c) => c.timeZone))].sort();
const zoneIndex = new Map(zones.map((z, i) => [z, i]));
const nameIn = (id: number, lang: Lang, fallback: string) => {
  const name = names.get(`${id}:${lang}`)?.name ?? '';
  return name === fallback ? '' : name;
};

const rows = [...cities.values()]
  .sort((a, b) => b.population - a.population || a.id - b.id)
  .map((c) => [
    c.id,
    c.name,
    nameIn(c.id, 'en', c.name),
    nameIn(c.id, 'ar', ''),
    nameIn(c.id, 'fr', c.name),
    c.country,
    c.admin1,
    c.latitude,
    c.longitude,
    zoneIndex.get(c.timeZone)!,
    c.population,
  ]);

const out = fileURLToPath(new URL('../places/cities.json', import.meta.url));
writeFileSync(
  out,
  `{"source":"GeoNames cities15000 (CC BY 4.0)","columns":["id","name","en","ar","fr","country","admin1","latitude","longitude","zone","population"],"zones":${JSON.stringify(zones)},"rows":[\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`,
);
console.log(`${rows.length} cities, ${zones.length} time zones -> ${out}`);
