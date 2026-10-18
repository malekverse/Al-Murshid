import { direction, type Direction } from '@murshid/i18n';
import { useLocale } from 'next-intl';

/** Reading direction of the current UI locale. */
export function useDirection(): Direction {
  return direction(useLocale());
}

/** Latin or Arabic metrics for the current UI locale. */
export function useScript(): 'latin' | 'arabic' {
  return useLocale() === 'ar' ? 'arabic' : 'latin';
}
