import { useTranslations } from 'next-intl';
import { EmptyState, type Illustration } from './ui/empty-state';

/** A destination whose phase has not arrived yet: one warm sentence, nothing broken. */
export function Soon({
  what,
  illustration,
}: {
  what: 'quran' | 'remember';
  illustration: Illustration;
}) {
  const t = useTranslations('common.soon');
  return (
    <main id="main" className="mx-auto flex w-full max-w-reading flex-1 items-center px-4 py-12">
      <EmptyState illustration={illustration} title={t(what)} />
    </main>
  );
}
