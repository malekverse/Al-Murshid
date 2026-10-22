import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { updateIosWidgets } from './ios-widgets';
import { storedLocale } from './locale';
import { readSettings } from './settings';
import { widgetData } from './widget-data';

// The home-screen widgets (SPEC 5.9) read what the app writes here: on Android through the app's
// own module (modules/prayer-widget), on iOS through Expo's widgets. Written at launch, when the
// app returns, when settings or the language change, and by the twice-daily background task, so
// the coming week is always there, offline.

const android =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<{ setData(json: string | null): Promise<void> }>('PrayerWidget')
    : null;

export async function syncWidgets(now = new Date()) {
  const data = widgetData(readSettings(), storedLocale(), now);
  if (android) await android.setData(data ? JSON.stringify(data) : null);
  if (Platform.OS === 'ios') updateIosWidgets(data, now);
}

/** After "Delete everything": the widgets ask to open the app again. */
export async function clearWidgets() {
  if (android) await android.setData(null);
  if (Platform.OS === 'ios') updateIosWidgets(null, new Date());
}
