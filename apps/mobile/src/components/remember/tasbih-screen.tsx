import {
  civilDate,
  isoDate,
  isTasbihComplete,
  litBeads,
  ringBeads,
  tapTasbih,
  TASBIH_MAX,
  tasbihTargets,
} from '@murshid/core';
import { placeOf } from '@murshid/data';
import { space } from '@murshid/tokens';
import { useKeepAwake } from 'expo-keep-awake';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { ArrowCounterClockwise } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { ChoiceList } from '@/components/choice-list';
import { Button } from '@/components/ui/button';
import { RollingNumber } from '@/components/ui/countdown';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { haptics } from '@/lib/haptics';
import { useAppLocale } from '@/lib/locale';
import { updateSettings, useSettings } from '@/lib/settings';
import { addTasbih, tasbihCount, useTasbihTotal } from '@/lib/tasbih';
import { useColors } from '@/lib/theme';
import { useNow } from '@/lib/use-now';
import { BeadRing } from './bead-ring';

// Tasbih (SPEC 5.6): the whole screen is the tap target. A large count, an optional target, a light
// haptic per tap and success at the target, the screen kept awake, the day's total saved locally.

export function TasbihScreen() {
  useKeepAwake();
  const t = useTranslations('remember.tasbih');
  const tc = useTranslations('common.actions');
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const settings = useSettings();
  const count = tasbihCount.useValue();
  const now = useNow(60_000);
  const timeZone = placeOf(settings)?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC';
  const date = isoDate(civilDate(now, timeZone));
  const total = useTasbihTotal(date);
  const target = settings.tasbihTarget;
  const complete = isTasbihComplete(count, target);
  const [choosing, setChoosing] = useState(false);

  const tap = () => {
    // The stored count, not the rendered one: a fast second tap can come before the re-render.
    const next = tapTasbih(tasbihCount.read(), target);
    tasbihCount.write(next.count);
    addTasbih(date);
    if (next.reached) {
      haptics.success();
      AccessibilityInfo.announceForAccessibility(t('reached'));
    } else {
      haptics.selection();
    }
  };

  const reset = () => {
    const before = count;
    tasbihCount.write(0);
    toast(t('resetDone'), { label: tc('undo'), onPress: () => tasbihCount.write(before) });
  };

  const countLabel = [
    t('count'),
    format.number(count),
    target ? t('of', { target: format.number(target) }) : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View
      className="flex-1 bg-canvas"
      style={{ paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[4] }}
    >
      <View className="flex-row items-center gap-2 px-4">
        <IconButton icon={ArrowLeft} label={tc('back')} mirror onPress={() => router.back()} />
        <Text role="title2" accessibilityRole="header" className="flex-1">
          {t('title')}
        </Text>
        <Button variant="ghost" onPress={() => setChoosing(true)}>
          {target ? t('target.value', { target: format.number(target) }) : t('target.none')}
        </Button>
        <IconButton
          icon={ArrowCounterClockwise}
          label={t('reset')}
          disabled={count === 0}
          onPress={reset}
        />
      </View>

      {/* The whole screen counts. */}
      <Pressable
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel={countLabel}
        className="flex-1 items-center justify-center gap-6"
      >
        <View className="items-center justify-center">
          <BeadRing beads={ringBeads(target)} lit={litBeads(count, target)} complete={complete} />
          <View className="absolute items-center gap-1">
            <RollingNumber
              value={format.number(count)}
              role="display"
              tone={complete ? 'lantern' : 'default'}
            />
            {target && (
              <Text role="callout" tone="muted">
                {t('of', { target: format.number(target) })}
              </Text>
            )}
          </View>
        </View>
        <Text role="callout" tone={complete ? 'lantern' : 'muted'}>
          {complete ? t('reached') : t('hint')}
        </Text>
      </Pressable>

      <Text role="caption" tone="muted" className="text-center">
        {total !== undefined ? t('today', { count: format.number(total) }) : ' '}
      </Text>

      <TargetSheet
        open={choosing}
        onClose={() => setChoosing(false)}
        target={target}
        onChange={(next) => {
          updateSettings((s) => ({ ...s, tasbihTarget: next }));
          setChoosing(false);
        }}
      />
    </View>
  );
}

function TargetSheet({
  open,
  onClose,
  target,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  target: number | null;
  onChange: (target: number | null) => void;
}) {
  const t = useTranslations('remember.tasbih.target');
  const format = useFormatter();
  const { locale } = useAppLocale();
  const color = useColors();
  const custom = target !== null && !(tasbihTargets as readonly number[]).includes(target);
  const [draft, setDraft] = useState(custom ? String(target) : '');
  const value = Number.parseInt(draft, 10);
  const valid = Number.isInteger(value) && value >= 1 && value <= TASBIH_MAX;
  const choices = [
    ...tasbihTargets.map((n) => ({ value: String(n), label: format.number(n) })),
    { value: 'none', label: t('none') },
  ];

  return (
    <Sheet open={open} onClose={onClose} title={t('label')}>
      <View className="gap-6">
        <ChoiceList
          label={t('label')}
          choices={choices}
          value={custom ? 'custom' : target === null ? 'none' : String(target)}
          onChange={(v) => onChange(v === 'none' ? null : Number(v))}
        />
        <View className="gap-2">
          <Text role="callout" importantForAccessibility="no">
            {t('customLabel')}
          </Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              accessibilityLabel={t('customLabel')}
              keyboardType="number-pad"
              maxLength={4}
              placeholderTextColor={color.inkMuted}
              className={`min-h-touch flex-1 rounded-control border border-hairline bg-surface px-4 text-ink dark:border-card-edge ${locale === 'ar' ? 'font-ui text-ar-body' : 'font-ui text-body'}`}
            />
            <Button variant="secondary" disabled={!valid} onPress={() => onChange(value)}>
              {t('set')}
            </Button>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
