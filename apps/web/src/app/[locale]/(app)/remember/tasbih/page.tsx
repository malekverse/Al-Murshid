import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TasbihScreen } from '@/components/remember/tasbih-screen';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/remember/tasbih'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'remember.tasbih' });
  return { title: t('title') };
}

export default function TasbihPage() {
  return <TasbihScreen />;
}
