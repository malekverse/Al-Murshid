# Al-Murshid (المُرشِد) — App Description

**Al-Murshid** (Arabic: "المُرشِد" — *The Guide / The Spiritual Compass*) is a **cross-platform AI-driven Islamic spiritual mentor application** built with React Native (Expo) for iOS and Android. It serves as an all-in-one, offline-first digital companion for Muslims, combining worship tracking, Islamic tools, gamified habit-building, and an AI spiritual coach into a single app.

---

## Core Philosophy

The app solves the problem of **fragmented Islamic digital tools** — users typically juggle separate apps for prayer times, Quran reading, dhikr counters, Qibla direction, zakat calculation, and journaling. Al-Murshid unifies all of these into one cohesive experience, enhanced by **artificial intelligence** that provides personalized spiritual guidance based on the user's actual worship patterns.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Expo SDK 54 / React Native 0.81.5 |
| **Language** | TypeScript (strict mode) |
| **Styling** | NativeWind v4 (Tailwind CSS) |
| **Navigation** | React Navigation (Native Stack + Material Top Tabs) |
| **State Management** | Zustand with persist middleware |
| **Local Database** | SQLite (expo-sqlite, WAL mode, 16 tables) |
| **Cloud Backend** | Supabase (PostgreSQL, Auth, RLS, real-time sync) |
| **Authentication** | Supabase Auth (Email/Password, Google OAuth, Apple Sign-In) |
| **AI Engine** | OpenRouter API (Qwen 72B model) |
| **i18n** | i18next + react-i18next (Arabic primary, English secondary) |
| **Prayer Times** | Adhan.js library (10 calculation methods) |
| **Quran Data** | Al-Quran Cloud API |
| **Maps** | OpenStreetMap Overpass API |
| **Health** | Apple HealthKit / Android Health Connect |
| **CI** | GitHub Actions (type-check + Jest tests) |

---

## Key Features

### 1. Spiritual Tools

- **Prayer Times Dashboard** — Real-time location-based prayer times with auto-detected calculation method, countdown to next prayer, and one-tap prayer logging
- **Qibla Compass** — Real-time compass with magnetometer/accelerometer, haptic feedback when aligned towards Makkah
- **Quran Reader** — Three modes: Surah list (searchable), Surah detail (Arabic + translation side-by-side), Mushaf page-by-page (1–604 pages) with audio recitation, tafsir, bookmarks, and Hifz (memorization) mode
- **Azkar / Adhkar** — 124+ authentic supplications across 8 categories with tap-to-complete counters
- **Smart Adhkar** — Context-aware engine (time, GPS location, weather) that suggests relevant duas
- **Digital Tasbih** — Haptic dhikr counter with target cycling (33/100/1000)
- **99 Names of Allah** — Animated flip cards with transliteration and meanings
- **Hijri Calendar** — Swipeable monthly calendar with Islamic event detection
- **Zakat Calculator** — Real-time calculator for cash, gold, silver, and investments
- **Masjid Locator** — Map and list of nearby mosques and halal places via Overpass API
- **Fajr Alarm** — Smart alarm with camera-based Wudu check
- **Proof of Salah** — Camera-based masjid check-in with SQLite persistence
- **Sadaqah (Charity) Logger** — Track charitable giving with categories and summaries
- **Ramadan Tracker** — Fasting, suhoor/iftar, qiyam, and sadaqah tracking

### 2. AI & Mentorship

- **AI Coach (Al-Murshid Chat)** — Real-time chat with an AI spiritual mentor using OpenRouter. The system prompt is bilingual (Arabic/English), conversation history persists locally (last 50 messages), and responses are context-aware using the user's reflections, streak, and level.
- **Fatherly Coach Insight** — Streak-based AI-generated motivational messages on the home screen
- **Muhasabah (Self-Reflection)** — Private encrypted journal with AI guidance, weekly digest, and expandable history (privacy-first: stored locally in SQLite)

### 3. Habit Tracking & Gamification

- **Noor Points System** — Earn points through prayers (+10 each), dhikr, reflections, sleep logging, and more
- **Level System** — 5 levels (Al-Mubtadi → Al-Talib → Al-Mujtahid → Al-Muqarab → Al-Sabiq) at milestone thresholds (0/50/150/500/1000 points)
- **Sunnah Streak** — Consecutive days of worship tracking with streak decay on missed days
- **Khatmah (Quran Completion) Planner** — Goal presets (30/60/90 days) with progress ring
- **Knowledge Duel** — 60-second Islamic quiz game with seerah questions, Noor rewards, and best-score persistence
- **Sunnah Sleep Tracker** — Log sleep hours, HealthKit/Health Connect sync, Qailulah (midday nap) timer
- **Goals Dashboard** — Daily goals for prayers, dhikr, Quran pages, charity, sleep, and exercise

### 4. Smart Features

- **Smart Prayer Reminders** — Analyzes prayer patterns; only reminds for prayers missed >30% in a week; extra nudge for Fajr if alarm dismissal rate is high
- **Behavioral Analytics** — Weekly trends, behavioral profile, iman score, reflection trends
- **Analytics Dashboard** — Combined prayer analytics, sleep analytics, level progress, growth tree visualization

### 5. Community

- **Squads / Ummah Dashboard** — Community features with knowledge duel leaderboards
- **Community Heatmap** — Visual heatmap of community Fajr activity

---

## Architecture & Data Flow

**Offline-first** — SQLite is the primary data store. All writes go through a service layer → SQLite → then Zustand (for reactivity). Cloud sync (Supabase) runs every 5 minutes in the background with a generic push/pull sync engine covering 9 database tables.

```
User Action → Screen Component → Data Service → SQLite → Zustand Store → UI Re-render
                                                          ↓
                                              Sync Engine (every 5 min) → Supabase
```

**Tamper detection** via checksums on synced records protects data integrity.

---

## Navigation Structure

- **Root Stack** wraps everything:
  - Unauthenticated → Login / Register screens
  - New users → 4-step Onboarding (Mithaq)
  - Authenticated + onboarded → 5-tab bottom navigator: **Home, Quran, Azkar, Qibla, Squads**
  - 20+ modal screens (AI Coach, Settings, Knowledge Duel, Prayer Times, etc.)

---

## Internationalization

- **Arabic** is the primary language; English is the fallback
- Full RTL support (`I18nManager.forceRTL`), icon flipping utilities, RTL-aware margin/padding helpers
- 388 translation strings in each language

---

## Project Scale

- **31 screens**, 20+ modal routes
- **16 SQLite tables**, 9 CRUD modules, 12 data service modules
- **5 Zustand stores** with persistence
- **124+ duas**, **99 Names of Allah**, **365 daily hadiths**, **50+ duel questions**
- **~5,000+ lines of TypeScript** across the codebase

---

## Current Status

The app is feature-complete and at a **production-ready stage**, with a documented production readiness plan (PLAN.md) outlining P0–P3 priorities. It has full CI (type-checking + tests), error tracking, data export/import, and settings management.
