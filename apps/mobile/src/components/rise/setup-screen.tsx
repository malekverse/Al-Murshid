import {
  civilDate,
  daysBetween,
  RISE_RANGES,
  riseAnchors,
  type RiseChallenge,
  type RiseSettings,
} from '@murshid/core';
import { placeOf } from '@murshid/data';
import { space } from '@murshid/tokens';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState, Linking, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { ChoiceList } from '@/components/choice-list';
import { Stepper } from '@/components/stepper';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { PaperLight } from '@/components/ui/paper-light';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { useTimeFormat } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAppLocale } from '@/lib/locale';
import {
  nextAlarm,
  riseNative,
  riseSettings,
  testRise,
  updateRise,
  type AlarmAuthorization,
} from '@/lib/rise';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';
import { weekStart } from '@/lib/week';
import { Scanner } from './scan';

/** The challenges offered today; Move and Aloud join when they ship (docs/PHASE-7B.md). */
const offered: RiseChallenge[] = ['mind', 'steps', 'shake', 'spot'];
const MINUTES_STEP = 5;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text role="headline" accessibilityRole="header" className="px-2">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Note({
  text,
  action,
  onAction,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="gap-3 rounded-card bg-lantern/10 p-4">
      <Text role="callout">{text}</Text>
      {action && onAction && (
        <Button variant="secondary" onPress={onAction}>
          {action}
        </Button>
      )}
    </View>
  );
}

interface Permissions {
  notifications: boolean;
  canAsk: boolean;
  exact: boolean;
  fullScreen: boolean;
  /** iOS: AlarmKit's permission ("unsupported" before iOS 26). */
  alarms?: AlarmAuthorization;
}

