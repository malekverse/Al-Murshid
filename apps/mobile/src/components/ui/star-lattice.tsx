import { colors, patternOpacity } from '@murshid/tokens';
import { useId } from 'react';
import Svg, { Defs, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '@/lib/theme';

const TILE = 48;
const R = 20;
const star = (() => {
  const points = Array.from({ length: 8 }, (_, k) => {
    const a = ((22.5 + 45 * k) * Math.PI) / 180;
    return [TILE / 2 + R * Math.cos(a), TILE / 2 + R * Math.sin(a)] as const;
  });
  const order = Array.from({ length: 8 }, (_, k) => points[(k * 3) % 8]!);
  return `M ${order.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;
})();

/**
 * The eight-fold star lattice (SPEC 6.3) at 4% opacity or less, fading out radially so it
 * stays inside its square and never reaches text.
 */
export function StarLattice({ size }: { size: number }) {
  const color = useColors();
  const id = useId().replace(/:/g, '');
  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute', opacity: patternOpacity }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id={`p${id}`} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <Path d={star} fill="none" stroke={color.ink} strokeWidth={1} />
        </Pattern>
        {/* A luminance mask: opaque white in the middle, fading out toward the edges. */}
        <RadialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0.35" stopColor={colors.light.surface} stopOpacity={1} />
          <Stop offset="1" stopColor={colors.light.surface} stopOpacity={0} />
        </RadialGradient>
        <Mask id={`m${id}`}>
          <Rect width="100%" height="100%" fill={`url(#g${id})`} />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#p${id})`} mask={`url(#m${id})`} />
    </Svg>
  );
}
