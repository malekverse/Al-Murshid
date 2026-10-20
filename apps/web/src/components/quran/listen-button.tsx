'use client';

import { Pause, Play } from '@phosphor-icons/react';
import { ICON_SIZE, iconButtonClass } from './reader-markup';
import { useRecitation } from './recitation-store';

/**
 * Listen from an ayah (Phase 6's ayah page): the app's one recitation, loaded on the first press,
 * so the page carries only this button until then.
 */
export function ListenButton({
  surah,
  ayah,
  labels,
}: {
  surah: number;
  ayah: number;
  labels: { listen: string; pause: string };
}) {
  const recitation = useRecitation();
  const here = recitation.surah === surah;
  const playing = here && recitation.playing;
  const label = playing ? labels.pause : labels.listen;
  const IconComponent = playing ? Pause : Play;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={iconButtonClass('tinted')}
      onClick={() => {
        if (playing) recitation.pause();
        else if (here) recitation.resume();
        else recitation.play(surah, ayah);
      }}
    >
      <IconComponent size={ICON_SIZE} weight="regular" aria-hidden />
    </button>
  );
}
