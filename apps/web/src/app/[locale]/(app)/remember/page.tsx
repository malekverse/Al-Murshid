import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RememberHome } from '@/components/remember/remember-home';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/remember'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'remember' });
  return { title: t('title') };
}

export default function RememberPage() {
  return <RememberHome />;
}
