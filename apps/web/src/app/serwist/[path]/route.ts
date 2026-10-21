import { createSerwistRoute } from '@serwist/turbopack';
import { serwistOptions } from '../options.mjs';

// Builds and serves the service worker (src/app/sw.ts) at /serwist/sw.js, with the options in
// options.mjs. On Netlify, scripts/static-sw.mjs writes the same file into public/ instead.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute(serwistOptions);
