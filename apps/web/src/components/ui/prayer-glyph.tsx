import { iconStroke, prayerGlyph, type PrayerName } from '@murshid/tokens';

/** The sun on its daily arc for one prayer (SPEC 6.3). Never mirrored. */
export function PrayerGlyph({
  prayer,
  size = 24,
  className,
}: {
  prayer: PrayerName;
  size?: number;
  className?: string;
}) {
  const g = prayerGlyph(prayer);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={iconStroke}
      strokeLinecap="round"
      className={className}
    >
      <path d={g.arc} strokeDasharray="0 3" opacity={0.55} />
      <line {...g.horizon} />
      <circle
        cx={g.sun.cx}
        cy={g.sun.cy}
        r={g.sun.r}
        fill={g.sun.filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}
