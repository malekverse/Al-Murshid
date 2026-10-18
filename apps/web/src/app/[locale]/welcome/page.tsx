import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Onboarding } from '@/components/onboarding';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/welcome'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'common.app' });
  return { title: { absolute: t('name') }, robots: { index: false, follow: false } };
}

export default function WelcomePage() {
  return <Onboarding />;
}
