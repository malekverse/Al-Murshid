# Production Readiness Plan — Al-Murshid

## Priority Levels: P0=Critical (blocks launch) P1=High (bad UX) P2=Medium (polish) P3=Low (nice-to-have)

---

## P0 — Critical: Error Handling & Reliability

### P0.1 Inconsistent/double navigation
- [ ] `src/navigation/RootNavigator.tsx:130-136`: Auth screens (Login/Register) shown when `!user`, but after login the user is set AND navigation must catch up. If `user` becomes null mid-session, user gets kicked to login without warning. Add confirmation dialog.
- [ ] `src/navigation/RootNavigator.tsx`: No error boundary wrapping individual screens. The root ErrorBoundary wraps everything but can't recover per-screen.

### P0.2 Auth: local fallback bypasses real auth
- [ ] `src/services/supabase/auth.ts:152-155`: `localAuthResponse()` creates a fake user when Supabase is unconfigured. This means the app creates a full "authenticated" session with a local-only user. The user can lose all data if they later sign in with real credentials. **Fix**: Show a warning banner that Supabase is not configured, and require real credentials.

### P0.3 API keys exposed in source
- [ ] `.env` file is gitignored but `EXPO_PUBLIC_*` variables are still accessible in client-side JS bundles. Anyone who decompiles the app can read `EXPO_PUBLIC_OPENROUTER_API_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. **Fix**: Use a backend proxy for OpenRouter calls. For Supabase, the anon key is designed to be public (RLS protects the data). The OpenRouter key is the real risk.

### P0.4 Screen crash resilience
- [ ] Every screen with `useEffect` data fetching: must handle the case where `getDb()` throws (database not initialized).
- [ ] Every screen with API calls: must handle network timeouts (not just errors). Add timeout wrapper.
- [ ] `src/screens/QuranScreen.tsx:741 lines` — Very large screen. If any section throws, the entire Quran tab crashes.

---

## P0 — Critical: Missing Loading & Empty States

### P0.5 Screens with no loading state (data appears suddenly, jarring)
- [ ] `AICoachScreen` — No loading spinner while fetching conversation history
- [ ] `AnalyticsScreen` — No loading state while DB queries run
- [ ] `PrayerTimesScreen` — No loading while locating
- [ ] `HijriCalendarScreen` — No loading while API fetches
- [ ] `ReflectionHistoryScreen` — No loading while fetching reflections
- [ ] `KnowledgeDuelScreen` — No loading while best score loads
- [ ] `SunnahSleepScreen` — No loading while sleep data loads
- [ ] `LocatorScreen` — No loading while Overpass API fetches

### P0.6 Screens with no empty state (blank screen when no data)
- [ ] `ReflectionHistoryScreen` — Empty state when no reflections exist
- [ ] `MuhasabahScreen` — Should show "Start your first reflection" when empty
- [ ] `PrayerTimesScreen` — Should handle city not found gracefully
- [ ] `KhatmahScreen` — Should guide user when no goal is active
- [ ] `AnalyticsScreen` — Should handle "no prayer data yet" + "no sleep data yet" with guidance
- [ ] `CommunityHeatmapScreen` — Should handle no alarm_logs gracefully

---

## P1 — High: UX & Functional Gaps

### P1.1 Navigation issues
- [ ] `LocatorScreen`: After closing, map state is lost. Should preserve search results.
- [ ] `FajrAlarmScreen`: Going back doesn't stop the camera. Must release camera on unmount.
- [ ] `QuranScreen:797 lines`: Font size changes don't persist. Should save to user_settings.
- [ ] All modals: Should use `headerShown: false` consistently (mix of styles).

### P1.2 Data integrity
- [ ] `prayer_logs`: No uniqueness constraint on (prayerName, date). Can log the same prayer twice for the same day.
- [ ] `sleep_logs`: No uniqueness constraint on date. Can log multiple sleep entries for the same day.
- [ ] `check_ins`: No uniqueness constraint on (date, prayerName). Can check in multiple times for same prayer.

### P1.3 i18n gaps
- [ ] Hardcoded English strings found (search for un-wrapped strings):
  - `AnalyticsScreen.tsx` — "Analytics", "Level Progress", "Prayer Analytics", "This Week", "Sleep Analytics", "Streak", "Noor", "Level"
  - `AICoachScreen.tsx` — "Clear conversation", "Type a message..."
  - `SettingsScreen.tsx` — "Data & Export", "Export All Data as JSON"
  - `CommunityHeatmapScreen.tsx` — "Fajr alarms logged (30 days)", "Completed", "Dismissed", "You", "Refresh Data", "Preview"
  - `SquadsScreen.tsx` — "Preview", "Demo Leaderboard — Currently showing sample data"
  - `KnowledgeDuelScreen.tsx` — "Question X of Y", "Time's up!", "Game Over"
  - `FajrAlarmScreen.tsx` — "Wudu verification simulated"
  - `KhatmahScreen.tsx` — "30 Days", "60 Days", "90 Days"

### P1.4 Keyboard handling
- [ ] `AICoachScreen.tsx` — KeyboardAvoidingView may not work on Android. Input can be hidden by keyboard.
- [ ] `MuhasabahScreen.tsx` — Same issue.
- [ ] All TextInput screens — No keyboard dismiss on tap outside.

### P1.5 Offline state feedback
- [ ] `HomeScreen.tsx`: Has `isOnline` in store but never displays it. User doesn't know when offline.
- [ ] `SettingsScreen.tsx`: Sync status shown but doesn't auto-update. User has to manually refresh.
- [ ] No global offline banner when network drops.

---

## P1 — High: Performance

### P1.6 Unnecessary re-renders
- [ ] `AnalyticsScreen.tsx`: Uses `useState` for all data. No `useMemo` for computed values (level, title, milestone).
- [ ] `HomeScreen.tsx`: Multiple `useEffect` calls that could be combined. Animated values recreated on every render.
- [ ] All screens using `useAppStore((state) => state.xxx)` without selectors — re-render on ANY store change.

### P1.7 Large lists without virtualization
- [ ] `ReflectionHistoryScreen.tsx` — Uses `.map()` with no FlatList. Would freeze with 100+ reflections.
- [ ] `QuranScreen.tsx` — Surah list uses ScrollView with .map(), only 114 items so acceptable but not ideal.
- [ ] `AICoachScreen.tsx` — Message list uses ScrollView with .map(). After 50 messages this will be slow.

---

## P2 — Medium: Polish & Consistency

### P2.1 Visual consistency
- [ ] All screens: StatusBar style should be consistent (currently some use "light", some omit).
- [ ] All screens: Top padding for safe area should use `useSafeAreaInsets()` or a consistent value.
- [ ] Screen titles: Some use `navigation.goBack()` + custom header, some use stack navigator headers.

### P2.2 Form validation
- [ ] `RegisterScreen.tsx`: No minimum password length validation.
- [ ] `RegisterScreen.tsx`: No email format validation (native keyboard handles format but no server-side check).
- [ ] `LoginScreen.tsx`: No "forgot password" flow.
- [ ] `MuhasabahScreen.tsx`: Empty reflection can be submitted.

### P2.3 Haptic consistency
- [ ] `DigitalTasbihScreen.tsx`: Haptic on every count — drains battery. Should debounce.
- [ ] `KnowledgeDuelScreen.tsx`: Haptic on wrong answer + haptic on game over + haptic on correct — can overlap.

### P2.4 Background sync reliability
- [ ] `sync.ts`: No retry logic for failed sync. If one push fails, subsequent tables are skipped.
- [ ] `sync.ts`: No timeout — sync could hang indefinitely on slow network.

---

## P2 — Medium: Accessibility

### P2.5 Screen reader support
- [ ] All icons with `Ionicons` need `accessibilityLabel` prop.
- [ ] All `TouchableOpacity` with only icons need `accessibilityLabel`.
- [ ] QuranScreen audio button has no label.
- [ ] QiblaScreen compass heading has no label.

### P2.6 Color contrast
- [ ] AnalyticsScreen bar chart labels: `text-emerald-300` on `bg-emerald-900/60` — may fail WCAG AA.
- [ ] CommunityHeatmapScreen grid lines: `opacity-20` on `bg-emerald-950` — nearly invisible.

---

## P3 — Low: Nice-to-Have

### P3.1 Testing
- [ ] No unit tests for any service.
- [ ] No component tests for any screen.
- [ ] No integration tests for sync engine.

### P3.2 CI/CD
- [ ] No GitHub Actions workflow.
- [ ] No EAS Build configuration for production.
- [ ] No automated version bumping.

### P3.3 App store assets
- [ ] No app icon (default Expo icon).
- [ ] No splash screen customization.
- [ ] No App Store / Play Store screenshots.

### P3.4 Analytics / Monitoring
- [ ] No crash reporting (Sentry or similar).
- [ ] No usage analytics.
- [ ] No performance monitoring.

---

## Execution Order

1. **P0.2** — Fix local auth bypass (security)
2. **P0.5+P0.6** — Add loading + empty states to ALL screens (UX)
3. **P1.3** — Fix i18n hardcoded strings (completeness)
4. **P1.1** — Fix critical navigation issues (camera release, back handling)
5. **P1.2** — Add uniqueness constraints to DB tables (data integrity)
6. **P0.1** — Fix navigation reliability (auth guard)
7. **P1.4** — Fix keyboard handling
8. **P1.5** — Add offline state feedback
9. **P1.6+P1.7** — Performance fixes (memoization, FlatList)
10. **P2.1-P2.3** — Polish pass (consistency, validation, haptics)
11. **P2.4** — Sync reliability
12. **P2.5-P2.6** — Accessibility pass
13. **P3** — Optional enhancements
