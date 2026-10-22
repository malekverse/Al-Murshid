// Must run before anything formats a number or a plural.
import '@/lib/intl-polyfills';
// Background tasks must exist before the OS can wake the app for them (SPEC 5.2).
import { RecitationProvider } from '@/components/quran/recitation';
import { registerBackgroundTasks } from '@/lib/background';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
} from '@expo-google-fonts/readex-pro';
import { fonts } from '@murshid/tokens';
import { useFonts } from 'expo-font';
import { LocaleProvider, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Uniwind, useUniwind } from 'uniwind';
import { SheetHost } from '@/components/ui/sheet';
import { ToastProvider } from '@/components/ui/toast';
import { AppLocaleProvider, useAppLocale } from '@/lib/locale';
import {
  checkIgnoredReminders,
  handleReminderResponse,
  rescheduleReminders,
  wasOpened,
} from '@/lib/reminders';
import { resumeDownloads } from '@/lib/quran-files';
import { useSettings } from '@/lib/settings';
import { restoreTheme } from '@/lib/theme';
import { syncWidgets } from '@/lib/widgets';
import '../global.css';

SplashScreen.preventAutoHideAsync();
restoreTheme();

// Reminders that arrive while the app is open still show, quietly styled by their channel.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function respond(response: Notifications.NotificationResponse) {
  const result = handleReminderResponse(response);
  // Fajr and Isha open into the night theme (SPEC 6.1), for this visit only.
  if (result?.openInDark && response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    Uniwind.setTheme('dark');
  }
}

/**
 * Keeps about six days of reminders scheduled (SPEC 5.2): on every return to the app and
 * whenever a setting that moves them changes. Also answers taps on reminders.
 */
function ReminderSync() {
  const s = useSettings();
  const key = JSON.stringify([
    s.onboarded,
    s.location,
    s.method,
    s.asr,
    s.highLatitude,
    s.adjustments,
    s.reminders,
    s.remindersReduced,
    s.journey.prayer.focusPrayer,
  ]);

  useEffect(() => {
    void registerBackgroundTasks();
    const onActive = () => checkIgnoredReminders();
    onActive();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        onActive();
        void rescheduleReminders();
      }
    });
    const sub = Notifications.addNotificationResponseReceivedListener(respond);
    // A reminder that launched the app (iOS, or Android before the background task ran).
    const last = Notifications.getLastNotificationResponse();
    if (last && !wasOpened(last.notification.request.identifier)) respond(last);
    return () => {
      appState.remove();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void rescheduleReminders(), 500);
    return () => clearTimeout(id);
  }, [key]);

  return null;
}

/**
 * Writes the coming week for the home-screen widgets (SPEC 5.9): on every return to the app, and
 * whenever the language or a setting that moves the prayer times changes.
 */
function WidgetSync() {
  const s = useSettings();
  const { locale } = useAppLocale();
  const key = JSON.stringify([
    locale,
    s.onboarded,
    s.location,
    s.method,
    s.asr,
    s.highLatitude,
    s.adjustments,
    s.hijriOffset,
    s.ramadanMode,
  ]);

  useEffect(() => {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncWidgets();
    });
    return () => appState.remove();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void syncWidgets(), 800);
    return () => clearTimeout(id);
  }, [key]);

  return null;
}

function Root() {
  const { direction } = useAppLocale();
  const { theme } = useUniwind();
  // A whole reciter's download stopped by closing the app carries on.
  useEffect(() => resumeDownloads(), []);

  return (
    // Content direction switches at runtime from the root; navigation follows LocaleProvider.
    <View style={{ flex: 1, direction }} className="bg-canvas">
      <LocaleProvider direction={direction}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ReminderSync />
        <WidgetSync />
        <ToastProvider>
          {/* One recitation for the whole app, so listening carries on across screens. */}
          <RecitationProvider>
            <SheetHost>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
            </SheetHost>
          </RecitationProvider>
        </ToastProvider>
      </LocaleProvider>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.native.ui[400]]: ReadexPro_400Regular,
    [fonts.native.ui[500]]: ReadexPro_500Medium,
    [fonts.native.ui[600]]: ReadexPro_600SemiBold,
    [fonts.native.sacred]: Amiri_400Regular,
    // King Fahd Complex Uthmanic Hafs (QPC Hafs V22, via QUL), bundled unmodified as its license requires.
    [fonts.native.quran]: require('../../assets/fonts/UthmanicHafs_V22.ttf'),
  });
  // A font that fails to load must never leave the app on a blank screen: fall back to the
  // system font and carry on.
  const ready = loaded || error !== null;

  useEffect(() => {
    if (error) console.warn('Fonts failed to load, using system fonts', error);
    if (ready) SplashScreen.hideAsync();
  }, [ready, error]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppLocaleProvider>
          <Root />
        </AppLocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
