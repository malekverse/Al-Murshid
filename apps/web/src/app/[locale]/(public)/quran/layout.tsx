import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { SiteShell } from '@/components/site-shell';

// The Quran's public pages (Phase 6): a surah and an ayah, server-rendered for every visitor and
// search engine, within the destinations. Reading fills small screens.
export default async function PublicQuranLayout({
  children,
  params,
}: LayoutProps<'/[locale]/quran'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // The Quran text is these pages' largest text: its font starts with the page (globals.css).
  preload('/fonts/hafs/UthmanicHafs_V22.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });
  return (
    <SiteShell locale={locale} active="quran" immersive>
      {children}
    </SiteShell>
  );
}
