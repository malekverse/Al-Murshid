// On Netlify only, after `next build`: the service worker that the build prerendered at
// /serwist/sw.js becomes a static file in public/, which Netlify's CDN serves itself. Netlify's
// Next.js runtime otherwise sends the request to the server function, which tries to bundle the
// worker again there, without esbuild, its source or the build's static files, and answers 500.
// Locally, `next start` serves the prerendered route as it is.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.NETLIFY === 'true') {
  const app = join(dirname(fileURLToPath(import.meta.url)), '..');
  const built = join(app, '.next/server/app/serwist/sw.js.body');
  if (!existsSync(built)) {
    throw new Error(`The build did not prerender the service worker (${built}).`);
  }
  const target = join(app, 'public/serwist/sw.js');
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(built, target);
  console.log('Service worker copied to public/serwist/sw.js');
}
