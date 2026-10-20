import { cn } from '@/lib/cn';

// The four destinations' bar, shared by the app's tab bar and the public pages' server-rendered
// navigation (Phase 6), so both look the same.

export type Destination = 'today' | 'quran' | 'remember' | 'you';
export const destinationKeys: Destination[] = ['today', 'quran', 'remember', 'you'];

export const tabBarClass = (rail: boolean, className?: string) =>
  cn(
    'flex bg-surface',
    rail
      ? 'w-24 flex-col items-stretch gap-2 border-e border-hairline py-6'
      : 'border-t border-hairline',
    className,
  );

export const tabClass = (selected: boolean, rail: boolean) =>
  cn(
    'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-(--duration-quick) ease-standard',
    selected ? 'text-lantern-ink' : 'text-ink-muted hover:text-ink',
    rail && 'flex-none',
  );

/** The rail on desktop, and the bar's place on small screens, around the app's screens. */
export const railPlacement = 'sticky top-0 hidden h-dvh shrink-0 lg:flex';
export const barPlacement =
  'fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden';
/** The content beside them: room for the bar on small screens, unless reading fills them. */
export const contentClass = (immersive: boolean) =>
  immersive ? 'flex min-w-0 flex-1 flex-col' : 'flex min-w-0 flex-1 flex-col pb-16 lg:pb-0';
