// Al-Murshid's mark (SPEC 6.7): one eight-pointed star from the lattice, in lantern light, rising
// over the horizon arc of the prayer glyphs: the guide above the day. No hooks, so server pages
// draw it without a script. Colors come from the theme through currentColor and the lantern token.

// The lattice's star {8/3}: its inner radius is cos(3π/8) / cos(π/8) of the outer.
const INNER = Math.cos((3 * Math.PI) / 8) / Math.cos(Math.PI / 8);
const STAR = Array.from({ length: 16 }, (_, k) => {
  const r = k % 2 === 0 ? 15 : 15 * INNER;
  const a = (Math.PI / 8) * k - Math.PI / 2;
  return `${(32 + r * Math.cos(a)).toFixed(2)},${(26 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

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
      <polygon points={STAR} className="fill-lantern" />
      <path
        d="M6 52 Q32 38 58 52"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
