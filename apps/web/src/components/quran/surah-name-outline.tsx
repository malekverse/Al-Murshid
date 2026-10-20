import type { SurahName } from '@murshid/content/quran';
import { cn } from '@/lib/cn';

/**
 * A surah's calligraphic name drawn from its outline (Phase 6): the same shape as the name font
 * draws at `size`, without fetching the 200 KB font for one name. Decorative: the name is
 * written beside it. Used by the surah's public page and by the reader that takes it over.
 */
export function SurahNameOutline({
  name,
  size,
  className,
}: {
  name: SurahName;
  /** The font size the name font would be drawn at, in pixels. */
  size: number;
  className?: string;
}) {
  const { upem, ascender, descender, width, glyphs } = name;
  const height = ascender - descender;
  return (
    <svg
      aria-hidden
      viewBox={`0 ${-ascender} ${width} ${height}`}
      width={(size * width) / upem}
      height={(size * height) / upem}
      fill="currentColor"
      className={cn('text-ink', className)}
    >
      {glyphs.map(([x, y, d], i) => (
        // Outlines are in font units with y up; the page's y runs down.
        <path key={i} d={d} transform={`translate(${x} ${-y}) scale(1 -1)`} />
      ))}
    </svg>
  );
}
