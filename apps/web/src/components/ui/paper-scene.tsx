import { starlight, type PaperScene as Scene } from '@murshid/tokens';
import { cn } from '@/lib/cn';

// Illustration: paper and light (SPEC 6.7), drawn from a scene the tokens computed (paperScene):
// the sky, a glass disc of light, and paper horizons with soft shadows, the edges fading into
// whatever is behind. No hooks, so a server page draws it without a script; PaperLight draws it in
// the colors of the sky now. Decorative and never behind text.

/**
 * Stops for a band's edge fade, eased so it ends without a line: clear at an edge to opaque at
 * `start` of the way in, and back at the far edge over `end` (the start's width if unset).
 */
function fadeStops(start: number, end = start): [number, number][] {
  const ease = [0, 0.38, 0.7, 0.9, 1];
  const near = ease.map((o, i): [number, number] => [(start * i) / 4, o]);
  const far = ease.map((o, i): [number, number] => [1 - (end * i) / 4, o]).reverse();
  return [...near, ...far];
}

export function PaperScene({
  scene,
  id,
  className,
}: {
  scene: Scene;
  id: string;
  className?: string;
}) {
  const { width, height, light } = scene;
  // A square picture fades all around; a wide one (a band) along its sides and top only.
  const wide = width > 2 * height;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('max-w-full', className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.sky.top} />
          <stop offset="1" stopColor={scene.sky.bottom} />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor={light.glow} stopOpacity={0.55} />
          <stop offset="1" stopColor={light.glow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}glass`} cx="0.4" cy="0.35">
          <stop offset="0" stopColor={light.color} stopOpacity={0.95} />
          <stop offset="1" stopColor={light.color} stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`${id}fade`}>
          <stop offset="0.35" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}sides`}>
          {fadeStops(0.22).map(([offset, opacity]) => (
            <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}top`} x1="0" y1="0" x2="0" y2="1">
          {fadeStops(0.45, 0.1).map(([offset, opacity]) => (
            <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
          ))}
        </linearGradient>
        <mask id={`${id}mask`}>
          <rect width={width} height={height} fill={`url(#${id}${wide ? 'sides' : 'fade'})`} />
        </mask>
        <mask id={`${id}mask2`}>
          <rect width={width} height={height} fill={wide ? `url(#${id}top)` : 'white'} />
        </mask>
        <filter id={`${id}shadow`} x="-10%" y="-20%" width="120%" height="140%">
          <feDropShadow dx="0" dy="-1.5" stdDeviation="2" floodColor="black" floodOpacity="0.12" />
        </filter>
      </defs>
      <g mask={`url(#${id}mask)`}>
        <g mask={`url(#${id}mask2)`}>
          <rect width={width} height={height} fill={`url(#${id}sky)`} />
          <circle cx={light.cx} cy={light.cy} r={light.r * 3} fill={`url(#${id}glow)`} />
          {/* Glass: the light shows through a pale disc with a bright rim. */}
          <circle
            cx={light.cx}
            cy={light.cy}
            r={light.r}
            fill={`url(#${id}glass)`}
            stroke={starlight}
            strokeOpacity={0.8}
          />
          {scene.layers.map((layer) => (
            <g key={layer.depth} filter={`url(#${id}shadow)`}>
              <path d={layer.d} fill={layer.fill} stroke={layer.edge} strokeOpacity={0.6} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
