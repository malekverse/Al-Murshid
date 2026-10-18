import { quranSizeRange, typeScale } from '@murshid/tokens';
import { Text } from 'react-native';
import { useTranslations } from 'use-intl';

export interface AyahTextProps {
  /**
   * Verbatim Quran text from packages/content, ending with its ayah number (the QPC Hafs font
   * draws it as the end-of-ayah ornament). Never edited, generated or animated.
   */
  text: string;
  surahName: string;
  number: number;
  /** Reader's chosen size, clamped to the allowed range (SPEC 6.2). */
  size?: number;
}

/**
 * One ayah in the Quran font, exactly as published; its end-of-ayah ornament keeps the mushaf's
 * own numerals (SPEC 5.5, 7). No letter spacing, synthetic weight or transform, and nothing
 * animates.
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
        // Quran text is a right-to-left paragraph in every UI language, so it starts at the
        // right edge even inside an English screen.
        direction: 'rtl',
      }}
    >
      {text}
    </Text>
  );
}
