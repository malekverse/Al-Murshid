import { prayers, previousStep, steps, tracks, type Step, type Track } from '@murshid/core';
import {
  pauseJourneyTrack,
  stepBackJourney,
  withFocusPrayer,
  withJourneyStep,
  type Settings,
} from '@murshid/data';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { ChoiceList } from '../choice-list';
import { Button } from '../ui/button';
import { Sheet } from '../ui/sheet';
import { Text } from '../ui/text';
import { usePrayerName, useStepLabel } from '@/lib/format';
import { updateSettings } from '@/lib/settings';

// The Journey (SPEC 3, 5.7): each track's current step, with "Change focus" and "Step back" one
// tap away. Stepping back or pausing a track says nothing about failure; it just changes.

type Choosing = { kind: 'step'; track: Track } | { kind: 'prayer' } | null;

export function JourneySection({ settings }: { settings: Settings }) {
  const t = useTranslations('journey');
  const stepLabel = useStepLabel();
  const prayerName = usePrayerName();
  const [choosing, setChoosing] = useState<Choosing>(null);
  const { focusPrayer } = settings.journey.prayer;
  const close = () => setChoosing(null);

  return (
    <View className="gap-3">
      <View className="gap-1 px-2">
        <Text role="headline" accessibilityRole="header">
          {t('title')}
        </Text>
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
      </View>

      {tracks.map((track) => {
        const current = settings.journey[track];
        const canStepBack = current && previousStep(track, current.step) !== current.step;
        return (
          <View
            key={track}
            accessibilityLabel={t(`tracks.${track}`)}
            className="gap-3 rounded-card border border-card-edge bg-surface p-4 shadow-card dark:shadow-none"
          >
            <View className="gap-1">
              <Text role="callout" tone="muted" accessibilityRole="header">
                {t(`tracks.${track}`)}
              </Text>
              <Text role="body" tone={current ? 'default' : 'muted'}>
                {current ? stepLabel(current.step, focusPrayer) : t('off')}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Button variant="secondary" onPress={() => setChoosing({ kind: 'step', track })}>
                {current ? t('changeFocus') : t('start')}
              </Button>
              {canStepBack && (
                <Button
                  variant="ghost"
                  onPress={() => updateSettings((s) => stepBackJourney(s, track))}
                >
                  {t('stepBack')}
                </Button>
              )}
              {current && track !== 'prayer' && (
                <Button
                  variant="ghost"
                  onPress={() => updateSettings((s) => pauseJourneyTrack(s, track))}
                >
                  {t('pause')}
                </Button>
              )}
            </View>
          </View>
        );
      })}

      <Sheet
        open={choosing !== null}
        onClose={close}
        title={choosing?.kind === 'prayer' ? t('focusPrayer') : t('chooseStep')}
      >
        {choosing?.kind === 'step' && (
          <ChoiceList<Step | ''>
            label={t('chooseStep')}
            value={settings.journey[choosing.track]?.step ?? ''}
            choices={(steps[choosing.track] as readonly Step[]).map((step) => ({
              value: step,
              label: stepLabel(step, focusPrayer),
            }))}
            onChange={(step) => {
              if (!step) return;
              const { track } = choosing;
              updateSettings((s) => withJourneyStep(s, track, step as Step<typeof track>));
              // The first prayer step is one chosen prayer: ask which.
              setChoosing(track === 'prayer' && step === 'one-prayer' ? { kind: 'prayer' } : null);
            }}
          />
        )}
        {choosing?.kind === 'prayer' && (
          <ChoiceList
            label={t('focusPrayer')}
            value={focusPrayer}
            choices={prayers.map((p) => ({ value: p, label: prayerName(p) }))}
            onChange={(p) => {
              updateSettings((s) => withFocusPrayer(s, p));
              close();
            }}
          />
        )}
      </Sheet>
    </View>
  );
}
