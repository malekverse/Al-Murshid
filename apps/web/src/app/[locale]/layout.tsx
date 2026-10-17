import { direction, isLocale, locales } from '@murshid/i18n';
import { colors } from '@murshid/tokens';
import type { Metadata, Viewport } from 'next';
import { Amiri, Readex_Pro } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
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
      className={`${readex.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-canvas font-ui text-ink">
        <a
          href="#main"
          className="sr-only-focusable z-10 rounded-control bg-surface px-4 py-3 text-callout shadow-lift"
        >
          {t('a11y.skipToContent')}
        </a>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
