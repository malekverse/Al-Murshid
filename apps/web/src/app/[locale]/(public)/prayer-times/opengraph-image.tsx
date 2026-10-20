import { isLocale } from '@murshid/i18n';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { png, textCard } from '@/lib/og/card';

export { size } from '@/lib/og/card';
export const contentType = 'image/png';

// The prayer times index's share image (Phase 6).
export default async function Image({ params }: PageProps<'/[locale]/prayer-times'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  return png(
    textCard({
      rtl: locale === 'ar',
      brand: tc('app.name'),
      title: t('indexTitle'),
      body: t('indexBody'),
    }),
  );
}
