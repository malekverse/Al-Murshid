import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Landing } from '@/components/about/landing';
import { pageMetadata } from '@/lib/seo';

// The landing page (SPEC 4, Phase 7c): what Al-Murshid is, for visitors who meet it first on the
// web. The app itself keeps /[locale].

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'about' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  return pageMetadata({
    locale,
    path: '/about',
    title: t('seo.title'),
    description: t('seo.description'),
    siteName: tc('app.name'),
  });
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Landing locale={locale} />;
}