/** What the alarm needs from the phone, checked again whenever the app comes back. */
function usePermissions() {
  const [state, setState] = useState<Permissions | null>(null);
  const refresh = useCallback(() => {
    void Notifications.getPermissionsAsync().then((p) =>
      setState({
        notifications: p.granted,
        canAsk: p.canAskAgain,
        ...(riseNative?.permissions() ?? { exact: true, fullScreen: true }),
      }),
    );
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  return [state, refresh] as const;
}

/** Fajr Rise's setup (SPEC 5.10): when, which days, the challenge, the sound, and the checks. */
export function RiseSetup() {
  const t = useTranslations('rise');
  const tc = useTranslations('common.actions');
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const { locale } = useAppLocale();
  const settings = useSettings();
  const rise = riseSettings.useValue();
  const place = placeOf(settings);
  const timeZone = place?.timeZone ?? 'UTC';
  const time = useTimeFormat(timeZone);
  const now = useNow(60_000);
  const [scanning, setScanning] = useState(false);
  const [permissions, refresh] = usePermissions();

  const change = (next: Partial<RiseSettings>) => updateRise((r) => ({ ...r, ...next }));
  const next = rise.enabled ? nextAlarm(now) : null;

  const nextLabel = () => {
    if (!next) return t('next.none');
    const days = daysBetween(civilDate(now, timeZone), civilDate(next.at, timeZone));
    const at = time(next.at);
    if (days === 0) return t('next.today', { time: at });
    if (days === 1) return t('next.tomorrow', { time: at });
    return t('next.day', {
      day: format.dateTime(next.at, { weekday: 'long', timeZone }),
      time: at,
    });
  };

  const enable = async (on: boolean) => {
    change({ enabled: on });
    if (!on || !permissions) return;
    if (permissions.alarms === 'notDetermined') await riseNative?.requestAlarms?.();
    if (!permissions.notifications && permissions.canAsk) {
      await Notifications.requestPermissionsAsync();
    }
    refresh();
  };

  const range =
    rise.anchor === 'before-sunrise' ? RISE_RANGES.beforeSunrise : RISE_RANGES.beforeFajr;
  const minutes = Math.min(range.max, Math.max(range.min, rise.minutes));
  const setMinutes = (value: number) =>
    change({ minutes: Math.min(range.max, Math.max(range.min, value)) });

  // The week as the language counts it: Saturday first in Arabic.
  const first = weekStart[locale] ?? 0;
  const week = Array.from({ length: 7 }, (_, i) => (first + i) % 7);
  // 4 January 2026 is a Sunday, so day d of the week is the 4th + d.
  const dayName = (d: number, weekday: 'narrow' | 'long') =>
    format.dateTime(new Date(Date.UTC(2026, 0, 4 + d, 12)), { weekday, timeZone: 'UTC' });
  const toggleDay = (d: number) => {
    haptics.selection();
    const has = rise.weekdays.includes(d);
    // At least one day stays: turning the alarm off is the switch above.
    if (has && rise.weekdays.length === 1) return;
    change({
      weekdays: has ? rise.weekdays.filter((x) => x !== d) : [...rise.weekdays, d].sort(),
    });
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top + space[2] }}>
      <View className="flex-row items-center gap-2 px-4">
        <IconButton icon={ArrowLeft} label={tc('back')} mirror onPress={() => router.back()} />
        <Text role="title2" accessibilityRole="header" className="flex-1">
          {t('title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space[4],
          paddingTop: space[4],
          paddingBottom: insets.bottom + space[12],
          gap: space[8],
        }}
      >
        {/* Paper and light (SPEC 6.7), in the sky of the moment. */}
        <PaperLight seed="fajr-rise" width={width - 2 * space[4]} height={2 * space[16]} />
        <Text role="body" tone="muted" className="px-2">
          {t('intro')}
        </Text>

        <View className="gap-3">
          <ListGroup>
            <ListRow
              title={t('enabled')}
              subtitle={rise.enabled ? nextLabel() : undefined}
              control={
                <Toggle
                  checked={rise.enabled}
                  onChange={(on) => void enable(on)}
                  label={t('enabled')}
                  testID="rise-enabled"
                />
              }
            />
          </ListGroup>
          {!riseNative && <Note text={t('permissions.unavailable')} />}
          {rise.enabled && !place && (
            <Note
              text={t('permissions.city')}
              action={t('permissions.cityAction')}
              onAction={() => router.replace('/welcome')}
            />
          )}
          {permissions?.alarms === 'unsupported' && <Note text={t('permissions.ios')} />}
          {rise.enabled && permissions?.alarms === 'notDetermined' && (
            <Note
              text={t('permissions.alarms')}
              action={t('permissions.alarmsAction')}
              onAction={() => void riseNative?.requestAlarms?.().then(refresh)}
            />
          )}
          {rise.enabled && permissions?.alarms === 'denied' && (
            <Note
              text={t('permissions.alarmsDenied')}
              action={t('spot.openSettings')}
              onAction={() => void Linking.openSettings()}
            />
          )}
          {rise.enabled && permissions && !permissions.notifications && (
            <Note
              text={t('permissions.notifications')}
              action={
                permissions.canAsk ? t('permissions.notificationsAction') : t('spot.openSettings')
              }
              onAction={() =>
                permissions.canAsk
                  ? void Notifications.requestPermissionsAsync().then(refresh)
                  : void Linking.openSettings()
              }
            />
          )}
          {rise.enabled && permissions && !permissions.exact && (
            <Note
              text={t('permissions.exact')}
              action={t('permissions.exactAction')}
              onAction={() => void riseNative?.openExactSettings()}
            />
          )}
          {rise.enabled && permissions && !permissions.fullScreen && (
            <Note
              text={t('permissions.fullScreen')}
              action={t('permissions.fullScreenAction')}
              onAction={() => void riseNative?.openFullScreenSettings()}
            />
          )}
        </View>

        {rise.enabled && (
          <>
            <Section title={t('when.label')}>
              {/* A list, not segments: three Arabic labels do not fit one row on a small phone. */}
              <View className="rounded-card border border-card-edge bg-surface p-2">
                <ChoiceList
                  label={t('when.label')}
                  value={rise.anchor}
                  choices={riseAnchors.map((a) => ({ value: a, label: t(`when.anchors.${a}`) }))}
                  onChange={(anchor) =>
                    change({
                      anchor,
                      minutes:
                        anchor === 'before-sunrise'
                          ? Math.max(RISE_RANGES.beforeSunrise.min, rise.minutes)
                          : Math.min(RISE_RANGES.beforeFajr.max, rise.minutes),
                    })
                  }
                />
              </View>
              {rise.anchor !== 'fajr' && (
                <ListGroup>
                  <Stepper
                    label={t(
                      rise.anchor === 'before-fajr' ? 'when.beforeFajr' : 'when.beforeSunrise',
                      {
                        count: minutes,
                      },
                    )}
                    valueText=""
                    decreaseLabel={t('when.fewer')}
                    increaseLabel={t('when.more')}
                    canDecrease={minutes > range.min}
                    canIncrease={minutes < range.max}
                    onDecrease={() => setMinutes(minutes - MINUTES_STEP)}
                    onIncrease={() => setMinutes(minutes + MINUTES_STEP)}
                  />
                </ListGroup>
              )}
              {rise.anchor === 'before-sunrise' && (
                <Text role="caption" tone="muted" className="px-2">
                  {t('when.sunriseNote')}
                </Text>
              )}
            </Section>

            <Section title={t('days.label')}>
              <View className="flex-row justify-between gap-1">
                {week.map((d) => {
                  const on = rise.weekdays.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => toggleDay(d)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={dayName(d, 'long')}
                      accessibilityState={{ checked: on }}
                      className={`size-touch items-center justify-center rounded-full border ${
                        on ? 'border-lantern bg-lantern' : 'border-hairline bg-surface'
                      }`}
                    >
                      <Text role="callout" tone={on ? 'onLantern' : 'default'}>
                        {dayName(d, 'narrow')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title={t('challenge.label')}>
              <View className="gap-4 rounded-card border border-card-edge bg-surface p-2">
                <ChoiceList
                  label={t('challenge.label')}
                  value={rise.challenge === 'move' ? 'mind' : rise.challenge}
                  onChange={(challenge) => change({ challenge })}
                  choices={offered.map((c) => ({
                    value: c,
                    label: t(`challenge.kinds.${c as 'mind'}`),
                    hint:
                      c === 'steps'
                        ? t('challenge.notes.steps', { count: rise.steps })
                        : t(`challenge.notes.${c as 'mind'}`),
                  }))}
                />
              </View>

              {rise.challenge === 'mind' && (
                <View className="gap-3">
                  <Text role="callout" tone="muted" className="px-2">
                    {t('mind.game')}
                  </Text>
                  <Segmented
                    label={t('mind.game')}
                    value={rise.mind}
                    options={[
                      { value: 'sums', label: t('mind.sums') },
                      { value: 'stars', label: t('mind.stars') },
                    ]}
                    onChange={(mind) => change({ mind })}
                  />
                  {rise.mind === 'sums' && (
                    <Text role="callout" tone="muted" className="px-2">
                      {t('mind.level')}
                    </Text>
                  )}
                  {rise.mind === 'sums' && (
                    <Segmented
                      label={t('mind.level')}
                      value={String(rise.level) as '1' | '2' | '3'}
                      options={(['1', '2', '3'] as const).map((l) => ({
                        value: l,
                        label: t(`mind.levels.${l}`),
                      }))}
                      onChange={(l) => change({ level: Number(l) as 1 | 2 | 3 })}
                    />
                  )}
                </View>
              )}

              {rise.challenge === 'steps' && (
                <ListGroup>
                  <Stepper
                    label={t('steps.label')}
                    valueText={format.number(rise.steps)}
                    decreaseLabel={t('steps.fewer')}
                    increaseLabel={t('steps.more')}
                    canDecrease={rise.steps > RISE_RANGES.steps.min}
                    canIncrease={rise.steps < RISE_RANGES.steps.max}
                    onDecrease={() =>
                      change({ steps: Math.max(RISE_RANGES.steps.min, rise.steps - 10) })
                    }
                    onIncrease={() =>
                      change({ steps: Math.min(RISE_RANGES.steps.max, rise.steps + 10) })
                    }
                  />
                </ListGroup>
              )}

              {rise.challenge === 'spot' && (
                <Note
                  text={rise.spotCode ? t('spot.saved') : t('spot.missing')}
                  action={rise.spotCode ? t('spot.rescan') : t('spot.scan')}
                  onAction={() => setScanning(true)}
                />
              )}

              <Button variant="secondary" onPress={() => router.push('/rise?trying=1')}>
                {t('challenge.try')}
              </Button>
            </Section>

            <Section title={t('sound.label')}>
              <Segmented
                label={t('sound.label')}
                value={rise.sound}
                options={[
                  { value: 'alarm', label: t('sound.alarm') },
                  { value: 'soft', label: t('sound.soft') },
                ]}
                onChange={(sound) => change({ sound })}
              />
            </Section>

            <ListGroup>
              <ListRow
                title={t('stillUp.label')}
                subtitle={t('stillUp.note')}
                control={
                  <Toggle
                    checked={rise.stillUp}
                    onChange={(stillUp) => change({ stillUp })}
                    label={t('stillUp.label')}
                  />
                }
              />
              <ListRow
                title={t('snooze.label')}
                subtitle={t('snooze.note')}
                control={
                  <Toggle
                    checked={rise.snooze}
                    onChange={(snooze) => change({ snooze })}
                    label={t('snooze.label')}
                  />
                }
              />
            </ListGroup>

            {riseNative && permissions?.alarms !== 'unsupported' && (
              <Button
                variant="ghost"
                onPress={() => void testRise(10).then(() => toast(t('test.done')))}
              >
                {t('test.action')}
              </Button>
            )}

            <View className="gap-2 px-2">
              <Text role="caption" tone="muted">
                {t('privacy')}
              </Text>
              <Text role="caption" tone="muted">
                {t('mercy')}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <Sheet open={scanning} onClose={() => setScanning(false)} title={t('spot.scanTitle')}>
        <View className="h-96">
          {scanning && (
            <Scanner
              hint={t('spot.missing')}
              onCode={(spotCode) => {
                change({ spotCode });
                setScanning(false);
                toast(t('spot.saved'));
              }}
            />
          )}
        </View>
      </Sheet>
    </View>
  );
}
