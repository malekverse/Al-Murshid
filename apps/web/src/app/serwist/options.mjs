import { spawnSync } from 'node:child_process';

// How the service worker (src/app/sw.ts) is built: shared by its route (route.ts) and by
// scripts/static-sw.mjs, which writes the same file into public/ on Netlify. The offline pages
// are precached, versioned by the commit they were built from.
const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  crypto.randomUUID();

export const serwistOptions = {
  additionalPrecacheEntries: ['ar', 'en', 'fr'].map((locale) => ({
    url: `/${locale}/offline`,
    revision,
  })),
  // Precache only the shell: styles, icons and the offline pages (about 400 KB). Scripts (each
  // surah's words, translations and timings are script chunks), fonts (the Quran text's, and
  // each edition's mushaf page fonts, about 200 MB each) are cached as they are used (sw.ts).
  globIgnores: [
    '**/node_modules/**/*',
    'public/fonts/**',
    'public/zones/**',
    '.next/static/chunks/**/*.js',
  ],
  swSrc: 'src/app/sw.ts',
  useNativeEsbuild: true,
};
