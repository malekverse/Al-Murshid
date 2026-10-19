import { PAGE_COUNT } from '@murshid/content/quran';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { MushafReader } from '@/components/quran/mushaf-reader';

// The reader renders on the client from the address; it waits for the route instead of
// prerendering a shell (Cache Components).
export const instant = false;

// /quran/page/42: a page of the mushaf.
async function PageReader({
  params,
}: {
  params: PageProps<'/[locale]/quran/page/[page]'>['params'];
}) {
  const { page } = await params;
  const n = Number(page);
  if (!Number.isInteger(n) || n < 1 || n > PAGE_COUNT) notFound();
  return <MushafReader startPage={n} />;
}

export default function MushafPage({ params }: PageProps<'/[locale]/quran/page/[page]'>) {
  return (
    <Suspense>
      <PageReader params={params} />
    </Suspense>
  );
}
