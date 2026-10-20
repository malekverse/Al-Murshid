import { withSerwist } from '@serwist/turbopack';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The stylesheet travels in the page (about 11 KB compressed): one round trip less before the
  // first paint, which most visitors from search see on their first and only page (Phase 6).
  experimental: { inlineCss: true },
  partialPrefetching: true,
  reactCompiler: true,
  // HarfBuzz finds its WebAssembly beside itself: loaded as published, not bundled.
  serverExternalPackages: ['harfbuzzjs'],
  // The share images read their fonts at run time (lib/og/text.ts): ship them with those routes.
  outputFileTracingIncludes: {
    '/**/opengraph-image*': [
      '../mobile/assets/fonts/UthmanicHafs_V22.ttf',
      '../../node_modules/harfbuzzjs/dist/harfbuzz.wasm',
      '../../node_modules/@fontsource/readex-pro/files/readex-pro-{arabic,latin,latin-ext}-{400,600}-normal.woff',
    ],
  },
  // Fonts at fixed addresses carry their version in the path, so they are kept for a year.
  async headers() {
    return [
      {
        source: '/fonts/hafs/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  transpilePackages: [
    '@murshid/content',
    '@murshid/core',
    '@murshid/data',
    '@murshid/i18n',
    '@murshid/tokens',
  ],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(withSerwist(nextConfig));
