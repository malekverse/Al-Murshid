import { surah as surahInfo } from '@murshid/content/quran';
import { locales } from '@murshid/i18n';
import { loadPlaces } from './places';
import { siteUrl } from './seo';

// The public pages' sitemaps (Phase 6): one for the Quran (every surah and ayah), and the places
// split in files of at most 45,000 addresses (search engines read up to 50,000 per file). Each
// page appears in every language, each address naming the others (hreflang), Arabic the default.

const PATHS_PER_FILE = 15_000; // x 3 languages = 45,000 addresses

function quranPaths(): string[] {
  const paths: string[] = [];
  for (let n = 1; n <= 114; n++) {
    paths.push(`/quran/${n}`);
    for (let a = 1; a <= surahInfo(n).ayahCount; a++) paths.push(`/quran/${n}/${a}`);
  }
  return paths;
}

async function placePaths(): Promise<string[]> {
  const places = await loadPlaces();
  return [
    // The landing page (Phase 7c) leads the places file: both are ways in from search.
    '/about',
    '/prayer-times',
    ...places.countries.flatMap((c) => [
      `/prayer-times/${c.slug}`,
      ...c.cities.map((city) => `/prayer-times/${places.path(city)}`),
    ]),
  ];
}

/** The sitemap files, by name. */
export async function sitemapFiles(): Promise<Map<string, string[]>> {
  const files = new Map<string, string[]>([['quran.xml', quranPaths()]]);
  const places = await placePaths();
  for (let i = 0; i * PATHS_PER_FILE < places.length; i++) {
    files.set(`places-${i + 1}.xml`, places.slice(i * PATHS_PER_FILE, (i + 1) * PATHS_PER_FILE));
  }
  return files;
}

export function sitemapXml(paths: string[]): string {
  const links = (path: string) =>
    [
      ...locales.map(
        (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${siteUrl}/${l}${path}"/>`,
      ),
      `<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/ar${path}"/>`,
    ].join('');
  const urls = paths.flatMap((path) =>
    locales.map((l) => `<url><loc>${siteUrl}/${l}${path}</loc>${links(path)}</url>`),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function sitemapIndexXml(names: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...names.map((n) => `<sitemap><loc>${siteUrl}/sitemaps/${n}</loc></sitemap>`),
    '</sitemapindex>',
    '',
  ].join('\n');
}

export const xmlHeaders = { 'Content-Type': 'application/xml; charset=utf-8' };
