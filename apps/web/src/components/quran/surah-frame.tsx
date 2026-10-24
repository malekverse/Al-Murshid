import { surahFrameGlyph as frame } from '@murshid/tokens';
import type { ReactNode } from 'react';

// A surah's opening frame (Phase 7c, SPEC 6.7): the calligraphic name in a cartouche of two rules
// ending in pointed caps, a lattice star in each, in lantern light, the way a printed mushaf frames
// each surah. Symmetric, so it is laid out left to right in every language, the caps opening
// toward the rules; the name inside keeps its own direction. No hooks: server pages draw it too.
// The geometry is shared with the phone (tokens' surahFrameGlyph).

function Cap({ end }: { end?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      width={frame.width}
      height={frame.height}
      className="shrink-0"
      aria-hidden
      focusable="false"
    >
      <g transform={end ? `matrix(-1 0 0 1 ${frame.width} 0)` : undefined} fill="none">
        <path d={frame.cap.outer} stroke="currentColor" strokeWidth={frame.rules[0].stroke} />
        <path
          d={frame.cap.inner}
          stroke="currentColor"
          strokeOpacity={0.5}
          strokeWidth={frame.rules[1].stroke}
        />
        {/* The rules' first stretch, as lines like the rest, so they meet without a seam. */}
        {frame.rules.map(({ y, x, stroke, faint }) => (
          <line
            key={y}
            x1={x}
            x2={frame.width}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity={faint ? 0.5 : 1}
            strokeWidth={stroke}
          />
        ))}
        <polygon points={frame.cap.star} className="fill-lantern" />
      </g>
    </svg>
  );
}

export function SurahFrame({ children }: { children: ReactNode }) {
  return (
    <div
      dir="ltr"
      className="flex w-full items-center text-lantern-ink"
      style={{ height: frame.height }}
    >
      <Cap />
      <div className="relative flex h-full min-w-0 flex-1 items-center justify-center">
        <svg
          viewBox={`0 0 100 ${frame.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          aria-hidden
          focusable="false"
        >
          {frame.rules.map(({ y, stroke, faint }) => (
            <line
              key={y}
              x1={0}
              x2={100}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={faint ? 0.5 : 1}
              strokeWidth={stroke}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="relative">{children}</div>
      </div>
      <Cap end />
    </div>
  );
}
