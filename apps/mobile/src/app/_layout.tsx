// Must run before anything formats a number or a plural.
import '@/lib/intl-polyfills';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
} from '@expo-google-fonts/readex-pro';
import { fonts } from '@murshid/tokens';
import { useFonts } from 'expo-font';
import { LocaleProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';
import { SheetHost } from '@/components/ui/sheet';
import { ToastProvider } from '@/components/ui/toast';
import { AppLocaleProvider, useAppLocale } from '@/lib/locale';
import { restoreTheme } from '@/lib/theme';
import '../global.css';

SplashScreen.preventAutoHideAsync();
restoreTheme();

function Root() {
  const { direction } = useAppLocale();
  const { theme } = useUniwind();

  return (
    // Content direction switches at runtime from the root; navigation follows LocaleProvider.
    <View style={{ flex: 1, direction }} className="bg-canvas">
      <LocaleProvider direction={direction}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ToastProvider>
          <SheetHost>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </SheetHost>
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
