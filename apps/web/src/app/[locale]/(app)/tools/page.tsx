import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ToolsScreen } from '@/components/tools-screen';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/tools'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'today.tools' });
  return { title: t('title') };
}

export default function ToolsPage() {
  return <ToolsScreen />;
}
