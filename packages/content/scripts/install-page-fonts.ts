// Installs a mushaf edition's page fonts (one per page, 604 in all) where the web app serves them:
// apps/web/public/fonts/quran-<edition>/p<n>.ttf. They are too large for git, so
// quran/qpc-<edition>-fonts.json pins each file's SHA-256 instead, and this script refuses any
// file that differs. The mobile app downloads a page's font from the same path
// (EXPO_PUBLIC_ASSET_BASE_URL), once, and keeps it.
//
//   1. Download the edition's page fonts as TTF from QUL (needs a QUL account) and unzip them into
//      an empty folder: v1 https://qul.tarteel.ai/resources/font/238 (1405H),
//      v2 https://qul.tarteel.ai/resources/font/249 (1421H),
//      v4 https://qul.tarteel.ai/resources/font/240 (1441H, with tajweed colors).
//   2. pnpm --filter @murshid/content fonts <edition> <that folder>
//
// With --manifest, it writes the manifest from the folder instead (only when the source itself is
// replaced).

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sources = {
  v1: { label: 'QCF V1 (1405H)', url: 'https://qul.tarteel.ai/resources/font/238' },
  v2: { label: 'QCF V2 (1421H)', url: 'https://qul.tarteel.ai/resources/font/249' },
  v4: { label: 'QCF V4 tajweed (1441H)', url: 'https://qul.tarteel.ai/resources/font/240' },
} as const;
type Edition = keyof typeof sources;

const [edition, dir] = process.argv.slice(2) as [Edition, string];
if (!(edition in sources) || !dir) {
  throw new Error(
    'Usage: install-page-fonts <v1|v2|v4> <folder with p1.ttf to p604.ttf> [--manifest]',
  );
}
const manifestPath = fileURLToPath(new URL(`../quran/qpc-${edition}-fonts.json`, import.meta.url));
const target = fileURLToPath(
  new URL(`../../../apps/web/public/fonts/quran-${edition}/`, import.meta.url),
);
const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const pages = Array.from({ length: 604 }, (_, i) => `p${i + 1}.ttf`);

if (process.argv.includes('--manifest')) {
  const files = Object.fromEntries(pages.map((p) => [p, sha(join(dir, p))]));
  const { label, url } = sources[edition];
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        $comment: `SHA-256 of each ${label} page font (King Fahd Glorious Quran Printing Complex, via QUL: ${url}, retrieved ${new Date().toISOString().slice(0, 10)}). Installed by scripts/install-page-fonts.ts; never edited.`,
        files,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Wrote the ${edition} manifest for ${pages.length} fonts.`);
} else {
  const { files } = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    files: Record<string, string>;
  };
  mkdirSync(target, { recursive: true });
  for (const p of pages) {
    const hash = sha(join(dir, p));
    if (hash !== files[p]) throw new Error(`${p} differs from the published font (${hash})`);
    copyFileSync(join(dir, p), join(target, p));
  }
  console.log(`Installed ${pages.length} page fonts in apps/web/public/fonts/quran-${edition}.`);
}
