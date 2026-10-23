import { SHAKES, shakeStep, startShakes } from '@murshid/core';
import { Accelerometer, Pedometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';

interface MovementProps {
  onDone: () => void;
  onActivity: () => void;
  /** This phone cannot count, or the permission was refused: offer sums instead. */
  onFallback: () => void;
}

/** A count toward a target, in a ring, read out as "12 of 30". */
function Count({ count, total, label }: { count: number; total: number; label: string }) {
  const format = useFormatter();
  return (
    <ProgressRing
      progress={Math.min(1, count / total)}
      size={200}
      stroke={10}
      label={label}
      valueText={label}
    >
      <Text role="display">{format.number(Math.min(count, total))}</Text>
      <Text role="callout" tone="muted">
        {format.number(total)}
      </Text>
    </ProgressRing>
  );
}

/** Walk away from the bed: the phone's step counter, from the moment the screen opened. */
export function Walk({ total, onDone, onActivity, onFallback }: MovementProps & { total: number }) {
  const t = useTranslations('rise.walk');
  const format = useFormatter();
  const [state, setState] = useState<'checking' | 'counting' | 'unavailable' | 'denied'>(
    'checking',
  );
  const [steps, setSteps] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let live = true;
    void (async () => {
      if (!(await Pedometer.isAvailableAsync())) return live && setState('unavailable');
      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted) return live && setState('denied');
      if (!live) return;
      setState('counting');
      sub = Pedometer.watchStepCount(({ steps: walked }) => {
        setSteps(walked);
        onActivity();
        if (walked >= total && !finished.current) {
          finished.current = true;
          haptics.success();
          onDone();
        }
      });
    })();
    return () => {
      live = false;
      sub?.remove();
    };
    // The callbacks change on every render of the ring screen; the count must not restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (state === 'unavailable' || state === 'denied') {
    return (
      <View className="flex-1 items-center justify-center gap-4">
        <Text role="body" className="text-center">
          {state === 'unavailable' ? t('unavailable') : t('permission')}
        </Text>
        {state === 'denied' && (
          <Button variant="secondary" onPress={() => void Linking.openSettings()}>
            {t('allow')}
          </Button>
        )}
        <Button onPress={onFallback}>{t('useSums')}</Button>
      </View>
    );
  }

  const label = t('count', { count: format.number(steps), total: format.number(total) });
  return (
    <View className="flex-1 items-center justify-center gap-6">
      <Text role="headline" className="text-center">
        {t('prompt')}
      </Text>
      <Count count={steps} total={total} label={label} />
    </View>
  );
}

/** Shake the phone firmly: for mornings when getting up is hard. */
export function Shake({ onDone, onActivity, onFallback }: MovementProps) {
  const t = useTranslations('rise.shake');
  const format = useFormatter();
  const [count, setCount] = useState(0);
  const state = useRef(startShakes);
  const finished = useRef(false);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let live = true;
    void (async () => {
      if (!(await Accelerometer.isAvailableAsync())) return live && onFallback();
      if (!live) return;
      Accelerometer.setUpdateInterval(40);
      sub = Accelerometer.addListener((sample) => {
        const next = shakeStep(state.current, sample, Date.now());
        if (next === state.current) return;
        state.current = next;
        setCount(next.count);
        onActivity();
        haptics.selection();
        if (next.count >= SHAKES && !finished.current) {
          finished.current = true;
          haptics.success();
          onDone();
        }
      });
    })();
    return () => {
      live = false;
      sub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = t('count', { count: format.number(count), total: format.number(SHAKES) });
  return (
    <View className="flex-1 items-center justify-center gap-6">
      <Text role="headline" className="text-center">
        {t('prompt')}
      </Text>
      <Count count={count} total={SHAKES} label={label} />
    </View>
  );
}
