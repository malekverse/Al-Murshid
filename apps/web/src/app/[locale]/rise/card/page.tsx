import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RiseCard } from '@/components/rise-card';

// Fajr Rise's printable "Your spot" card (Phase 7b), opened from the phone's setup. A tool, not a
// page to find: kept out of search results.

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/rise/card'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'rise' });
  return { title: `${t('card.title')} · ${t('title')}`, robots: { index: false } };
}

export default async function RiseCardPage({ params }: PageProps<'/[locale]/rise/card'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'rise.card' });
  return (
    <RiseCard
      labels={{
        title: t('title'),
        line: t('line'),
        how: t('how'),
        print: t('print'),
        another: t('another'),
        note: t('note'),
      }}
    />
  );
}
