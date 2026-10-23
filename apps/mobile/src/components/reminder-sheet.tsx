import { BEFORE_RANGE, type Prayer, type ReminderStyle } from '@murshid/core';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { ChoiceList } from './choice-list';
import { RiseRow } from './rise/rise-row';
import { ListGroup } from './ui/list-row';
import { Button } from './ui/button';
import { Sheet } from './ui/sheet';
import { Text } from './ui/text';
import { usePrayerName } from '@/lib/format';
import { rescheduleReminders } from '@/lib/reminders';
import { updateSettings, useSettings } from '@/lib/settings';

const styles: ReminderStyle[] = ['adhan', 'soft', 'silent', 'off'];
const befores = ['none', '5', '10', '15', '20', '30'] as const;

/** Whether reminders can ring, and on time (Android 14 asks for exact alarms separately). */
export function useReminderPermissions() {
  const [state, setState] = useState<{ granted: boolean; canAsk: boolean; exact: boolean } | null>(
    null,
  );
  const refresh = () =>
    void Promise.all([
      Notifications.getPermissionsAsync(),
      Platform.OS === 'android'
        ? Notifications.getExactAlarmPermissionsAsync().then((p) => p.granted)
        : Promise.resolve(true),
    ]).then(([perm, exact]) =>
      setState({ granted: perm.granted, canAsk: perm.canAskAgain, exact }),
    );
  useEffect(refresh, []);
  return [state, refresh] as const;
}

/** Turn reminders on, or send the person to the phone's settings when asking is no longer possible. */
export async function askForReminders(canAsk: boolean): Promise<boolean> {
  if (!canAsk) {
    await Linking.openSettings();
    return false;
  }
  const result = await Notifications.requestPermissionsAsync();
  if (result.granted) await rescheduleReminders();
  return result.granted;
}

export function PermissionNotes() {
  const t = useTranslations('settings.reminders');
  const [perm, refresh] = useReminderPermissions();
  if (!perm) return null;
  return (
    <View className="gap-3">
      {!perm.granted && (
        <View className="gap-3 rounded-card bg-lantern/10 p-4">
          <Text role="callout">{t('permission')}</Text>
          <Button
            variant="secondary"
            onPress={() => void askForReminders(perm.canAsk).then(refresh)}
          >
            {perm.canAsk ? t('enable') : t('openSettings')}
          </Button>
        </View>
      )}
      {perm.granted && !perm.exact && (
        <View className="gap-3 rounded-card bg-lantern/10 p-4">
          <Text role="callout">{t('exact')}</Text>
          <Button
            variant="secondary"
            onPress={() =>
              void Notifications.requestExactAlarmPermissionsAsync()
                .then(() => rescheduleReminders())
                .then(refresh)
            }
          >
            {t('exactAction')}
          </Button>
        </View>
      )}
    </View>
  );
}

/** One prayer's reminder: its sound and an optional heads-up (SPEC 5.2). */
export function ReminderSheet({ prayer, onClose }: { prayer: Prayer | null; onClose: () => void }) {
  const t = useTranslations('settings.reminders');
  const settings = useSettings();
  const prayerName = usePrayerName();
  const reminder = prayer ? settings.reminders[prayer] : null;

  const change = (next: Partial<{ style: ReminderStyle; before: number | null }>) => {
    if (!prayer) return;
    updateSettings((s) => ({
      ...s,
      reminders: { ...s.reminders, [prayer]: { ...s.reminders[prayer], ...next } },
    }));
  };

  return (
    <Sheet
      open={prayer !== null}
      onClose={onClose}
      title={prayer ? t('title', { name: prayerName(prayer) }) : ''}
    >
      {reminder && (
        <View className="gap-6">
          <PermissionNotes />
          <ChoiceList
            label={t('title', { name: prayerName(prayer!) })}
            value={reminder.style}
            onChange={(style) => change({ style })}
            choices={styles.map((s) => ({ value: s, label: t(`styles.${s}`) }))}
          />
          {reminder.style !== 'off' && (
            <View className="gap-2">
              <Text role="callout" tone="muted" className="px-2">
                {t('before')}
              </Text>
              <ChoiceList
                label={t('before')}
                value={
                  reminder.before === null
                    ? 'none'
                    : (String(reminder.before) as (typeof befores)[number])
                }
                onChange={(v) =>
                  change({
                    before:
                      v === 'none'
                        ? null
                        : Math.min(BEFORE_RANGE.max, Math.max(BEFORE_RANGE.min, Number(v))),
                  })
                }
                choices={befores.map((v) => ({
                  value: v,
                  label: v === 'none' ? t('noBefore') : t('beforeValue', { count: Number(v) }),
                }))}
              />
            </View>
          )}
          {prayer === 'fajr' && (
            <ListGroup>
              <RiseRow onOpen={onClose} />
            </ListGroup>
          )}
        </View>
      )}
    </Sheet>
  );
}
