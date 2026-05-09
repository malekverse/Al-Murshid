# Al-Murshid: "The Spiritual Compass" — CURRENT STATE

## Project Overview
An AI-driven, 1:1 cross-platform spiritual mentor application built with Expo React Native (SDK 54).
Target Platforms: iOS and Android.
Language: Multilingual with Arabic as the primary language.
Design Aesthetic: Dark emerald/amber theme with premium Islamic design.

---

## I. Architecture & Stack
| Component | Technology | Status |
|-----------|-----------|--------|
| Framework | Expo SDK 54 + React Native 0.81.5 | ✅ Complete |
| Language | TypeScript (strict) | ✅ Complete |
| Styling | NativeWind v4 (Tailwind CSS) | ✅ Complete |
| Navigation | @react-navigation (native-stack + material-top-tabs) | ✅ Complete |
| State | Zustand + persist (AsyncStorage) | ✅ Complete |
| Local Storage | SQLite via expo-sqlite (11 tables) | ✅ Complete |
| Cloud Storage | Supabase PostgreSQL with full-table sync | ✅ Complete |
| i18n | i18next + react-i18next (AR/EN, RTL support) | ✅ Complete |
| Location | expo-location | ✅ Complete |
| Notifications | expo-notifications | ✅ Complete |
| Auth | Supabase Auth (Email/Password, Google OAuth, Apple Sign-In) | ✅ Complete |
| Sync | Generic push/pull for 9 tables (reflections, prayer_logs, sleep_logs, conversation_messages, khatmah_progress, alarm_logs, check_ins, duel_results, user_profile) with checksum tamper detection | ✅ Complete |
| Security | Row Level Security (RLS) + data checksum integrity verification | ✅ Complete |

---

## II. Data Architecture (Offline-First)

