import { iconStroke, prayerGlyph, type PrayerName } from '@murshid/tokens';
import Svg, { Circle, Line, Path } from 'react-native-svg';

/** The sun on its daily arc for one prayer (SPEC 6.3). Never mirrored. */
export function PrayerGlyph({
  prayer,
  color,
  size = 24,
}: {
  prayer: PrayerName;
  color: string;
  size?: number;
}) {
  const g = prayerGlyph(prayer);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={iconStroke}
      strokeLinecap="round"
    >
      <Path d={g.arc} strokeDasharray="0 3" strokeOpacity={0.55} />
      <Line {...g.horizon} />
      <Circle cx={g.sun.cx} cy={g.sun.cy} r={g.sun.r} fill={g.sun.filled ? color : 'none'} />
    </Svg>
  );
}
