'use client';

import { useEffect, type ReactNode } from 'react';
import { TabBar, type Destination } from '@/components/ui/tab-bar';
import { barPlacement, contentClass, railPlacement } from '@/components/ui/tab-bar-markup';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSettings } from '@/lib/settings';

const hrefs: Record<Destination, string> = {
  today: '/',
  quran: '/quran',
  remember: '/remember',
  you: '/you',
};

/** Qibla and the Hijri calendar are tools one tap from Today, so Today stays selected. */
function activeFor(pathname: string): Destination {
  for (const key of ['quran', 'remember', 'you'] as const) {
    if (pathname === hrefs[key] || pathname.startsWith(`${hrefs[key]}/`)) return key;
  }
  return 'today';
}

/** Reading a surah or a page fills small screens: the bottom bar steps aside. */
const immersive = (pathname: string) => /^\/quran\/.+/.test(pathname);

/**
 * The four destinations (SPEC 4): a slim rail on the start side on desktop, the bottom bar on
 * small screens. A first visit to Today, You or the tools goes to onboarding; the Quran opens as
 * it is, like the public pages, for a visitor arriving from a link or a search. The recitation's
 * bar sits at the root (RecitationHost), so it plays on across every screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSettings();
  const active = activeFor(pathname);
  const reading = immersive(pathname);

  const needsSetup = active !== 'quran';
  useEffect(() => {
    if (needsSetup && settings && !settings.onboarded) router.replace('/welcome');
  }, [needsSetup, settings, router]);

  return (
    <div className="flex min-h-dvh">
      <TabBar layout="rail" active={active} hrefs={hrefs} className={railPlacement} />
      <div className={contentClass(reading)}>{children}</div>
      {!reading && <TabBar active={active} hrefs={hrefs} className={barPlacement} />}
    </div>
  );
}
