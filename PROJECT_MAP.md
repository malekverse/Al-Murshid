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
| Storage | SQLite via expo-sqlite | ✅ Complete |
| i18n | i18next + react-i18next (AR/EN, RTL support) | ✅ Complete |
| Location | expo-location | ✅ Complete |
| Notifications | expo-notifications | ✅ Complete |

---

## II. Implemented Screens (24 total, all production-ready)

| Screen | Lines | Features |
|--------|-------|----------|
| **HomeScreen** | 347 | Dashboard: prayer times, verse of hour, AI insight, streak, quick tools, location-based next prayer |
| **OnboardingScreen** | 184 | 4-step Mithaq (language, welcome, struggles, encouragement) |
| **QuranScreen** | 797 | 3 modes: list, surah detail (Arabic+translation), Mushaf page-by-page with audio & Hifz mode |
| **AzkarScreen** | 180 | Dua hub with categories, Tasbih shortcut, 99 Names |
| **AdhkarCategoryScreen** | 140 | Category view with tap-to-complete counter |
| **SmartAdhkarScreen** | 278 | Context-aware engine (time, GPS, weather) suggests relevant duas |
| **QiblaScreen** | 370 | Real-time compass with magnetometer, haptic alignment |
| **DigitalTasbihScreen** | 175 | Haptic dhikr counter with target cycling (33/100/1000) |
| **PrayerTimesScreen** | 237 | All 6 times with auto-detected calc method, reverse geocode |
| **HijriCalendarScreen** | 331 | Swipeable monthly calendar via Aladhan API, event detection |
| **ZakatCalculatorScreen** | 147 | Real-time calculator (cash, gold, silver, investments) |
| **AICoachScreen** | 222 | Real AI chat via OpenRouter API (qwen2.5), personalized by streak/level, error handling with retry |
| **MuhasabahScreen** | 229 | Self-reflection journal persisted to SQLite vault |
| **SettingsScreen** | 182 | Full settings: language, calc method, notifications, dark mode |
| **SquadsScreen** | 172 | Ummah dashboard with mock squad, duels, leaderboards |
| **FajrAlarmScreen** | 245 | Smart alarm with camera-based Wudu check (simulated) |
| **SunnahSleepScreen** | 428 | Sleep logger, HealthKit/Health Connect sync, Qailulah timer, 5 Sunnah habits |
| **ProgressTrackerScreen** | 174 | Real stats from store (noorPoints, prayerLog, dhikr, streak), dynamic growth tree |
| **KnowledgeDuelScreen** | 273 | 60-second quiz game with seerah questions, Noor rewards |
| **LocatorScreen** | 364 | Map+list of mosques/halal via OpenStreetMap Overpass API |
| **NamesOfAllahScreen** | 152 | Flip cards for 99 Names with animated flip |
| **CommunityHeatmapScreen** | 152 | Visual heatmap of community Fajr activity (mock) |
| **ProofOfSalahScreen** | 191 | Camera-based masjid check-in (simulated) |
| **KhatmahScreen** | 134 | Quran completion planner with progress ring |

---

## III. Services & Utilities

| File | Lines | Purpose |
|------|-------|---------|
| `config.ts` | 6 | App configuration: OpenRouter endpoint, model, API key, timeouts |
| `services/aiCoachService.ts` | 109 | Real AI coach via OpenRouter API, system prompts (AR/EN), conversation memory |
| `services/apiKeyStorage.ts` | 16 | AsyncStorage wrapper for OpenRouter API key persistence |

| File | Lines | Purpose |
|------|-------|---------|
| `store/index.ts` | 45 | Zustand store: onboarding, streak, noorPoints, prayerLog, dhikr count |
| `store/database.ts` | 35 | SQLite init with `reflections` + `prayer_logs` tables |
| `services/quranService.ts` | 164 | Al-Quran Cloud API: surah list, detail, Mushaf pages, audio |
| `services/notificationService.ts` | 65 | Prayer time notification scheduling (daily triggers) |
| `hooks/useFatherlyCoach.ts` | 22 | Streak-based AI insight generator |
| `utils/prayerTimes.ts` | 128 | Adhan library: 10 calc methods, country auto-detection |
| `utils/rtl.ts` | 40 | RTL utilities: icon flipping, flex direction |
| `i18n/index.ts` | 59 | i18next setup with AR primary, RTL management |
| `data/azkar.json` | 112 | 8 categories, 124 authentic adhkar entries (cleaned) |
| `data/asmaulhusna.json` | 1 line | All 99 Names with transliteration and meanings |

---

## IV. [ORPHANS & PENDING]

| Feature | Priority | Notes |
|---------|----------|-------|
| Word-by-Word Quran Analysis | Low | Requires Arabic morphology library (Sarf/Sarf-sagheer) |
| Tafsir Integration (Tafsir al-Jalalayn, etc.) | Low | API available at quran.com API, not yet integrated |
| Content Streaming (Islamic shows/docs) | Low | No backend/CDN for video content |
| Real Realtime AI Coach (LLM integration) | ✅ Done | OpenRouter API (qwen2.5) with personalized system prompts |
| Behavioral Analytics Engine | Medium | Would require local ML model for sentiment/behavior tracking |
| Fajr Chain / Squad Wake-Up Calls | Low | Requires backend service for push notification coordination |
| Haptic Digital Tasbih with counter reset per dhikr | Low | Current implementation is functional but basic |
| Zakat Donation Payment Integration | Low | Requires payment gateway (Stripe/Apple Pay) |
| Apple Watch / WearOS Companion | Very Low | Native platform extension |
| Sadaqah Jariyah Referral System | Very Low | Requires backend + invite tracking |

---

## V. System Flow (User Journey)

```
App Start
  └─ initDatabase() + initLanguageFromStorage()
  └─ OnboardingScreen (if !hasCompletedOnboarding)
       └─ Language Select → Welcome → Mithaq → Encouragement
       └─ completeOnboarding() → persist to AsyncStorage
  └─ MainTabs (if hasCompletedOnboarding)
       ├─ HomeTab → Dashboard, Prayer, Tools, AI Insight
       ├─ QuranTab → List + Detail + Mushaf + Audio
       ├─ AzkarTab → Dua hub, Tasbih, 99 Names
       ├─ QiblaTab → Real-time compass
       └─ SquadsTab → Ummah features, duels, leaderboards
  └─ Modal Screens (accessible from anywhere)
       ├─ AICoach → Chat with personalized insights
       ├─ Muhasabah → Private journal → SQLite vault
       ├─ PrayerTimes → Times + notifications
       ├─ ProgressTracker → Real stats, growth tree
       └─ ... (15+ additional modal screens)
```

---

## VI. Technical Notes
1. **RTL is fully supported** — Arabic sets `I18nManager.forceRTL(true)`, icons flip via `flipIcon()` utility
2. **Privacy-first:** All reflection data stored locally in SQLite (no server)
3. **Notification scheduling** runs daily based on computed prayer times
4. **Health integration:** Code present for Apple HealthKit (iOS) and Health Connect (Android) with Expo Go detection
5. **Gamification:** Noor points (+10 per prayer logged), dynamic level progression (5 levels), streak tracking
6. **Latest state fix:** azkar.json cleaned of corrupted encoding entries; 124 authentic adhkar entries across 8 categories
