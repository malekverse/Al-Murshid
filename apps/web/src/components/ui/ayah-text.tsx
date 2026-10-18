import { quranSizeRange, typeScale } from '@murshid/tokens';
import { useTranslations } from 'next-intl';

export interface AyahTextProps {
  /**
   * Verbatim Quran text from packages/content, ending with its ayah number (the QPC Hafs font
   * draws it as the end-of-ayah ornament). Never edited, generated or animated.
   */
  text: string;
  surahName: string;
  number: number;
  /** Reader's chosen size in px, clamped to the allowed range (SPEC 6.2). */
  size?: number;
}

/**
 * One ayah in the Quran font, exactly as published. Its end-of-ayah ornament keeps the mushaf's
 * own numerals whatever the digit setting (SPEC 7). No letter spacing, synthetic weight or
 * transform is ever applied (SPEC 5.5), and nothing here animates (SPEC 2).
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
    <p
      lang="ar"
      dir="rtl"
      aria-label={`${t('label', { surah: surahName, number })}: ${text}`}
      className="font-quran text-ink"
      style={{ fontSize: px, lineHeight: typeScale.quran.arabic.lineHeight }}
    >
      {text}
    </p>
  );
}
