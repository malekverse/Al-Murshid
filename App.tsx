import 'react-native-url-polyfill/auto';
import "./global.css";
import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import './src/i18n';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { initLanguageFromStorage } from './src/i18n';
import i18n from './src/i18n';
import { initDatabase } from './src/store/database';
import { useAppStore } from './src/store';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { loadPersistedSettings } from './src/services/data/settingsService';
import { scheduleAllReminders, cancelAllReminders } from './src/services/reminderScheduler';

cssInterop(LinearGradient, {
  className: 'style',
});

export default function App() {
  const [langKey, setLangKey] = useState(i18n.language);
  const setUser = useAppStore((s) => s.setUser);
  const setOnlineStatus = useAppStore((s) => s.setOnlineStatus);
  const user = useAppStore((s) => s.user);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  useEffect(() => {
    initLanguageFromStorage();
    initDatabase().catch(console.error);

    checkStreakDecay();

    loadPersistedSettings().then((settings) => {
      if (settings.darkMode !== undefined) {
        setDarkMode(settings.darkMode === 'true');
      }
      const prefs = {
        prayerAlerts: settings.prayerAlerts === 'true',
        smartReminders: settings.smartReminders === 'true',
        muhasabahReminder: settings.muhasabahReminder === 'true',
        quranReminder: settings.quranReminder === 'true',
      };
      if (prefs.prayerAlerts || prefs.smartReminders || prefs.muhasabahReminder || prefs.quranReminder) {
        scheduleAllReminders(prefs);
      } else {
        cancelAllReminders();
      }
    }).catch(() => {});

    const onLanguageChanged = (lng: string) => {
      setLangKey(lng);
    };
    i18n.on('languageChanged', onLanguageChanged);

    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const checkStreakDecay = async () => {
    try {
      const { getDb } = require('./src/store/db');
      const db = getDb();
      const rows: any[] = await db.getAllAsync('SELECT date FROM prayer_logs ORDER BY timestamp DESC LIMIT 1');
      if (rows.length === 0) return;
      const lastDate = new Date(rows[0].date as string);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        const currentStreak = useAppStore.getState().sunnahStreak;
        const newStreak = Math.max(0, currentStreak - diffDays);
        useAppStore.setState({ sunnahStreak: newStreak });
      }
    } catch {}
  };

  useEffect(() => {
    let supabase: any = null;
    try {
      const { getSupabase } = require('./src/services/supabase/client');
      supabase = getSupabase();
    } catch {}
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          displayName: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'User',
          photoUrl: session.user.user_metadata?.avatar_url ?? undefined,
          authProvider: session.user.app_metadata?.provider ?? 'email',
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      const wasUserInitiated = useAppStore.getState().isUserInitiatedSignOut;
      if (_event === 'SIGNED_OUT') {
        if (!wasUserInitiated && useAppStore.getState().user) {
          Alert.alert('Session Expired', 'Your session has expired. Please sign in again.');
        }
        useAppStore.getState().setUserInitiatedSignOut(false);
        setUser(null);
      } else if (session?.user && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          displayName: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'User',
          photoUrl: session.user.user_metadata?.avatar_url ?? undefined,
          authProvider: session.user.app_metadata?.provider ?? 'email',
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkOnline = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        setOnlineStatus(true);
      } catch {
        setOnlineStatus(false);
      }
    };
    checkOnline();
    const interval = setInterval(checkOnline, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    let syncTimer: ReturnType<typeof setInterval> | null = null;

    const doSync = async () => {
      try {
        const { fullSync } = require('./src/services/supabase/sync');
        const result = await fullSync(user.id);
        useAppStore.getState().setSyncInfo(new Date().toISOString(), result.tamperDetected);
      } catch {}
    };

    doSync();
    syncTimer = setInterval(doSync, 5 * 60 * 1000);
    return () => { if (syncTimer) clearInterval(syncTimer); };
  }, [user]);

function AppContent({ langKey }: { langKey: string }) {
  const colors = useTheme().colors;
  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <NavigationContainer key={langKey}>
        <RootNavigator />
      </NavigationContainer>
      <OfflineBanner />
    </View>
  );
}

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent langKey={langKey} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
