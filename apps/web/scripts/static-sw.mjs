// On Netlify only, after `next build`: the service worker becomes a static file in public/, which
// Netlify's CDN serves itself. There the build does not prerender /serwist/sw.js, and the server
// function cannot bundle it at request time (no esbuild, no source, no build files), so it
// answered 500. This runs Serwist's own route handler once, with the route's options, now that
// the build's files exist. Locally, `next start` serves the prerendered route as it is.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.NETLIFY === 'true') {
  process.env.NODE_ENV = 'production';
  const app = join(dirname(fileURLToPath(import.meta.url)), '..');
  process.chdir(app);
  const { createSerwistRoute } = await import('@serwist/turbopack');
  const { serwistOptions } = await import('../src/app/serwist/options.mjs');
  const { GET } = createSerwistRoute(serwistOptions);
  const response = await GET(new Request('http://localhost/serwist/sw.js'), {
    params: Promise.resolve({ path: 'sw.js' }),
  });
  const body = await response.text();
  if (!response.ok || !body.includes('precache')) {
    throw new Error(`Building the service worker failed (${response.status}).`);
  }
  const target = join(app, 'public/serwist/sw.js');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
  console.log(`Service worker written to public/serwist/sw.js (${body.length} bytes)`);
}
