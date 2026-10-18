'use client';

import { useEffect, type ReactNode } from 'react';
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

/**
 * The four destinations (SPEC 4): a slim rail on the start side on desktop, the bottom bar on
 * small screens. First visits go to onboarding.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSettings();
  const active = activeFor(pathname);

  useEffect(() => {
    if (settings && !settings.onboarded) router.replace('/welcome');
  }, [settings, router]);

  return (
    <div className="flex min-h-dvh">
      <TabBar
        layout="rail"
        active={active}
        hrefs={hrefs}
        className="sticky top-0 hidden h-dvh shrink-0 lg:flex"
      />
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">{children}</div>
      <TabBar
        active={active}
        hrefs={hrefs}
        className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      />
    </div>
  );
}
