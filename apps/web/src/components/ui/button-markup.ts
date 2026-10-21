import { cn } from '@/lib/cn';

// The pill button's look, shared by the app's Button and links drawn as buttons on server-rendered
// pages (Phase 6).

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-lantern text-on-lantern shadow-card hover:bg-lantern/90',
  secondary:
    'border border-hairline bg-surface text-ink shadow-card hover:bg-canvas dark:border-card-edge dark:shadow-none',
  ghost: 'text-lantern-ink hover:bg-lantern/10',
  // Deleting data only (SPEC 6: danger is never used for worship).
  danger:
    'border border-hairline bg-surface text-danger shadow-card hover:bg-danger/10 dark:border-card-edge dark:shadow-none',
};

const sizes: Record<ButtonSize, { box: string; latin: string; arabic: string }> = {
  md: { box: 'min-h-touch px-6 gap-2', latin: 'text-callout', arabic: 'text-ar-callout' },
  lg: { box: 'min-h-16 w-full px-8 gap-3', latin: 'text-headline', arabic: 'text-ar-headline' },
};

export const buttonClass = ({
  variant = 'primary',
  size = 'md',
  script,
  disabled = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  script: 'latin' | 'arabic';
  disabled?: boolean;
  className?: string;
}) =>
  cn(
    'relative inline-flex select-none items-center justify-center rounded-full font-medium',
    'transition-colors duration-(--duration-instant) ease-standard',
    'disabled:cursor-not-allowed',
    disabled && 'opacity-40',
    variants[variant],
    sizes[size].box,
    sizes[size][script],
    className,
  );
