import type { UiRole } from '@murshid/tokens';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useAppLocale } from '@/lib/locale';

type Script = 'latin' | 'arabic';
type Role = UiRole | 'dhikr';

// One family per weight on native (no synthetic bold on Arabic); literal classes for Uniwind.
const roleClass: Record<Script, Record<Role, string>> = {
  latin: {
    display: 'font-ui-semibold text-display',
    title1: 'font-ui-semibold text-title-1',
    title2: 'font-ui-semibold text-title-2',
    headline: 'font-ui-medium text-headline',
    body: 'font-ui text-body',
    callout: 'font-ui text-callout',
    caption: 'font-ui text-caption',
    dhikr: 'font-sacred text-dhikr',
  },
  arabic: {
    display: 'font-ui-semibold text-ar-display',
    title1: 'font-ui-semibold text-ar-title-1',
    title2: 'font-ui-semibold text-ar-title-2',
    headline: 'font-ui-medium text-ar-headline',
    body: 'font-ui text-ar-body',
    callout: 'font-ui text-ar-callout',
    caption: 'font-ui text-ar-caption',
    dhikr: 'font-sacred text-dhikr',
  },
};

const tone = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  lantern: 'text-lantern-ink',
  onLantern: 'text-on-lantern',
  inherit: '',
} as const;

export interface TextProps extends Omit<RNTextProps, 'role'> {
  role?: Role;
  tone?: keyof typeof tone;
  /** Force a script, e.g. an Arabic specimen in an English screen. Defaults to the UI locale. */
  script?: Script;
  className?: string;
}

/** Script-aware text: picks the Latin or Arabic metrics for the role. */
export function Text({
  role = 'body',
  tone: toneName = 'default',
  script,
  className,
  ...rest
}: TextProps) {
  const { locale } = useAppLocale();
  const resolved: Script = script ?? (locale === 'ar' ? 'arabic' : 'latin');
  return (
    <RNText
      className={[roleClass[resolved][role], tone[toneName], className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
