import { I18nManager } from 'react-native';

/**
 * Returns true if the app is currently in RTL mode.
 */
export function isRTL(): boolean {
  return I18nManager.isRTL;
}

/**
 * Flips directional icon names for RTL.
 * e.g., 'arrow-back' becomes 'arrow-forward' in RTL.
 */
export function flipIcon(iconName: string): string {
  if (!I18nManager.isRTL) return iconName;

  const flips: Record<string, string> = {
    'arrow-back': 'arrow-forward',
    'arrow-forward': 'arrow-back',
    'chevron-forward': 'chevron-back',
    'chevron-back': 'chevron-forward',
  };

  return flips[iconName] || iconName;
}

/**
 * Returns the flex direction for a row that should respect RTL.
 * Use this when NativeWind's automatic RTL flipping is not enough.
 */
export function flexDir(): 'row' | 'row-reverse' {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
}

/**
 * Returns text alignment based on RTL.
 */
export function textAlign(): 'left' | 'right' {
  return I18nManager.isRTL ? 'right' : 'left';
}
