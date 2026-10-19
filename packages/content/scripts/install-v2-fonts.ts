// Installs the King Fahd Complex's QCF V2 page fonts (one per mushaf page, 604 in all, about
// 200 MB) where the web app serves them: apps/web/public/fonts/quran-v2/p<n>.ttf. They are too
// large for git, so quran/qpc-v2-fonts.json pins each file's SHA-256 instead, and this script
// refuses any file that differs. The mobile app downloads a page's font from the same path
// (EXPO_PUBLIC_ASSET_BASE_URL), once, and keeps it.
//
//   1. Download "QPC V2 Font" as TTF from https://qul.tarteel.ai/resources/font/249 (needs a
//      QUL account) and unzip it into an empty folder.
//   2. pnpm --filter @murshid/content fonts:v2 <that folder>
//
// With --manifest, it writes qpc-v2-fonts.json from the folder instead (only when the source
// itself is replaced).

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) throw new Error('Usage: install-v2-fonts <folder with p1.ttf to p604.ttf> [--manifest]');
const manifestPath = fileURLToPath(new URL('../quran/qpc-v2-fonts.json', import.meta.url));
const target = fileURLToPath(new URL('../../../apps/web/public/fonts/quran-v2/', import.meta.url));
const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const pages = Array.from({ length: 604 }, (_, i) => `p${i + 1}.ttf`);

if (process.argv.includes('--manifest')) {
  const files = Object.fromEntries(pages.map((p) => [p, sha(join(dir, p))]));
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        $comment:
          'SHA-256 of each QCF V2 page font (King Fahd Glorious Quran Printing Complex, via QUL: https://qul.tarteel.ai/resources/font/249, retrieved 2026-10-18). Installed by scripts/install-v2-fonts.ts; never edited.',
        files,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Wrote the manifest for ${pages.length} fonts.`);
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
  console.log(`Installed ${pages.length} page fonts in apps/web/public/fonts/quran-v2.`);
}
