import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';

// Prayer times as public pages (Phase 6): every country and city, server-rendered for visitors
// and search engines, within the destinations (prayer times belong to Today).
export default async function PrayerTimesLayout({
  children,
  params,
}: LayoutProps<'/[locale]/prayer-times'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <SiteShell locale={locale} active="today">
      {children}
    </SiteShell>
  );
}
