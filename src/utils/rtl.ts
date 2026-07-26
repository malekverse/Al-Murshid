import i18n from '../i18n';

function isRtlLang(): boolean {
  return i18n.language === 'ar';
}

/**
 * Flips directional icon names for RTL.
 * e.g., 'arrow-back' becomes 'arrow-forward' in RTL.
 * Uses the live i18n language so it works instantly on switch.
 */
export function flipIcon(iconName: string): string {
  if (!isRtlLang()) return iconName;

  const flips: Record<string, string> = {
    'arrow-back': 'arrow-forward',
    'arrow-forward': 'arrow-back',
    'chevron-forward': 'chevron-back',
    'chevron-back': 'chevron-forward',
  };

  return flips[iconName] || iconName;
}

/**
 * Returns the correct margin/padding side for RTL.
 * In LTR, 'end' = right, 'start' = left.
 * In RTL, 'end' = left, 'start' = right.
 */
export function marginEnd(val: number) {
  return isRtlLang() ? { marginLeft: val } : { marginRight: val };
}

export function marginStart(val: number) {
  return isRtlLang() ? { marginRight: val } : { marginLeft: val };
}

export function paddingEnd(val: number) {
  return isRtlLang() ? { paddingLeft: val } : { paddingRight: val };
}

export function paddingStart(val: number) {
  return isRtlLang() ? { paddingRight: val } : { paddingLeft: val };
}

/**
 * Flips horizontal absolute position for RTL.
 * Pass the LTR value and it returns the correct value for current direction.
 */
export function posEnd(val: number) {
  return isRtlLang() ? { left: val } : { right: val };
}

export function posStart(val: number) {
  return isRtlLang() ? { right: val } : { left: val };
}
