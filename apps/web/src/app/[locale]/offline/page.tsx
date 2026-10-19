import { isLocale } from '@murshid/i18n';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/i18n/navigation';

// Shown by the service worker when a page that was never opened is asked for offline (SPEC 8.2).
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/offline'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'common.offline' });
  return { title: t('title') };
}

export default async function OfflinePage({ params }: PageProps<'/[locale]/offline'>) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : 'ar',
    namespace: 'common.offline',
  });
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-reading flex-col justify-center gap-6 px-4 py-12"
    >
      <EmptyState
        illustration="offline"
        title={`${t('title')}. ${t('body')}`}
        action={
          <Link
            href="/quran"
            className="inline-flex min-h-touch items-center rounded-full bg-lantern px-6 text-callout text-on-lantern shadow-card"
          >
            {t('action')}
          </Link>
        }
      />
    </main>
  );
}
