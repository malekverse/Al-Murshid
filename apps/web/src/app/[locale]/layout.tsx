import { direction, isLocale, locales } from '@murshid/i18n';
import { colors } from '@murshid/tokens';
import type { Metadata, Viewport } from 'next';
import { Amiri, Readex_Pro } from 'next/font/google';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Providers } from '@/components/providers';
import { themeScript } from '@/components/theme';
import '../globals.css';

const readex = Readex_Pro({
  subsets: ['arabic', 'latin', 'latin-ext'],
  variable: '--font-readex-pro',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: '400',
  variable: '--font-amiri',
  display: 'swap',
});

// King Fahd Complex Uthmanic Hafs (QPC Hafs V22, via QUL). Its license forbids modifying the
// font, so it ships exactly as published: no subsetting. Only Quran screens use it, so it is not
// preloaded; `block` keeps Quran text from flashing in a fallback that lacks its marks.
const qpcHafs = localFont({
  src: '../fonts/UthmanicHafs_V22.woff2',
  variable: '--font-qpc-hafs',
  display: 'block',
  preload: false,
  adjustFontFallback: false,
});

// QUL's surah name font: its ligatures draw each surah's calligraphic name ("surah002").
const surahNames = localFont({
  src: '../fonts/surah-name-v2.woff2',
  variable: '--font-surah-name',
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
    title: { default: t('app.name'), template: `%s · ${t('app.name')}` },
    description: t('app.tagline'),
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
      className={`${readex.variable} ${amiri.variable} ${qpcHafs.variable} ${surahNames.variable}`}
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
        <NextIntlClientProvider>
          <Providers>
            {/* The page behind an open sheet scales from here (globals.css). */}
            <div id="app-root" className="bg-canvas">
              {children}
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
