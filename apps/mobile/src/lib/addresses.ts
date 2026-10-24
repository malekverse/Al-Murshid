// Where the phone finds the web (SPEC 4): the site, for the links in what it shares and the
// printable Fajr Rise card, and the asset Worker that serves the mushaf page fonts. Every build
// has them; one can point elsewhere with EXPO_PUBLIC_WEB_URL or EXPO_PUBLIC_ASSET_BASE_URL
// (apps/mobile/.env), such as the web dev server.

export const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://al-murshid-pro.netlify.app';

export const assetBaseUrl =
  process.env.EXPO_PUBLIC_ASSET_BASE_URL ?? 'https://al-murshid-assets.malek-magraoui3.workers.dev';
