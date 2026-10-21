/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from 'serwist';

// The service worker (SPEC 8.2): the web app keeps working offline for what was opened here.
// Pages and their scripts (each surah's words and translation are scripts) stay cached as they
// are visited; a mushaf page's font is kept once fetched; anything never opened falls back to a
// small offline page in the page's language.

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const locales = ['ar', 'en', 'fr'] as const;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Pages opened here stay readable offline, beyond the default cache's 32 pages for a day.
      // The network still comes first, so a page is fresh whenever there is a connection.
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'visited-pages',
        plugins: [new ExpirationPlugin({ maxEntries: 300, purgeOnQuotaError: true })],
      }),
    },
    {
      // Page fonts never change (pinned by hash with each edition); keep every one opened, from
      // this site or the asset CDN (NEXT_PUBLIC_ASSET_BASE_URL), for all three editions.
      matcher: ({ url }) => /\/fonts\/quran-v[124]\/p\d+\.ttf$/.test(url.pathname),
      handler: new CacheFirst({
        cacheName: 'quran-page-fonts',
        plugins: [new ExpirationPlugin({ maxEntries: 3 * 604, purgeOnQuotaError: true })],
      }),
    },
    {
      // Script chunks are content-hashed and never change; a surah's data chunks among them stay
      // available offline once read.
      matcher: ({ url }) => url.pathname.startsWith('/_next/static/chunks/'),
      handler: new CacheFirst({
        cacheName: 'app-chunks',
        plugins: [new ExpirationPlugin({ maxEntries: 1500, purgeOnQuotaError: true })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: locales.map((locale) => ({
      url: `/${locale}/offline`,
      matcher: ({ request }: { request: Request }) =>
        request.destination === 'document' &&
        (new URL(request.url).pathname.startsWith(`/${locale}/`) ||
          (locale === 'ar' && !/^\/(en|fr)(\/|$)/.test(new URL(request.url).pathname))),
    })),
  },
});

serwist.addEventListeners();
