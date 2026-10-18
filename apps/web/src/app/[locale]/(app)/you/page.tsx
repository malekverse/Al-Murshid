import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { YouScreen } from '@/components/you-screen';

export async function generateMetadata({ params }: PageProps<'/[locale]/you'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'settings' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default function YouPage() {
  return <YouScreen />;
}
