import { addDays, civilDate, isoDate } from '@murshid/core';
import { placeOf } from '@murshid/data';
import { space } from '@murshid/tokens';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PRAYER_CATEGORY } from '@/lib/reminders';
import { readSettings } from '@/lib/settings';

/**
 * Developer screen: rings a test reminder in a few seconds, with the real "I prayed" action, so
 * the notification path can be checked without waiting for a prayer time.
 */
export default function DevReminders() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<number | null>(null);

  const test = async () => {
    const place = placeOf(readSettings());
    const today = place
      ? civilDate(new Date(), place.timeZone)
      : addDays({ year: 2026, month: 10, day: 18 }, 0);
    await Notifications.scheduleNotificationAsync({
      identifier: `${isoDate(today)}-fajr-time-test`,
      content: {
        title: 'Fajr (test)',
        body: 'A test reminder with the "I prayed" action.',
        categoryIdentifier: PRAYER_CATEGORY,
        data: { date: isoDate(today), prayer: 'fajr', kind: 'time', openInDark: false },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: 'soft-1',
      },
    });
    setStatus('Scheduled in 5 seconds.');
  };

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + space[6],
        paddingHorizontal: space[4],
        gap: space[6],
      }}
    >
      <Text role="title1" script="latin">
        Reminders (dev)
      </Text>
      <View className="gap-3">
        <Button onPress={() => void test()}>Ring a test reminder</Button>
        <Button
          variant="secondary"
          onPress={() =>
            void Notifications.getAllScheduledNotificationsAsync().then((n) => setPending(n.length))
          }
        >
          Count pending reminders
        </Button>
        <Button
          variant="ghost"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          Back
        </Button>
      </View>
      <Text role="body" script="latin">
        {status}
        {pending !== null ? ` Pending: ${pending}.` : ''}
      </Text>
    </ScrollView>
  );
}
