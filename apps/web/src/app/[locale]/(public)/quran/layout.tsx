import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { SiteShell } from '@/components/site-shell';

// Until the Quran font is ready, 3 s at most, the reading column stays hidden (globals.css). It
// shows a frame after the text takes the font, so the move happens while nothing is visible.
const hideUntilQuranFont = `(function(){var d=document.documentElement,f=document.fonts;if(!f||!f.load)return;d.setAttribute('data-quran-font','pending');var show=function(){d.removeAttribute('data-quran-font')};var done=function(){requestAnimationFrame(function(){requestAnimationFrame(show)})};f.load('1em "KFGQPC Uthmanic Hafs"').then(done,done);setTimeout(show,3000)})()`;

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
    <>
      {/* Runs before the reading column is parsed, so it is never painted early. */}
      <script dangerouslySetInnerHTML={{ __html: hideUntilQuranFont }} />
      <SiteShell locale={locale} active="quran" immersive>
        {children}
      </SiteShell>
    </>
  );
}
