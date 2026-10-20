import { locales, type Locale } from '@murshid/i18n';
import type { Metadata } from 'next';

// Search metadata for the public pages (SPEC 4, Phase 6): one address per page in each language,
// with the others as alternates (hreflang), Arabic the default; Open Graph and Twitter tags; and
// structured data (JSON-LD).

/**
 * The site's address: NEXT_PUBLIC_SITE_URL, or Vercel's production address, or this machine in
 * development. Absolute URLs in metadata, sitemaps and structured data start from it.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '');

/** A path in every language (`/quran/2` -> `/ar/quran/2`, ...), with Arabic as the default. */
export function alternates(locale: Locale, path: string): NonNullable<Metadata['alternates']> {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
      'x-default': `/ar${path}`,
    },
  };
}

const ogLocale: Record<Locale, string> = { ar: 'ar_AR', en: 'en_US', fr: 'fr_FR' };

/** A public page's metadata: title, description, its addresses, and how it shows when shared. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  siteName,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  siteName: string;
}): Metadata {
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      type: 'website',
      url: `/${locale}${path}`,
      title,
      description,
      siteName,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Structured data, safe inside a <script> (no closing tag can be formed). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON, with "<" escaped: no tag can close the script early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/** Where a page sits, for search results: each step's name and path below the locale. */
export function breadcrumbs(locale: Locale, steps: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: `${siteUrl}/${locale}${step.path}`,
    })),
  };
}
