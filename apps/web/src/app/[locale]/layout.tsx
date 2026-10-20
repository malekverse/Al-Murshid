import { direction, isLocale, locales } from '@murshid/i18n';
import { colors } from '@murshid/tokens';
import type { Metadata, Viewport } from 'next';
import { Amiri, Readex_Pro } from 'next/font/google';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getTranslations } from 'next-intl/server';
import { ServiceWorker } from '@/components/service-worker';
import { RecitationHost } from '@/components/quran/recitation-host';
import { themeScript } from '@/components/theme';
import { siteUrl } from '@/lib/seo';
import '../globals.css';

// Not preloaded: a page fetches only the subsets its text uses (unicode-range), after the Quran
// font that holds the Quran pages' largest text (Phase 6), and shows its fallback meanwhile.
const readex = Readex_Pro({
  subsets: ['arabic', 'latin', 'latin-ext'],
  variable: '--font-readex-pro',
  display: 'swap',
  preload: false,
});

// Adhkar and duas only: never preloaded, so other pages do not fetch it.
const amiri = Amiri({
  subsets: ['arabic'],
  weight: '400',
  variable: '--font-amiri',
  display: 'swap',
  preload: false,
});

// The King Fahd Complex's Uthmanic Hafs font is declared in globals.css, at a fixed address that
// the Quran's public pages preload (Phase 6).

// QUL's surah name font: its ligatures draw each surah's calligraphic name ("surah002").
const surahNames = localFont({
  src: '../fonts/surah-name-v2.woff2',
  variable: '--font-surah-name',
  display: 'block',
  preload: false,
  adjustFontFallback: false,
});

// The King Fahd Complex's Nastaleeq font, for the Indopak mushaf (Phase 5b): loaded only there.
const indopak = localFont({
  src: '../fonts/KFGQPCNastaleeq-Regular.woff2',
  variable: '--font-indopak',
  display: 'block',
  preload: false,
  adjustFontFallback: false,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t('app.name'), template: `%s · ${t('app.name')}` },
    description: t('app.tagline'),
    // Search consoles (Phase 6): their verification tokens, when the owner sets them.
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: colors.light.canvas },
    { media: '(prefers-color-scheme: dark)', color: colors.dark.canvas },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <html
      lang={locale}
      dir={direction(locale)}
      className={`${readex.variable} ${amiri.variable} ${surahNames.variable} ${indopak.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint so the page never flashes the wrong theme. */}
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="bg-canvas font-ui text-ink">
        <a
          href="#main"
          className="sr-only-focusable z-10 rounded-control bg-surface px-4 py-3 text-callout focus-visible:shadow-lift"
        >
          {t('a11y.skipToContent')}
        </a>
        {/* Only what every page needs: the interactive app's providers sit in its own layouts, so
            public pages stay light (Phase 6). */}
        <ServiceWorker>
          {/* The page behind an open sheet scales from here (globals.css). */}
          <div id="app-root" className="bg-canvas">
            {children}
          </div>
        </ServiceWorker>
        <RecitationHost locale={locale} />
      </body>
    </html>
  );
}
