import type { UiRole } from '@murshid/tokens';
import { useLocale } from 'next-intl';
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type Script = 'latin' | 'arabic';
type Role = UiRole | 'dhikr';

// Literal class names so Tailwind can see them. Arabic roles run larger and looser (SPEC 6.2).
const roleClass: Record<Script, Record<Role, string>> = {
  latin: {
    display: 'text-display',
    title1: 'text-title-1',
    title2: 'text-title-2',
    headline: 'text-headline',
    body: 'text-body',
    callout: 'text-callout',
    caption: 'text-caption',
    dhikr: 'font-sacred text-dhikr',
  },
  arabic: {
    display: 'text-ar-display',
    title1: 'text-ar-title-1',
    title2: 'text-ar-title-2',
    headline: 'text-ar-headline',
    body: 'text-ar-body',
    callout: 'text-ar-callout',
    caption: 'text-ar-caption',
    dhikr: 'font-sacred text-dhikr',
  },
};

const tone = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  lantern: 'text-lantern-ink',
  inherit: '',
} as const;

type TextProps<T extends ElementType> = {
  as?: T;
  role?: Role;
  tone?: keyof typeof tone;
  /** Force a script, e.g. an Arabic specimen inside an English page. Defaults to the UI locale. */
  script?: Script;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'role'>;

/** Script-aware text: picks the Latin or Arabic metrics for the role. */
export function Text<T extends ElementType = 'p'>({
  as,
  role = 'body',
  tone: toneName = 'default',
  script,
  className,
  ...rest
}: TextProps<T>) {
  const locale = useLocale();
  const resolved: Script = script ?? (locale === 'ar' ? 'arabic' : 'latin');
  const Component: ElementType = as ?? 'p';
  // An Arabic block inside a left-to-right page carries its own language and direction.
  const foreignArabic = resolved === 'arabic' && locale !== 'ar';
  return (
    <Component
      lang={foreignArabic ? 'ar' : undefined}
      dir={foreignArabic ? 'rtl' : undefined}
      className={[roleClass[resolved][role], tone[toneName], className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
