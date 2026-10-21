# Phase 7 · Remember, You and seasons (plan)

2026-10-21. SPEC 3, 5.6 to 5.9 and 12: Your Sky, the Journey, night reflection, seasonal modes,
widgets, and Remember's tasbih, adhkar, duas and 99 Names. Decisions made along the way go to
`docs/DECISIONS.md`.

Started with Phase 6's gate still open on one item, pages showing as indexed in a search console,
which only time brings (the owner's decision, 2026-10-21).

## Gate

- The polish checklist (SPEC 11) on every new screen, on web and Android, in ar and en, light and
  dark (iOS through an EAS build on a device).
- Ramadan mode verified with a simulated date: countdowns, the daily juz, Taraweeh and fasting
  logs, the last ten nights, the night palette.

## What waits for content

Every religious text comes from `packages/content` with a source reference and a reviewer's
sign-off (SPEC 10). None of these is in the repository yet, so they come with the reviewed content
(IslamHouse's Hisn al-Muslim, or another named source), and nothing is shown in their place:

- Adhkar collections and duas by feeling (also Phase 6's public pages).
- The tasbih phrases (SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illa Allah,
  Astaghfirullah, salawat), with their Arabic, translations and transliterations.
- The 99 Names, with meanings and reflections written in-house and reviewed.
- The Laylat al-Qadr du'a (Ramadan's last ten nights) and the takbir (Dhul Hijjah).
- Today's morning and evening adhkar cards, which open those collections.

## Steps, in order

Each step lands on web and mobile together, with tests, an end-to-end flow and screenshots.

### 1. Your Sky and the Journey (You)

- **Your Sky:** a monthly grid of day tiles whose glow follows the prayers logged that day; tap a
  day to see its lights. No numbers unless "Show details" is on. Months before the first log are
  plain night, never marked.
- **Journey:** each track's current step, with "Change focus" and "Step back" one tap away; the
  remembrance track's steps stay selectable but say their content is coming.
- The You tab becomes Your Sky and Journey first, settings after.

### 2. Seasonal modes and Today's cards

- **Ramadan** (automatic by Hijri date, can be turned off): the hero counts down to suhoor (Fajr)
  and iftar (Maghrib); Quran suggests the day's juz; Taraweeh and fasting logs ("fasted" or "not
  today", never asking why); the last ten nights highlighted; a lantern-lit night palette (new
  tokens, contrast-tested).
- **Jumu'ah:** the Surah Al-Kahf card (Thursday Maghrib to Friday Maghrib) and a salawat reminder
  line.
- **Dhul Hijjah:** the first ten days noted, and a Day of Arafah fasting reminder.
- Fasting logs are stored like prayer logs (local, synced in Phase 8).

### 3. Night reflection and privacy (You)

- An optional prompt after Isha: one gratitude, one intention for tomorrow, a free note. Stored on
  the device only, encrypted at rest (AES-GCM; the key in the platform's secure storage on mobile,
  a non-extractable WebCrypto key in IndexedDB on web).
- An optional app lock for You on mobile (Face ID, fingerprint or passcode).
- Export everything as JSON; delete everything on this device in one confirmed action.

### 4. Tasbih (Remember)

- The whole screen is the tap target: a large count, a target (33, 99, 100, custom or none), a light
  haptic per tap and a stronger one at the target, the screen kept awake, daily totals saved locally.
  It counts on its own until the reviewed phrases arrive; then the phrase picker appears.
- Remember shows only what exists: Tasbih now, the collections and Names when their content lands.

### 5. Widgets (mobile)

- Android home-screen widgets, small and medium, with the next prayer and its countdown in the
  current sky (`react-native-android-widget`, MIT); iOS home-screen and lock-screen widgets through
  Expo's widget support, checked on a device through EAS.
- They read what the app writes to shared storage, so they work offline.
