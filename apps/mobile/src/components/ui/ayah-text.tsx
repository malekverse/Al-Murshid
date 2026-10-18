import { toArabicIndic } from '@murshid/i18n';
import { quranSizeRange, typeScale } from '@murshid/tokens';
import { Text } from 'react-native';
import { useTranslations } from 'use-intl';

export interface AyahTextProps {
  /** Verbatim Quran text from packages/content. Never edited, generated or animated. */
  text: string;
  surahName: string;
  number: number;
  /** Reader's chosen size, clamped to the allowed range (SPEC 6.2). */
  size?: number;
}

/**
 * One ayah in the Quran font with its end-of-ayah marker in Arabic-Indic digits (SPEC 5.5, 7).
 * No letter spacing, synthetic weight or transform, and nothing animates.
 */
export function AyahText({
  text,
  surahName,
  number,
  size = typeScale.quran.arabic.size,
}: AyahTextProps) {
  const t = useTranslations('components.ayah');
  const px = Math.min(quranSizeRange.max, Math.max(quranSizeRange.min, size));
  return (
    <Text
      accessibilityLabel={`${t('label', { surah: surahName, number })}: ${text}`}
      className="font-quran text-ink"
      style={{
        fontSize: px,
        lineHeight: px * typeScale.quran.arabic.lineHeight,
        writingDirection: 'rtl',
      }}
    >
      {text} {'۝'}
      {toArabicIndic(number)}
    </Text>
  );
}
