import { starlight } from '@murshid/tokens';

// The sky's stars and grain (SPEC 5.1), shared by the app's living sky and the landing page. No
// hooks, so a server-rendered page can draw it without sending a script.

// Deterministic star field: the same sky on every render and on the server.
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rand = seeded(1447);
  // Rounded so server and browser produce identical markup (Math.pow differs in the last bits).
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return Array.from({ length: 90 }, () => ({
    x: r2(rand() * 100),
    // Stars thin out toward the horizon.
    y: r2(rand() ** 1.6 * 70),
    r: r2(0.4 + rand() * 1.1),
    o: r2(0.35 + rand() * 0.65),
    twinkle: rand() < 0.2,
    delay: r2(rand()),
  }));
})();

/**
 * Stars that thin out toward the horizon, at the sky's `opacity`, and a fine grain that keeps long
 * gradients from banding on 8-bit screens. `grainId` must be unique on the page.
 */
export function StarField({
  opacity,
  twinkle,
  grainId,
}: {
  opacity: number;
  twinkle: boolean;
  grainId: string;
}) {
  return (
    <>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        style={{
          opacity,
          transition: twinkle ? 'opacity var(--duration-ambient) var(--ease-standard)' : undefined,
        }}
      >
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill={starlight}
            opacity={s.o}
            style={
              s.twinkle && twinkle
                ? {
                    animation: `murshid-twinkle calc(var(--duration-ambient) * 4) ease-in-out infinite`,
                    animationDelay: `calc(var(--duration-ambient) * ${(s.delay * 4).toFixed(2)})`,
                  }
                : undefined
            }
          />
        ))}
      </svg>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-[0.06] mix-blend-overlay"
      >
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
    </>
  );
}