```
┌─────────────────────────────────────────────────────┐
│                   Data Service Layer                 │
│      src/services/data/*.ts (7 services)             │
│      + smartReminderService.ts                       │
│      + behavioralAnalyticsService.ts                 │
│  ┌──────────┬──────────┬──────────┬──────────┐      │
│  │ Prayer   │ Dhikr    │ Sleep    │Reflection│      │
│  │ Service  │ Service  │ Service  │ Service  │      │
│  ├──────────┼──────────┼──────────┼──────────┤      │
│  │Conversa- │ Gamifica-│ Settings │          │      │
│  │tionSvc   │ tionSvc  │ Service  │          │      │
│  └──────────┴──────────┴──────────┴──────────┘      │
│       ↓ writes to both ↓                             │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │   SQLite (local)  │  │ Zustand (reactivity)        │
│  │  11 tables + CRUD │  │ + AsyncStorage persist      │
│  └──────────────────┘  └──────────────────┘          │
│       ↓ sync engine ↓                                 │
│  ┌──────────────────────────────────────┐            │
│  │  Supabase PostgreSQL (cloud)         │            │
│  │  Generic push/pull for 9 sync-eligible tables        │            │
│  │  Checksum tamper detection            │            │
│  └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### SQLite Tables
| Table | Purpose |
|-------|---------|
| `reflections` | Self-reflection journal entries (encrypted payload) |
| `prayer_logs` | Prayer tracking with timestamps |
| `sleep_logs` | Sleep hour tracking |
| `conversation_messages` | AI Coach chat history (last 50 messages) |
| `khatmah_progress` | Quran reading progress |
| `alarm_logs` | Fajr alarm check-ins |
| `check_ins` | Masjid check-in records |
| `user_settings` | Key-value setting persistence |
| `user_profile` | User profile data |
| `sync_metadata` | Sync tracking per table |
| `duel_results` | Knowledge Duel quiz scores |

### Level Computation (from Noor Points)
| Level | Milestone | Title |
|-------|-----------|-------|
| L1 | 0 pts | Al-Mubtadi (The Beginner) |
| L2 | 50 pts | Al-Talib (The Seeker) |
| L3 | 150 pts | Al-Mujtahid (The Striver) |
| L4 | 500 pts | Al-Muqarab (The Near One) |
| L5 | 1000 pts | Al-Sabiq (The Foremost) |

---

## III. Implemented Screens (29 screens)

| Screen | Lines | Features |
|--------|-------|----------|
| **HomeScreen** | 332 | Dashboard: prayer times, verse of hour, AI insight, streak, quick tools, location-based next prayer + smart reminders |
| **OnboardingScreen** | 172 | 4-step Mithaq (language, welcome, struggles, encouragement) |
| **QuranScreen** | 741 | 3 modes: list, surah detail (Arabic+translation), Mushaf page-by-page with audio & Hifz mode |
| **AzkarScreen** | 166 | Dua hub with categories, Tasbih shortcut, 99 Names |
| **AdhkarCategoryScreen** | 126 | Category view with tap-to-complete counter |
| **SmartAdhkarScreen** | 243 | Context-aware engine (time, GPS, weather) suggests relevant duas |
| **QiblaScreen** | 343 | Real-time compass with magnetometer, haptic alignment |
| **DigitalTasbihScreen** | 159 | Haptic dhikr counter with target cycling (33/100/1000) |
| **PrayerTimesScreen** | 218 | All 6 times with auto-detected calc method, reverse geocode |
| **HijriCalendarScreen** | 297 | Swipeable monthly calendar via Aladhan API, event detection |
| **ZakatCalculatorScreen** | 141 | Real-time calculator (cash, gold, silver, investments) |
| **AICoachScreen** | 272 | Real AI chat via OpenRouter API, conversation persisted to SQLite (50 msgs), reflection context |
| **MuhasabahScreen** | 269 | Self-reflection journal persisted to SQLite vault, history button, Weekly Muhasabah Digest |
| **ReflectionHistoryScreen** | 137 | Expandable card list of past reflections |
| **SettingsScreen** | 352 | Full settings: toggles persisted to SQLite, computed level, sync status, analytics nav, export data |
| **SquadsScreen** | 165 | Ummah dashboard with mock squad, duels, leaderboards |
| **FajrAlarmScreen** | 248 | Smart alarm with camera-based Wudu check (simulated), alarm_logs persistence |
| **SunnahSleepScreen** | 405 | Sleep logger with save button, HealthKit/Health Connect sync, Qailulah timer, Sunnah habits |
| **ProgressTrackerScreen** | 153 | Real stats from store, dynamic growth tree |
| **KnowledgeDuelScreen** | 273 | 60-second quiz game with seerah questions, Noor rewards, best score persistence |
| **LocatorScreen** | 343 | Map+list of mosques/halal via OpenStreetMap Overpass API |
| **NamesOfAllahScreen** | 134 | Flip cards for 99 Names with animated flip |
| **CommunityHeatmapScreen** | 142 | Visual heatmap of community Fajr activity (mock) |
| **ProofOfSalahScreen** | 186 | Camera-based masjid check-in with SQLite persistence |
| **KhatmahScreen** | 119 | Quran completion planner with goal preset switcher (30/60/90 days), progress ring, SQLite persistence |
| **AnalyticsScreen** | 279 | Combined prayer analytics, sleep analytics, level progress bar, milestone %, behavioral profile, iman score, reflection trend |
| **LoginScreen** | 165 | Email/password login, Google OAuth, Apple Sign-In, error handling (screens/auth/) |
| **RegisterScreen** | 134 | Email/password registration with display name, confirm password (screens/auth/) |
| **ProfileScreen** | 149 | User profile card, computed level from noorPoints, sync controls (screens/auth/) |

---

## IV. Services & Utilities

| File | Lines | Purpose |
|------|-------|---------|
| `services/supabase/client.ts` | 22 | Supabase client singleton with AsyncStorage wrapper adapter |
| `services/supabase/config.ts` | 5 | Supabase URL/key config from env vars, redirect URL helper |
| `services/supabase/auth.ts` | 140 | Full auth: email/password, Google OAuth, Apple Sign-In, local fallback |
| `services/supabase/schema.sql` | 56 | Supabase PostgreSQL schema with RLS policies + auto-profile trigger |
| `services/data/prayerService.ts` | 10 | Routes logPrayer to SQLite + Zustand |
| `services/data/gamificationService.ts` | 30 | Level computation from noorPoints, milestone progress |
| `services/data/reflectionService.ts` | 20 | Save reflection to SQLite + award noorPoints |
| `services/data/conversationService.ts` | 15 | Persist/load/trim AI chat history |
| `services/data/dhikrService.ts` | 7 | Record dhikr with noorPoints |
| `services/data/sleepService.ts` | 13 | Log sleep hours to SQLite + award noorPoints |
| `services/data/settingsService.ts` | 15 | Key-value settings persistence |
| `services/data/exportService.ts` | 40 | One-button export of all 11 SQLite tables as JSON |
| `services/aiCoachService.ts` | 102 | Real AI coach via OpenRouter API, system prompts (AR/EN), conversation memory, reflections context |
| `services/quranService.ts` | 145 | Al-Quran Cloud API: surah list, detail, Mushaf pages, audio |
| `services/notificationService.ts` | 68 | Prayer time notification scheduling (daily triggers) |
| `services/smartReminderService.ts` | 137 | Smart prayer reminders: detect missed prayer patterns, schedule targeted nudges |
| `services/behavioralAnalyticsService.ts` | 138 | Behavioral analytics: weekly trends, profile, consistency scoring |
| `services/supabase/sync.ts` | 146 | Generic push/pull for 9 tables (reflections, prayer_logs, sleep_logs, conversation_messages, khatmah_progress, alarm_logs, check_ins, duel_results, user_profile) with checksum tamper detection |
| `config.ts` | 8 | OpenRouter config: base URL, model, timeout |
| `navigation/RootNavigator.tsx` | 165 | Root stack navigator with 5 bottom tabs + 20+ modal screens |
| `components/ErrorBoundary.tsx` | 47 | React error boundary wrapper with styled fallback UI |
| `store/index.ts` | 92 | Zustand store: onboarding, streak, noorPoints, prayerLog, dhikr count, user, sync state |
| `store/db.ts` | 4 | Standalone getDb() to avoid circular imports |
| `store/database.ts` | 125 | SQLite init with all 11 tables + clears, re-exports 9 CRUD modules |
| `store/crud/` (9 files) | ~170 | Individual CRUD modules per table (incl. duelResults.ts) |
| `types/index.ts` | 87 | All data model interfaces (PrayerLog, Reflection, SleepLog, etc.), level milestones, getLevel() |
| `hooks/useFatherlyCoach.ts` | 19 | Streak-based AI insight generator |
| `utils/prayerTimes.ts` | 108 | Adhan library: 10 calc methods, country auto-detection |
| `utils/rtl.ts` | 34 | RTL utilities: icon flipping, flex direction |
| `i18n/index.ts` | 59 | i18next setup with AR primary, RTL management |
| `i18n/locales/en/common.json` | 388 | English translation strings |
| `i18n/locales/ar/common.json` | 388 | Arabic translation strings |
| `data/azkar.json` | 909 | 8 categories, 124 authentic adhkar entries |
| `data/asmaulhusna.json` | 1 line | All 99 Names with transliteration and meanings |

---

## V. [ORPHANS & PENDING]

| Feature | Priority | Notes |
|---------|----------|-------|
| Word-by-Word Quran Analysis | Low | Requires Arabic morphology library |
| Tafsir Integration | Low | API available at quran.com API |
| Content Streaming (Islamic shows/docs) | Low | No backend/CDN for video content |
| Fajr Chain / Squad Wake-Up Calls | Low | Requires push notification coordination |
| Zakat Donation Payment Integration | Low | Requires payment gateway (Stripe/Apple Pay) |
| Apple Watch / WearOS Companion | Very Low | Native platform extension |
| Sadaqah Jariyah Referral System | Very Low | Requires backend + invite tracking |

---

## VI. Enhancement Roadmap

### ✅ Completed (Phase 1-6)

| # | Feature | Status |
|---|---------|--------|
| 1 | Offline-first data service layer (SQLite + Zustand) | ✅ Done |
| 2 | Generic sync engine (push/pull for all sync-eligible tables) | ✅ Done |
| 3 | Reflection history modal (expandable cards) | ✅ Done |
| 4 | Level computed from noorPoints via milestones | ✅ Done |
| 5 | Settings toggles persisted to SQLite | ✅ Done |
| 6 | AI Coach conversation history persisted (50 msgs) | ✅ Done |
| 7 | Streak decay on missed days | ✅ Done |
| 8 | Prayer logging routed through data service | ✅ Done |
| 9 | Sleep logging with noorPoints rewards | ✅ Done |
| 10 | Dhikr recording with noorPoints | ✅ Done |

### ✅ All Completed (Phase 7-8)

| # | Feature | Status |
|----|---------|--------|
| 11 | Fajr Alarm persistence | ✅ Done |
| 12 | Knowledge Duel results | ✅ Done |
| 13 | Reflection AI Guidance | ✅ Done |
| 14 | Export user data | ✅ Done |
| 15 | Prayer Analytics Dashboard | ✅ Done |
| 16 | Sleep Analytics | ✅ Done |
| 17 | Combined Progress Screen | ✅ Done |
| 18 | Khatmah Goal Setting | ✅ Done |
| 19 | Weekly Muhasabah Digest | ✅ Done |
| 20 | Smart Prayer Reminders | ✅ Done |

---

## VII. System Flow (User Journey)

```
App Start
  └─ initDatabase() + initLanguageFromStorage() + checkStreakDecay()
  └─ initSupabaseSession() → restore or clear user state
  └─ OnboardingScreen (if !hasCompletedOnboarding)
  │    └─ Language Select → Welcome → Mithaq → Encouragement
  │    └─ completeOnboarding() → persist to AsyncStorage
  └─ Auth Flow (if !user after onboarding)
  │    └─ LoginScreen → Email/Password or Google or Apple
  │    └─ RegisterScreen → Email/Password with display name
  │    └─ Successful auth → setUser() → navigate to MainTabs
  └─ MainTabs (if hasCompletedOnboarding && user)
       ├─ HomeTab → Dashboard, Prayer, Tools, AI Insight
       ├─ QuranTab → List + Detail + Mushaf + Audio
       ├─ AzkarTab → Dua hub, Tasbih, 99 Names
       ├─ QiblaTab → Real-time compass
       └─ SquadsTab → Ummah features, duels, leaderboards
  └─ Modal Screens (accessible from anywhere)
       ├─ Profile → Stats, computed level, sync controls, sign out
       ├─ Settings → Full settings + account management
       ├─ Muhasabah → Self-reflection journal
       ├─ ReflectionHistory → Past reflections (expandable cards)
       └─ ... (16+ additional modal screens)
  └─ Background Sync (every 5 min)
       └─ Generic push/pull for 9 sync-eligible tables
       └─ Tamper Detection → checksum verification per table
```

---

## VIII. Key Design Decisions

1. **Offline-first:** SQLite is primary store, Zustand for reactivity, Supabase for cloud sync
2. **Data service layer** (`src/services/data/`): All writes go through services → SQLite first → then Zustand
3. **Level is computed** from Noor points via milestone thresholds (never stored)
4. **Streak decay:** Miss a day → streak decreases by 1 (min 0), checked on app mount
5. **AI Coach history:** Last 50 messages persisted to SQLite, restored on conversation start
6. **Settings persistence:** Notification/haptic/dark mode toggles saved to `user_settings` table
7. **RTL is fully supported** — Arabic sets `I18nManager.forceRTL(true)`, icons flip via `flipIcon()` utility
8. **Privacy-first:** All reflection data stored locally in SQLite as primary store
9. **Hacker Detection:** Every synced record has a checksum; server re-verifies on pull
10. **Circular import protection:** `getDb()` extracted to `store/db.ts` to avoid circular deps
11. **Smart Prayer Reminders** use `daily` trigger at prayer_time - 15 min; re-evaluated once per day; only fires for prayers missed >30% of week
12. **Behavioral Analytics** is purely local aggregation (no ML); computes consistency scores, weekly trends, and sleep/prayer correlations from SQLite
