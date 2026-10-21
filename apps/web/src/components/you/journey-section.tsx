'use client';

import {
  prayers,
  previousStep,
  steps,
  tracks,
  type Prayer,
  type Step,
  type Track,
} from '@murshid/core';
import {
  pauseJourneyTrack,
  stepBackJourney,
  withFocusPrayer,
  withJourneyStep,
  type Settings,
} from '@murshid/data';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { ChoiceSheet } from '@/components/settings-controls';
import { useStepLabel } from '@/components/today/parts';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePrayerName } from '@/lib/format';
import { updateSettings } from '@/lib/settings';

// The Journey (SPEC 3, 5.7): each track's current step, with "Change focus" and "Step back" one
// tap away. Stepping back or pausing a track says nothing about failure; it just changes.

export function JourneySection({ settings }: { settings: Settings }) {
  const t = useTranslations('journey');
  const stepLabel = useStepLabel();
  const prayerName = usePrayerName();
  const [choosing, setChoosing] = useState<Track | null>(null);
  const [choosingPrayer, setChoosingPrayer] = useState(false);
  const headingId = useId();
  const { focusPrayer } = settings.journey.prayer;

  const choices = choosing
    ? (steps[choosing] as readonly Step[]).map((step) => ({
        value: step,
        label: stepLabel(step, focusPrayer),
      }))
    : [];

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-2">
        <Text as="h2" role="headline" id={headingId}>
          {t('title')}
        </Text>
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        {tracks.map((track) => {
          const current = settings.journey[track];
          const canStepBack = current && previousStep(track, current.step) !== current.step;
          return (
            <section
              key={track}
              aria-labelledby={`${headingId}-${track}`}
              className="flex flex-col gap-3 rounded-card border border-card-edge bg-surface p-4 shadow-card dark:shadow-none"
            >
              <div className="flex flex-col gap-1">
                <Text as="h3" role="callout" tone="muted" id={`${headingId}-${track}`}>
                  {t(`tracks.${track}`)}
                </Text>
                <Text role="body" tone={current ? 'default' : 'muted'}>
                  {current ? stepLabel(current.step, focusPrayer) : t('off')}
                </Text>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setChoosing(track)}>
                  {current ? t('changeFocus') : t('start')}
                </Button>
                {canStepBack && (
                  <Button
                    variant="ghost"
                    onClick={() => updateSettings((s) => stepBackJourney(s, track))}
                  >
                    {t('stepBack')}
                  </Button>
                )}
                {current && track !== 'prayer' && (
                  <Button
                    variant="ghost"
                    onClick={() => updateSettings((s) => pauseJourneyTrack(s, track))}
                  >
                    {t('pause')}
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <ChoiceSheet<Step | ''>
        open={choosing !== null}
        onOpenChange={(open) => !open && setChoosing(null)}
        title={t('chooseStep')}
        choices={choices}
        value={(choosing && settings.journey[choosing]?.step) || ''}
        onChange={(step) => {
          if (!choosing || !step) return;
          const track = choosing;
          updateSettings((s) => withJourneyStep(s, track, step as Step<typeof track>));
          // The first prayer step is one chosen prayer: ask which.
          if (track === 'prayer' && step === 'one-prayer') setChoosingPrayer(true);
        }}
      />
      <ChoiceSheet<Prayer>
        open={choosingPrayer}
        onOpenChange={setChoosingPrayer}
        title={t('focusPrayer')}
        choices={prayers.map((p) => ({ value: p, label: prayerName(p) }))}
        value={focusPrayer}
        onChange={(p) => updateSettings((s) => withFocusPrayer(s, p))}
      />
    </section>
  );
}
