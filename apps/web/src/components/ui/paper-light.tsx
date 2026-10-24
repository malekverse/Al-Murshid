'use client';

import { sunPosition } from '@murshid/core';
import { colors, paperScene, periodSun, skyAt, starlight } from '@murshid/tokens';
import { useId } from 'react';
import { useResolvedTheme } from '@/components/theme';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';
import { PaperScene } from './paper-scene';

// Illustration: paper and light (SPEC 6.7), in the colors of the sky above the person now: the saved
// city's, Fajr's until the page knows it.

export function PaperLight({
  seed,
  width,
  height,
  className,
}: {
  /** The place it is drawn for: each has its own skyline. */
  seed: string;
  width: number;
  height: number;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const theme = useResolvedTheme();
  const settings = useSettings();
  const now = useNow(60_000);
  const place = settings?.location;
  const sun = now && place ? sunPosition(now, place) : periodSun.fajr;
  const palette = colors[theme];
  const scene = paperScene(seed, skyAt(sun), sun, palette.canvas, starlight, palette.lantern, {
    width,
    height,
  });

  return <PaperScene scene={scene} id={id} className={className} />;
}
