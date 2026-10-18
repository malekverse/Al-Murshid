import { patternOpacity } from '@murshid/tokens';
import { useId } from 'react';
import { cn } from '@/lib/cn';

// One eight-fold star {8/3} per tile, drawn on a 48 px grid.
const TILE = 48;
const R = 20;
const star = (() => {
  const points = Array.from({ length: 8 }, (_, k) => {
    const a = ((22.5 + 45 * k) * Math.PI) / 180;
    return [TILE / 2 + R * Math.cos(a), TILE / 2 + R * Math.sin(a)] as const;
  });
  // Connect every third vertex to draw the star.
  const order = Array.from({ length: 8 }, (_, k) => points[(k * 3) % 8]!);
  return `M ${order.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;
})();

/**
 * The one geometric motif (SPEC 6.3): an eight-fold star lattice at 4% opacity or less.
 * Only for empty states, the Qibla ring and the splash, and never behind text.
 */
export function StarLattice({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none', className)}
      style={{ opacity: patternOpacity }}
    >
      <defs>
        <pattern id={id} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <path d={star} fill="none" stroke="currentColor" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
