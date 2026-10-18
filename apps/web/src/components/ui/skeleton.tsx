import { cn } from '@/lib/cn';

/**
 * A placeholder shaped like the content it stands for (SPEC 6.6). It breathes slowly instead
 * of shimmering, and holds still with Reduce Motion. Wrap a group in aria-busy.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-control bg-ink/10 animate-[murshid-breathe_var(--duration-ambient)_ease-in-out_infinite]',
        className,
      )}
    />
  );
}
