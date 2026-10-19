import { surah as surahInfo } from '@murshid/content/quran';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SurahReader } from '@/components/quran/surah-reader';

// The reader renders on the client from the address; it waits for the route instead of
// prerendering a shell (Cache Components).
export const instant = false;

// /quran/2/255: the stable address of an ayah (SPEC 4), opening the surah at it.
async function AyahReader({
  params,
}: {
  params: PageProps<'/[locale]/quran/[surah]/[ayah]'>['params'];
}) {
  const { surah, ayah } = await params;
  const s = Number(surah);
  const a = Number(ayah);
  if (!Number.isInteger(s) || s < 1 || s > 114) notFound();
  if (!Number.isInteger(a) || a < 1 || a > surahInfo(s).ayahCount) notFound();
  return <SurahReader surah={s} startAyah={a} />;
}

export default function AyahPage({ params }: PageProps<'/[locale]/quran/[surah]/[ayah]'>) {
  return (
    <Suspense>
      <AyahReader params={params} />
    </Suspense>
  );
}
