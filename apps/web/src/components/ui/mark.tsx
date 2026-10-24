import { markGlyph } from '@murshid/tokens';

// Al-Murshid's mark (SPEC 6.7): one eight-pointed star from the lattice, in lantern light, rising
// over the horizon arc of the prayer glyphs: the guide above the day. No hooks, so server pages
// draw it without a script. Colors come from the theme through currentColor and the lantern token.

export function Mark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className={className}
      focusable="false"
    >
      <polygon points={markGlyph.star} className="fill-lantern" />
      <path
        d={markGlyph.arc}
        fill="none"
        stroke="currentColor"
        strokeWidth={markGlyph.arcStroke}
        strokeLinecap="round"
      />
    </svg>
  );
}
