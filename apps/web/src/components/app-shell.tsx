'use client';

import { useEffect, type ReactNode } from 'react';
import { AudioBar } from '@/components/quran/audio-bar';
import { RecitationProvider } from '@/components/quran/recitation';
import { TabBar, type Destination } from '@/components/ui/tab-bar';
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
 * small screens. First visits go to onboarding. The recitation plays on across every screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSettings();
  const active = activeFor(pathname);
  const reading = immersive(pathname);

  useEffect(() => {
    if (settings && !settings.onboarded) router.replace('/welcome');
  }, [settings, router]);

  return (
    <RecitationProvider>
      <div className="flex min-h-dvh">
        <TabBar
          layout="rail"
          active={active}
          hrefs={hrefs}
          className="sticky top-0 hidden h-dvh shrink-0 lg:flex"
        />
        <div
          className={
            reading ? 'flex min-w-0 flex-1 flex-col' : 'flex min-w-0 flex-1 flex-col pb-16 lg:pb-0'
          }
        >
          {children}
        </div>
        <AudioBar
          className={
            reading
              ? 'bottom-0 mb-[env(safe-area-inset-bottom)] lg:start-24'
              : 'bottom-16 lg:start-24 lg:bottom-0'
          }
        />
        {!reading && (
          <TabBar
            active={active}
            hrefs={hrefs}
            className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
          />
        )}
      </div>
    </RecitationProvider>
  );
}
