# Decisions

One line per non-obvious choice: what, why, and the alternatives considered (SPEC 1, rule 8).
Newest phase at the bottom.

## Phase 1 · Foundation (2026-10-17)

### Versions and tooling

- **Expo SDK 58 (RN 0.88, React 19.3.0) instead of SDK 57.** The SPEC says use the newest stable at scaffold time; SDK 58 left beta. Alt: SDK 57, already one release behind.
- **Next.js 16.4.2 with Cache Components, partial prefetching, React Compiler and Turbopack's `@tailwindcss/turbopack` loader.** These are the create-next-app 16.4 defaults and make static public pages the default. Alt: PostCSS plugin (older path).
- **TypeScript 6.0.3, not 7.0.** Expo SDK 58 ships 6.0, and Next, Expo and typescript-eslint still build on the JavaScript compiler API that 7.0 (the Go port) does not expose yet. Revisit when they support it.
- **ESLint 9.39, not 10.** eslint-config-next and eslint-config-expo plugins are not yet verified on 10.
- **One pnpm `catalog:` for shared versions, exact pins everywhere.** One React for both apps; SPEC rule 5. Alt: per-package ranges.
- **`core`, `content` and `data` packages are created in their own phases (3, 5, 8).** Empty packages would be placeholders. Alt: scaffold all now.
- **pnpm `nodeLinker: hoisted` (flat `node_modules`).** The repo lives in a long OneDrive path; isolated installs add `node_modules/.pnpm/<name>@<hash>/node_modules/` and pushed Android C++ build folders to 261 characters, past the 250 Windows limit, so the NDK compiler check failed. Expo documents hoisted as the fallback. Alt: move the repo to a short path outside OneDrive (owner chose to keep it).
- **Config plugin `plugins/with-short-native-build-paths.js` moves every module's C++ build folder to `%LOCALAPPDATA%\murshid-cxx\<module>` on Windows.** Some libraries (Nitro, Reanimated, gesture-handler codegen) write the full source path into object folder names, so the OneDrive prefix appears twice; short build folders leave CMake room under its default 250-character cap to hash those names. (A lower cap of 200 made it worse: CMake needs room for a 32-character hash plus the file name.) Bonus: OneDrive no longer syncs C++ build output. No effect on macOS, Linux or EAS. Alt tried: a `subst` drive letter; it fails because Node resolves the drive back to the real `C:\` path, giving Gradle two roots.
- **`patches/uniwind@1.12.2.patch` adds `AssetRegistry` to Uniwind's `react-native` re-exports.** React Native 0.88 moved the asset registry into `react-native` itself, and expo-asset (fonts, images) imports it from there; Uniwind 1.12.2 forwards a fixed export list without it, so every asset lookup failed. Remove the patch once Uniwind ships the export. Alt: drop Uniwind for Unistyles 3 (the SPEC fallback); too big a change for one missing export.
- **The root layout continues with system fonts if a font fails to load.** It used to wait forever on a blank screen.
- **Supabase tests allow 60 s for setup.** Booting Postgres in WebAssembly takes over 10 s when every package tests in parallel.

### Design tokens

- **Token names `canvas`, `ink`, `ink-muted` instead of the SPEC's `bg`, `text`, `text-muted`.** Tailwind utilities read `bg-canvas text-ink` instead of `bg-bg text-text`. Same values.
- **New tokens: `on-lantern` (text on a lantern fill), `lantern-ink` (lantern as text), `focus`, `card-edge`.** The SPEC's single lantern color cannot be both a fill and readable text in light theme.
- **Light `lantern` darkened from #C98A2E to #BB7E25.** #C98A2E is 2.7:1 on the canvas; lights and rings need 3:1 (WCAG 1.4.11). Text uses `lantern-ink` #8C5C14 (5.7:1). Unit tests enforce every pair in both themes.
- **Glass opacity 76% (light) and 65% (dark) instead of 70% and 60%, and the glass tone follows the sky, not the app theme (`glassToneFor`).** At the SPEC values, muted text failed 4.5:1 over mid-tone skies (4.35:1). Tested against every sky stop.
- **Separate `text-<role>` (Latin) and `text-ar-<role>` (Arabic) utilities, picked by a script-aware `Text` component.** Works identically on native, where `:lang()` selectors don't exist. Alt: CSS `:lang(ar)` overrides on web only.
- **Web resets Tailwind's default colors, font sizes, radii, shadows and easings.** Only Quiet Light tokens exist as utilities, so a hard-coded `bg-red-500` cannot even compile. Spacing keeps Tailwind's 0.25rem step, which already lands on the 4-point grid.
- **Generated theme CSS is committed, with `pnpm tokens:check` in CI.** Both bundlers read it directly with no build step; CI catches drift.
- **Native fonts are static weights with one family per weight, loaded with `useFonts` at startup.** No synthetic bold on Arabic. Phase 9 moves them to build-time embedding (expo-font config plugin) for the cold-start budget.

### Arabic first

- **Mobile uses `use-intl`, the core of next-intl.** Same ICU messages, same `useTranslations` API on both apps. Alt: i18next (different message syntax).
- **Mobile switches direction at runtime, without a reload.** The root view's `direction` style flips content and expo-router's `LocaleProvider` flips navigation; `I18nManager.forceRTL` is persisted for the next cold start. The SPEC prefers this when reliable; the reload fallback stays available.
- **Web Arabic digits follow the browser's default for `ar` (Western digits today), since a URL locale has no region.** Mobile applies the SPEC rule with the device region. A stored digits preference reaches the web in Phase 4.
- **French typography uses a no-break space before `:` and a narrow no-break space before `; ! ?`.** Standard French typesetting.
- **Arabic and French copy is written natively, not machine-translated, but still needs a native-speaker review (SPEC 7).** Tracked for Phase 9.

### Data

- **Supabase RLS tests run the real migrations in PGlite (Postgres in WebAssembly) instead of pgTAP on a local Supabase.** No Docker on the dev machine; the same tests run in CI. A small stand-in provides `auth.users`, `auth.uid()` and the `anon` / `authenticated` roles.
- **The hosted Supabase project is not created yet.** It needs the owner's account (EU region, SPEC 9). Migrations are ready; sync arrives in Phase 8.
- **Database checks:** locale is a 2–3 letter code (adding a language never needs a migration); prayers include `taraweeh` (SPEC 5.8); coordinates are `numeric(5,2)`, so rounding to about 1 km happens in the database; RLS is forced and `anon` has no table access.

### Platform and assets

- **Phase 1 showcase lives at `/[locale]` on web and the index screen on mobile.** Today replaces both in Phase 4.
- **Temporary app icon and splash (a dawn sky with one rising light) replace Expo's logo.** Final branding is Phase 9; prompts for it are in `docs/GEMINI_PROMPTS.md`.
- **Bundle ID `com.malekverse.almurshid`, URL scheme `almurshid`.** Matches the GitHub owner. Change before the first store submission if needed.
- **The Phase 1 native sky tiles use React Native's `experimental_backgroundImage` gradient and solid glass (no blur).** Phase 2 moves the living sky to Skia and adds blur, as the SPEC asks.
- **The dev machine is Windows, so there is no iOS simulator.** Android emulator and web are checked locally; iOS is checked through EAS builds on a device.

### Open items carried into Phase 2–3

- ~~Arabic-Indic digits don't appear on Android.~~ Resolved in Phase 2 by the FormatJS polyfills (below).
- ~~Native glass has no blur yet, and the native sky uses React Native's gradient style.~~ Resolved in Phase 2.
- **iOS is unverified** (no Mac). The first EAS development build covers it.

## Phase 2 · Design system (2026-10-18)

### Shared

- **The sky blends in OKLab, driven by sun altitude on an axis normalized to the day's noon altitude (`skyAt`).** OKLab avoids the muddy grey band plain RGB mixing makes between navy and coral; normalizing means winter days and high latitudes still pass through every color on a lower arc. Dawn spans 10° (about 40 minutes): a 5° span jumped visibly between minutes, caught by the continuity test.
- **Prayer glyph geometry lives in `packages/tokens` (`prayerGlyph`), drawn by SVG on web and react-native-svg on native.** One shape on both platforms; never mirrored, like a clock.
- **New tokens: `starlight`, `glassBlur`, `toastVisible`, `loadingDelay`, `font-quran`.** Keeps stars, blur, timings and the Quran font out of feature code.
- **Grain on the sky is generated in code (SVG turbulence on web), not an AI texture.** Exact, tiny and resolution-independent.

### Web

- **Sheet and Slider build on Radix (Dialog, Slider), restyled to Quiet Light.** Focus trap, Escape, RTL keyboard handling and ARIA come for free (SPEC 8.2 allows Radix). The sheet takes an optional `trigger` so focus returns to it on close (WCAG 2.4.3).
- **The page behind an open sheet scales to 96% through `data-sheet` on `<html>` and `#app-root`.** No portal-aware context needed; Reduce Motion skips the scale.
- **Sky colors are registered CSS properties (`@property --sky-top`), so the gradient itself transitions.** Browsers cannot transition `background-image` otherwise.
- **Star coordinates are rounded to two decimals.** `Math.pow` differs in the last bits between Node and browsers, which caused a hydration mismatch.
- **The theme script runs through `next/script` with `beforeInteractive`.** React 19 warns about inline `<script>` elements in components; this still runs before paint.

### Mobile

- **FormatJS polyfills are forced on Hermes: Intl.PluralRules, NumberFormat and DateTimeFormat with `ar`, `en`, `fr` data and every IANA time zone.** Hermes has no PluralRules (Arabic plurals crashed), ignored `-u-nu-arab` (no Arabic-Indic digits) and formatted Arabic times as "4:52 AM". Now Android matches the web. A new language adds its locale-data lines in `lib/intl-polyfills.ts`.
- **Glass blurs on iOS (expo-blur) and is tinted without blur on Android.** Android blur needs a `BlurTargetView` wrapped around what it blurs; behind glass there is only the smooth Skia sky, so the tint alone reads the same. Reduce Transparency turns glass solid on both.
- **List rows and prayer rows highlight when pressed instead of scaling to 0.97.** A full-width row that shrinks looks broken; native lists highlight. Buttons, icon buttons, segments and cards keep the scale.
- **The mobile tab bar is Expo Router's NativeTabs, set up with real navigation in Phase 4.** The gallery shows the web tab bar and rail only.
- **Phosphor icons are imported one file at a time on native (`phosphor-react-native/src/icons/X`).** The package root re-exports every icon and Metro does not tree-shake.

### Content and assets

- **`AyahText` and `DhikrCard` exist on both platforms but are not in the galleries yet.** They must show verified text, and the QPC Hafs font and its matching text come from QUL downloads that need the owner's sign-in and terms acceptance (SPEC 10). They join the galleries when those files land.
- **Gemini illustrations are exported by `design/scripts/export_illustrations.py`: background re-keyed to the exact canvas, edges faded to transparent, WebP for both apps.** Empty states live on the canvas, not on cards, because their pictures are keyed to it.

### Digits (owner decision, 2026-10-18)

- **Western digits (0123) everywhere, Arabic included; Arabic-Indic digits only as an opt-in setting.** The owner prefers the digits everyone is used to. This replaces the SPEC's Maghreb/other-Arabic rule (SPEC 7 updated). Ayah numbers inside Quran text keep the mushaf's own numerals.

### Performance gate (SPEC 12, Phase 2)

- **The debug build is not a valid measurement.** On the emulator it renders at ~10 fps even when idle, because debug native libraries (Skia, Reanimated) are unoptimized and JS runs in dev mode.
- **This emulator cannot show 60 fps for anything.** Release-build medians (`dumpsys gfxinfo`): Android's own Settings app 53 ms, the sky test screen 69 ms (26 fps on its UI-thread counter), the full gallery 97 ms. The sky costs about 1.3x the system baseline here, which is encouraging but proves nothing about a phone.
- **`/dev/sky` is the gate's test bench:** the sky alone, gliding through a whole day the way Today drives it, with a frame counter measured on the UI thread. The Phase 2 gate stays open until it holds about 60 fps on a three-year-old mid-range Android phone in a release build.
- **Passed on the owner's Android phone (2026-10-18).** With the ARM64 release APK, the gallery and `/dev/sky` ran smoothly ("it works perfectly"), so the frame-rate part of the gate is closed.

### Quran text and font, and the gate (2026-10-18)

- **The Quran font is the King Fahd Complex's QPC Hafs V22 (KFGQPC HAFS Uthmanic Script 2.2), with its matching QPC Hafs ayah-by-ayah text, both from QUL.** SPEC 6.2 names this font, and the text uses exactly the characters it was built for. QUL's Digital Khatt and IndoPak scripts serve other mushaf styles. The King Fahd Complex's own sites time out from here, and QUL downloads need an account (the owner's).
- **The font's license (embedded in the font) allows free use, copying and distribution, but no selling or modifying, so it ships exactly as published.** There is no subsetting (SPEC 8.3's "subset" does not apply to it): WOFF2 on web and TTF on mobile, both as QUL serves them. Web loads it only where Quran text appears (no preload) with `font-display: block`, so Quran text never flashes in a fallback that lacks its marks.
- **`packages/content` starts now: the downloaded files, untouched, plus `sources.json` (URL, publisher, license, date, SHA-256).** `sources.test.ts` is SPEC 10's hash test and also pins both font files; Turborepo hashes the fonts as inputs to that test. The full content schema (references, reviews, translations) comes in Phases 5 and 7. QUL states no terms for the QPC Hafs text itself, which is the King Fahd Complex's published text. Confirm before launch (Phase 9).
- **The QPC Hafs text ends each ayah with its number in Arabic-Indic digits, which the font draws as the end-of-ayah ornament.** `AyahText` now renders the text as it is and no longer adds its own `۝` marker. In 2:72 the number follows a plain space instead of a no-break space. The text stays as published; the reader (Phase 5) should keep the last word and the ornament on one line.
- **Quran text lays out right to left in every UI language:** `dir="rtl"` on web, `direction` plus `writingDirection` on native. Android had aligned it left inside English screens.
- **A dhikr that is Quran (Al-Ikhlas, Ayat al-Kursi) renders in the Quran font through `DhikrCard quran`.** The gallery shows Al-Ikhlas this way, with a count of 3 as a sample only. Real adhkar, with their hadith references, arrive with reviewed content in Phase 7. Galleries use only text from `packages/content`, nothing typed by hand.
- **The Phase 2 gate is closed.** The sky test held on the owner's phone, and the gallery now includes every SPEC 6.6 component. It was checked on web and Android in Arabic and English, light and dark, and at phone width.

## Phase 3 · Core engine (2026-10-18)

### Order

- **Phase 3 started while the Phase 2 gate waits on the owner** (the 60 fps test on a real phone with the release APK, and the QUL font and text for `AyahText` and `DhikrCard`). SPEC 12 says not to start a phase with the previous gate open. `packages/core` is pure TypeScript with no UI, so it touches nothing that gate checks, and nothing from it is wired into the apps until the gate closes.

### Libraries

- **Prayer times and Qibla come from adhan-js 4.4.6 (MIT); the Hijri calendar from `@tabby_ai/hijri-converter` 1.0.5, which ships the official Umm al-Qura table (1343–1500 AH).** Both are offline and deterministic, so web and mobile get identical results from the same inputs.
- **The sky uses its own low-precision sun model (`sun.ts`, about 0.01°).** It drives colors and the sun's height, never a prayer time.

### Accuracy gate (SPEC 11, 12)

- **The reference is the Aladhan API, an independent implementation: 27 cities, 71 city-days.** They cover winter, the June solstice, the EU and US DST change days, Casablanca's Ramadan clock change, Cairo's DST, Makkah in Ramadan, Sydney's DST and Oslo, Stockholm and Reykjavik at high latitude. `pnpm --filter @murshid/core reference` fetches them once into `fixtures/reference-times.json`; tests never touch the network.
- **Result: 318 of 355 times match Aladhan to the minute and the rest are within one minute.** The one exception is the Moonsighting Committee's seasonal Fajr and Isha, allowed 3 minutes (Los Angeles in January is 3 off). moonsighting.com's own calculator could not be fetched to settle which side is right. Pending reviewer.
- **Asr is tested against its definition, not against Aladhan.** Aladhan's Asr drifts from the shadow rule by up to 20 minutes (Reykjavik in January). The test finds the moment the shadow equals the object plus its noon shadow, using the apparent sun (with refraction) and adding the method's own Asr minutes. adhan-js lands within 1.7 minutes of it up to 55° latitude (tolerance 2) and within 2.7 above (tolerance 5).
- **Times are compared modulo one day.** Aladhan stamps a time after midnight (Isha in a French June, Maghrib in an Icelandic one) with the requested date.

### Methods (SPEC 10)

- **A method can add its own minutes on top of adhan-js's: Morocco +5 for Dhuhr and Maghrib, Jordan +5 for Maghrib.** Aladhan's methods include the same minutes, so the accuracy test checks them independently.
- **Country defaults beyond the obvious ones:** France gets the Muslim World League because there is no single official authority (UOIF's 12° is a choice in settings). The UK, Ireland, the US and Canada get the Moonsighting Committee, and Bahrain and Oman the Gulf method (Isha 90 minutes after Maghrib). Every method keeps `reviewed: false` until the reviewer confirms each country's current practice.
- **Above 48° the automatic high-latitude rule is adhan-js's recommendation (seventh of the night). Inside the polar circles, times come from the nearest latitude where the sun still rises and sets.** Every time always exists, even in an Arctic June.
- **Umm al-Qura sets Isha 120 minutes after Maghrib during Ramadan, 90 otherwise.**

### Hijri

- **The converter matches ICU's Umm al-Qura table on every day from 2024 to the end of 1450 AH (2029-08-10). From 1451 AH the two tables differ on some month starts.** The app follows the converter, which ships the official table; the ±2-day setting covers local sighting. The agreement test stops at 1450 AH.
- **White days are the 13th to 15th of every month, except 13 Dhu al-Hijjah, a day of Tashreeq on which fasting is not done.** Pending reviewer.

### Journey (SPEC 3)

- **Onboarding sets only the starting prayer step:** just starting → one prayer, sometimes → two, most days → all five, all five → five plus the adhkar.
- **A next step is offered after the current one held on 5 of the last 7 days, then nothing for 7 days, accepted or not.** Each date counts once, and records outside the window (including future dates from a wrong clock) are ignored.
- **Welcome back after 3 days away. After 5 reminders ignored in a row, reminders quietly reduce to the focus prayer.**

### Reminders (SPEC 5.2)

- **The plan is plain data: 6 days ahead, at most 64 pending (the iOS limit), nearest first.** Ids are `date-prayer-kind`, so rebuilding the plan on every app open is idempotent.
- **A heads-up is 5 to 30 minutes before the prayer, always quiet (an adhan setting becomes soft), and never carries "I prayed".** Fajr and Isha notifications open in the dark theme.

## Phase 4 · Today (2026-10-18)

### Shape

- **What Today shows is computed in `packages/core` (`todayView`): rows, the hero, earlier prayers and at most one card, from the instant, the place, the settings and the logs.** Both apps render the same day from the same inputs, and the rules are unit-tested (100% coverage), including the Hijri month grid.
- **Before Fajr, the Isha being prayed belongs to yesterday.** Once the current prayer is logged, the hero moves on to the next prayer and its countdown.
- **Settings and logs share one schema in a new `packages/data` (Zod).** Every settings field falls back to its own default, so a damaged or older value never resets the rest. Logs keep a `deleted` tombstone, so an un-log can sync in Phase 8.
- **Storage: web keeps settings in localStorage (in memory if storage is blocked) and logs in IndexedDB through Dexie. Mobile keeps settings in MMKV and logs in expo-sqlite through Drizzle.** Mobile migrations are plain SQL tracked by SQLite's `user_version`, which avoids drizzle-kit's bundler plugin for `.sql` files.
- **The You tab arrives early with the settings the daily loop needs:** location, method, Asr, the high-latitude rule, minute adjustments, the Hijri offset, reminders, language, theme and simple view. Your Sky, Journey and night reflection stay in Phase 7.

### Location, offline

- **Cities come from GeoNames cities15000 (CC BY 4.0) with their Arabic, French and English names: 31,766 places, built by `packages/content/scripts/import-cities.ts`.** Neighbourhoods and historical, abandoned or destroyed places are left out. The 2.5 MB table loads only when someone searches or locates, and its hash is pinned in `sources.json`.
- **Search forgives Latin accents, Arabic diacritics, letter variants (أ إ آ ٱ ى ة ؤ ئ) and a missing article, so "قاهرة" finds "القاهرة".** Whole-name matches rank first, then prefixes, then inner words, larger cities first.
- **A device position is named offline after the most populous place within 10 km, else the nearest one.** Central Paris reads "Paris", not an arrondissement. Coordinates keep three decimals (about 100 m). The location stores its name in each language, so the label follows the UI language.
- **"You seem to be in X" appears only when the device location is in use, location is already allowed, and the device has moved more than 50 km or into another time zone.** It never asks for permission.

### Onboarding

- **On web the steps live in the URL hash, so Back works and a language change keeps the place.** Web skips the reminders step, since reminders are mobile-only in v1. The language is preselected from the device (next-intl's middleware on web, expo-localization on mobile).
- **Mobile offers simple view when the system font scale is 1.3 or more (SPEC 3).**
- **"Just starting" sets one prayer a day, with Maghrib as the focus until Journey (Phase 7) lets the person choose.** Maghrib is short and falls at a natural pause.

### Today

- **Cards shown in Phase 4: Welcome back and the new-step offer.** The Jumu'ah and adhkar-window rules exist and are tested in core, but each card waits for its destination: Al-Kahf in Phase 5, adhkar in Phase 7. Ramadan and the verse of the day come with seasonal content.
- **Welcome back shows Az-Zumar 39:53 in Arabic only, read verbatim from `packages/content` (on web, by the server page).** Translations wait for licensed texts (SPEC 10). The du'a on accepting a new step also waits for reviewed content.
- **On mobile, the Quran text loads only when the Welcome back card shows.** Today no longer parses the whole text (about 1.8 MB of JSON) on every cold start for one verse it rarely shows.
- **"I prayed" turns into a check while a light rises into the sky, with a success haptic. A toast says "Prayed. May Allah accept it." and offers Undo**, since a mis-tap should cost nothing. The Earlier prayers sheet logs and un-logs today's and yesterday's prayers.
- **Each logged prayer adds a light to today's sky: gold by day, starlight by night.** Unlogged prayers leave no mark. The lights sit in the band of sky above the glass card; placed over the whole hero, Fajr's and Isha's slipped behind the card.
- **Text inside mobile glass reads the glass tone (a `GlassTone` context from `GlassCard`), not the app theme.** Text over a bright sky stays dark even in the dark theme.

### Reminders (mobile)

- **Six days are scheduled and rebuilt on every return to the app, whenever a setting that moves them changes, and by a 12-hour background task.** About 27 are pending at any time, well under iOS's 64.
- **Android notification channels are versioned (`adhan-2`, `soft-1`, `silent-1`), because Android fixes a channel's sound once it is created.** The soft tone is a two-partial chime synthesized for the app, so no third-party recording is involved. Android 14+ asks for exact alarms from the reminder settings when the permission is missing.
- **The adhan recordings are not chosen yet. Until they are, "Full adhan" rings the phone's default sound.** Choosing 3 to 5 recordings with confirmed rights is an open item for the owner (SPEC 5.2, 10).
- **"I prayed" in a notification logs with source `notification` and dismisses the notification, with the app open or closed.** Verified on the Android emulator in both cases; the closed case on a release build with the process killed, since a debug dev client cannot run background tasks reliably. iOS answers the tap through the response listener and the last response at launch; it gets checked on a device through EAS.
- **Background tasks are defined in the app's entry (`apps/mobile/index.ts`), before Expo Router loads.** When Android wakes a closed app for a notification action, it runs the entry without rendering a screen. Tasks defined in the root layout therefore never existed, and the release build logged "No task registered" and dropped the tap. The task then receives the raw response, where a local notification's data is still a JSON string (`content.dataString`), so the task parses it before handling the tap.
- **Ignored reminders (SPEC 3): a prayer-time reminder counts as ignored once 90 minutes pass with the prayer neither logged nor the reminder opened.** Delivered reminders are remembered for 8 days. At five in a row, reminders reduce to the focus prayer, with one note on Today and a way to bring them all back, which starts a fresh count.
- **`/dev/reminders` (mobile) rings a test reminder in five seconds**, so the notification path can be checked without waiting for a prayer time.

### Navigation and tools

- **Mobile tabs use the Phosphor icons (regular, and fill when selected), rendered to PNGs for NativeTabs' `src`.** Android's `md` icons would need `expo-symbols`, another native module and rebuild. iOS uses the closest SF Symbols.
- **Qibla: native uses expo-location's true heading, low-pass filtered and sprung, so the dial never jitters.** The screen warms as the phone turns toward the Qibla, and one medium haptic fires on reaching ±3°. Web shows the bearing on a fixed dial and uses DeviceOrientation where the browser allows it (iOS needs a tap to grant motion access). The dial is never mirrored.
- **Calendar weeks start on Saturday in Arabic, Sunday in English and Monday in French. Arabic uses the narrow weekday names, which fit seven columns on a 360 dp phone.** Numeric ranges such as "13–15" are wrapped in left-to-right isolates.
- **On mobile, use-intl's `useLocale()` is an Intl tag (`ar-u-nu-latn`); language checks use the app locale (`useAppLocale`).** This caused a duplicated Arabic prayer name in the hero, now fixed.

### Verification

- **Web: a Playwright flow covers first visit, onboarding by city, Today, "I prayed", an earlier prayer and a reload, and passes at 1280 px and 360 px.** It runs with `pnpm --filter @murshid/web e2e`, not yet in CI, which would need the browsers installed. A screenshot run covers Today, You, Qibla and the calendar in ar, en and fr, light and dark, at both sizes (`e2e/.screens`, not committed).
- **Release builds keep WorkManager's Room database through R8 (`expo-build-properties` adds the keep rules).** The notification and background-task modules bring WorkManager, and SDK 58 shrinks release builds by default. Without the rules, the release app crashed at launch (`WorkDatabase_Impl` stripped), which no debug build would ever show.
- **Offline: the mobile daily loop makes no network calls (prayer times, cities, the Quran verse and the Hijri calendar are all local).** Web offline arrives with the PWA (Serwist) in Phase 5.

## Phase 5 · Quran (2026-10-18)

### Sources (SPEC 10)

- **Everything comes from QUL, downloaded with the owner's account and permission, and is pinned by SHA-256 in `packages/content/sources.json`:** the KFGQPC Hafs word-by-word script, the QCF V2 glyph text and the 1421H 15-line layout, juz/hizb/rub/sajdah metadata, the surah name font, English and French word-by-word meanings, English word-by-word transliteration, and timestamps for five reciters. Files stay byte for byte as published.
- **Translations: Saheeh International (English) and Muhammad Hamidullah (French), the owner's choice, pending written permission from their publishers before launch.** The repository is public, so committing them already redistributes them; this is recorded as an open item. Word meanings and transliteration come from QUL, which does not flag them as copyrighted (it flags some other word-by-word sets).
- **Not in Phase 5:** translated surah names (no licensed source; lists show the transliterated name and the calligraphy), short tafsir (no licensed source chosen; the ayah actions leave it out), private ayah notes (they need the encrypted local store that night reflections bring in Phase 7), and sharing an ayah as an image card (Phase 6 makes per-ayah Open Graph images).

### Pipeline

- **`scripts/build-quran.ts` derives `quran/generated` (1,033 minified JSON files) from the pinned sources, per surah, so neither app parses the whole Quran at once.** A generated `loaders.js` gives each file its own dynamic import for both bundlers. CI fails when the folder is stale (`pnpm content:check`).
- **The words shown are cut from the published ayah text, with the word-by-word file used only for boundaries.** The two differ in spacing only (the rub el hizb sign takes a no-break space in the ayah text; 12 sajdah or joined marks have no space), so every character comes from the published text, and a test rebuilds all 6,236 ayahs byte for byte from words and separators.
- **Data quirks are pinned in tests rather than edited:** one empty Saheeh footnote (7:143; its mark is hidden), Abdul Basit's al-Baqarah listed at 8,655 s though the file runs 9,685 s (its MP3 header; players use the file's own length), and one timestamp matched to an earlier occurrence of a refrain (Abdul Basit 55:71). `playbackSpans` (core) places unusable ayahs between their neighbours.
- **Search (references, surah names, Arabic words, the translation) matches plain forms built for search only;** results always show the published text.

### Mushaf (SPEC 5.5)

- **The 1421H (V2) Madani layout with its 604 page fonts, as SPEC 5.5 asks ("page-accurate fonts").** Each line is drawn in its page's QCF V2 font, sized from the width (`mushafPage` tokens). The basmalah line uses Al-Fatihah 1's own glyphs from page 1, without the number. In 18 surahs the printed page ends with the surah's name and the next page opens with the basmalah; the layout keeps that.
- **The page fonts (about 200 MB) stay out of git.** `quran/qpc-v2-fonts.json` pins each file's hash and `pnpm --filter @murshid/content fonts:v2 <folder>` installs them into `apps/web/public/fonts/quran-v2`, refusing any file that differs. Mobile downloads a page's font once from `EXPO_PUBLIC_ASSET_BASE_URL` and keeps it. Hosting them on the asset CDN is an open item for the owner. The fonts carry no license text ("Test Font, KFGQPC" in their name table): an item for the reviewer.
- **Pages turn like a paper mushaf in every app language: the next page lies to the left (button, ← key, or a swipe toward the right).** Wide web screens show facing pages, odd on the right. Pages change in place, without a transition, because Quran text never animates.

### Reading and listening

- **Verse view: tap a word for its meaning and transliteration; each ayah's actions are play from here, word by word, five bookmark colors, copy and share.** Copying and sharing carry the published text, the shown translation and the reference.
- **New tokens: a sepia reading theme (scoped to the reader, `data-theme` on web, Uniwind `ScopedTheme` on mobile) and four bookmark colors beside the lantern, each 3:1 against both surfaces in every theme.**
- **Recitations: al-Afasy, al-Husary, Abdul Basit, al-Minshawi and al-Ghamdi, surah by surah with word timestamps.** QUL's al-Husary "murattal" set is his teaching edition, labelled as such. Audio streams from the publishers' servers (QuranicAudio, Tarteel's CDN); hosting it on our own CDN waits for each reciter's rights (open item). Web uses one audio element and the Media Session API; mobile uses expo-audio with background playback and lock-screen controls, and plays a downloaded surah from the phone.
- **Khatmah (core): today's portion holds still through the day; falling behind raises the daily portion quietly, never above twice the starting pace, and the finish date moves instead.** Nothing is ever shown as owed.
- **Web routes `/quran/[surah]` (prerendered), `/quran/[surah]/[ayah]` and `/quran/page/[page]`, mirrored on mobile.** Cache Components needs the reader routes to block (`instant = false`), since the shell reads the address.

### Platform notes

- **Release builds may fetch plain HTTP from `localhost` and `10.0.2.2` only (`plugins/with-local-cleartext.js`); every other host needs HTTPS.** Release builds forbid cleartext by default, which kept an emulator from downloading page fonts from the web dev server. Debug builds keep cleartext everywhere, as React Native's debug manifest already allows, so the dev client reaches Metro on the LAN.
- **The native theme declares `@custom-variant sepia` itself.** Uniwind compiles the imported theme file on its own while it looks for dependencies, before it declares the variants for `extraThemes`, and Tailwind rejected the unknown variant.
- **The release APK grows from 63 MB to 88 MB with the bundled Quran data (about 20 MB of JSON as Hermes modules), loaded per surah.** Shipping it as raw assets instead could trim this; measured in Phase 9 with the other size and start-up budgets.
- **On the emulator, debug builds are too slow to judge the Quran screens:** Today's per-second updates and the lazily bundled data files saturate the JS thread. The screens were verified on release builds.
- **Web: Serwist (`@serwist/turbopack`) in production only.** It caches pages and scripts as they are visited (including in-app navigations), keeps every mushaf page font once fetched, and falls back to a small offline page in the page's language. Icons and the manifest come from the app icon.
- **The worker precaches only the shell (23 files, about 370 KB): styles, icons, illustrations and the offline pages.** By default it would have precached all of `public` and every script, 1,692 files and 223 MB including the 604 page fonts, on a first visit. Pages opened here stay in their own cache (300 pages, no expiry, unlike the default 32 for a day), and content-hashed scripts, where each surah's data lives, are kept cache-first. Empty-state pictures are served as they are (already 2x webp of about 13 KB), so the offline page shows the one the worker precached rather than an image-optimizer URL.

### Verification

- **The gate (SPEC 12).** The Quran text: sources pinned by SHA-256, a test that rebuilds all 6,236 ayahs byte for byte from the shown words, and CI failing on stale generated data. Audio sync: `playbackSpans`, `ayahAtTime` and `wordAtTime` are unit-tested (core stays at 100% coverage), and the highlighted word was watched against the recitation (al-Afasy) on web and on an Android release build. Offline: on Android, a downloaded surah plays with the network off, and a mushaf page and a surah opened before stay readable; on web, with the production server stopped, a surah, an ayah and a mushaf spread opened before load from the worker with their page fonts, and any other page shows the offline page in its language.
- **Web: Playwright flows (search to an ayah, a word's meaning, a bookmark, a mushaf page, a khatmah plan) pass at 1280 px and 360 px with the Phase 4 flow.** The screenshot run adds the Quran home, the verse view and a mushaf page in ar, en and fr, light and dark, at both sizes (reader routes as one viewport, not the full page).
- **Android release build on the emulator:** the Quran home, the verse reader, recitation with the word highlight, lock-screen controls, the mushaf with swipe paging, and downloads. The emulator reaches the web dev server for page fonts through `adb reverse tcp:3000 tcp:3000`. iOS waits for an EAS build on a device.

## Phase 5b · Quran depth (planned 2026-10-19)

- **The owner added Phase 5b before Phase 6:** reading views, the 1405H, 1441H and Indopak editions, tajweed, a reciter catalog with whole-reciter downloads, tafsir, range bookmarks, memorization tools and a recitation-check prototype. The plan and the exact QUL sources are in `docs/PHASE-5B.md`; SPEC 5.5, 9, 10, 12 and 13 now carry the scope. From the SPEC's later "Hifz mode", hiding words, repeating a range and the recitation check move into v1; memorization schedules stay later.
- **Tajweed in the verse views draws the 1441H (V4) color glyphs, not QUL's tagged tajweed text.** That text is quran.com's `text_uthmani_tajweed`, encoded differently from the King Fahd text we publish; one source keeps the mushaf and the verse views identical. The V4 fonts are COLRv0 with six palettes (tajweed on and off, light and dark), so the toggle and the theme pick a palette instead of recoloring text.
- **Indopak: the King Fahd Complex Nastaleeq 15-line layout (610 pages)**, from the same publisher as the other editions, over the Qudratullah and Taj Company layouts. QUL's Indopak resources are all in the South Asian script; none is labelled Naskh.
- **Reciters: surah-by-surah recitations with word timestamps only;** ayah-by-ayah sets would need a second playback model, so they wait.
- **Tafsir: Al-Mukhtasar, the one short tafsir QUL has in all three app languages.** Al-Muyassar stays optional until QUL's text is checked against the King Fahd print (its Al-Muzzammil entry reads like Al-Mukhtasar).

### Reading views and memorizing (built)

- **The scrolling reader has two layouts, verse by verse with translation or the Arabic text flowing; the view choice sits first in the reading settings, and the bar's button still turns between the mushaf and the scrolling reader.** The text layout breaks paragraphs where a mushaf page begins, with the page's number between them, so a memorizer keeps their bearings; on mobile the paragraphs also keep the list virtualized.
- **A hidden word keeps its exact place: on web a thin bar the word's width near the line's base (`memorizeBar` tokens); on mobile a soft tint behind the transparent word,** since React Native's nested text cannot carry a drawn bar. Full-height blocks were tried first on web and read as a wall of bricks.
- **On Android, a hidden word's color is the ink at zero alpha, not `transparent`:** React Native stores `transparent` as 0, reads it as no color, and the word fell back to the inherited ink.
- **A tap reveals a word; holding shows the whole ayah while held.** On web the reveal happens on click, not on pointer release, so that click never lands on the word just shown, and the end of a hold is heard on the window, because the peeked ayah replaces the element being held. On mobile the word keeps the same element while peeking, so its own press-out ends the peek.
- **What memorizing hides is a saved preference;** the reader bar's button is tinted while it is on, and the sheet can hide again what was revealed.

### Passages (built)

- **A bookmark can mark a passage, from its first ayah to a later one in the same surah** (`ayah_end`, a SQLite migration on mobile). Every view shows it: a colored edge beside verses, a tint behind ayah numbers in the text, a ribbon in the mushaf's margin. Changing the color of any ayah in it changes the passage.
- **Repeating a passage lives in @murshid/core (`playbackStep`), shared by both players:** each ayah N times, the passage M times, then stop; with a pause after each ayah as long as the ayah took (at the playback speed) for the listener to recite it back. A marked passage is offered as the passage to repeat; stepping outside it ends it.
- **An ayah's end missed between two looks at the clock is still honored, a moment late:** a busy JS thread on a phone easily skips the 120 ms window before an ayah ends, and the first version only looked at the ayah being heard.

### Editions and tajweed (built)

- **Each edition has its own page map.** The 1441H pages start where the 1421H ones do (their lines differ, and they share the 1421H glyph codes); 25 pages of the 1405H mushaf start elsewhere, and the Indopak one has 610 pages. The reading position keeps the ayah and its 1421H page, and a khatmah keeps its pace in 1421H pages; each edition finds its own page from them. A page's address is the chosen edition's page.
- **QUL's Indopak layout lists text lines only, and gets two lines wrong.** The build adds each surah's name and basmalah before the line that opens it (every page then has its 15 lines), and corrects two boundaries, asserting the error is still there so a fixed source fails loudly: page 304 line 3 repeated five words of line 2, and page 261 line 12 ran from Ibrahim into Al-Hijr. No word changes.
- **The Indopak page is set in one font and fits itself:** each page is drawn at the token's size, its widest line measured once the font is in, and the page set smaller only if that line passes 97% of the width (checked on all 610 pages at 430 px and in spreads).
- **Tajweed colors exist only in the 1441H fonts (COLRv0, six palettes).** On web, `@font-palette-values` rules declared per page font pick the palette for the theme and the toggle, and override the ink with the reader's ink; the ayah markers' printed ornaments (pink and teal rings) become an ink ring on the page's color, as in the other editions, so only the tajweed colors stand out.
- **On phones the 1441H pages keep the font's own colors:** React Native and React Native Skia (2.14) cannot pick a font palette, and rewriting the palette in a copy of each font waits for the font's terms (open item). So on a phone the 1441H edition comes with its colors, choosing one chooses the other, and in dark mode those pages sit on a light page, like paper.

### Reciters, timings and tafsir (built)

- **18 reciters:** the 5 from Phase 5 and 13 more from QUL, each with its style (murattal, mujawwad, or for learning). Four (al-Qatami, Fares Abbad, Muhammad Jibreel, Abdullah Basfar) have timestamps by ayah only, so the highlight follows the ayah.
- **Timing quirks are pinned in tests, not edited:** al-Minshawi's mujawwad recitation has no timestamps for 32:24 and jumps back 24 times (it repeats ayahs); Basfar and Jibreel end some surahs' last ayah at the listed length, rounded down and shorter than the file, so such a last ayah keeps its start and runs to the recording's real end once the player knows it (`withRecordingEnd`).
- **Tafsir: Al-Mukhtasar in Arabic, English and French, per surah, each passage with the ayahs it explains;** markup kept to `<b>` and `<i>`. QUL's Al-Muyassar file is left out: it mixes surah introductions into the passages.
- **For now, every reciter's timings, the tafsir and the Indopak words ship inside the apps,** rather than downloading on mobile as planned: there is no asset CDN yet, and bundled data works offline from the first launch. Moving the large files to downloads belongs with Phase 9's size budget.

### Tajweed in the verse views (built)

- **Both scrolling layouts draw each word with its 1441H glyph, in its page's font and palette, the same source as the mushaf.** Until a word's page fonts are in, it shows as published, so reading never waits. On web the fonts load as verses come within 600 px of the screen, so al-Baqarah fetches its 48 page fonts as it is scrolled, not at once. On mobile the list only mounts rows near the screen, so only their fonts load. Screen readers get the published text (the glyphs are hidden from them, the text kept beside them).
- **On phones, tajweed in the verse views needs a light or sepia page:** Android draws the fonts' own palette, whose ink is black, so on a dark page the verse views show the published text. Memorizing keeps the colors: Android applies a hidden word's zero-alpha ink to a color glyph too (only the color is the font's), as the 1441H page's centered lines showed. A hidden word standing alone on a justified line fades out entirely, and on the dark-mode paper page the hide marks take the paper's ink. iOS is checked on a device (EAS).
- **No tajweed legend yet.** Naming each color's rule needs rule names and explanations written in-house and reviewed (SPEC 10); it stays an open item rather than guessed.

### The rings around stopping vowels (1441H fonts)

- **Palette entry 14 of the 1441H fonts draws nothing but hairline rings and boxes around the last vowel of 3,073 words on 401 pages, words that carry a pause sign** (the vowel dropped when stopping there). We checked every layer on that entry: all are hollow outlines, never a letter, vowel or pause mark. As far as we can tell the printed mushaf has no such rings, and at reading sizes they look like stray boxes, so web makes that entry transparent in both palettes. The reviewer should confirm the print has no such marks.
- **Phones still draw the rings,** since they use the fonts' own palette. Removing them waits for the same palette-only font copy as the dark-mode colors (open item: the King Fahd Complex font terms).

### Testing with color fonts

- **Playwright runs full Chromium in its new headless mode (`channel: 'chromium'`).** Its old headless shell crashed the tab (a failed internal check) on pages drawing the 1441H color fonts, typically after one or two page loads. Chrome and Edge went through the same eight page loads without a crash, and so does full Chromium; a minimal page using the same fonts and palettes never crashed either.

### Recitation check (measured: not shipped)

- **A developer bench (`/dev/recitation-check`, absent from production) runs the model in the browser on a reciter's own recording of a passage**, with an option to cut one word out to stand in for a slip, and shows the marks, the transcript and the timings.
- **Measured on Al-Ikhlas recited by al-Afasy, a clean studio recording:**

  | Weights                 | Download | Correct words flagged | Cut word found  | Recognition (11.9 s of audio) |
  | ----------------------- | -------- | --------------------- | --------------- | ----------------------------- |
  | 4-bit (`q4`)            | 159 MB   | 6 of 15               | not run         | 29.3 s                        |
  | Full precision (`fp32`) | 397 MB   | 3 of 15               | yes, as skipped | 14.2 s                        |

  Timings come from WebAssembly in a desktop browser pane that was not on screen, so they only bound the order of magnitude.

- **No-go for now.** Even on the cleanest recording it can get, and at full precision, the model marks one correct word in five as different (here three words of ayah 3: يَلِدۡ وَلَمۡ يُولَدۡ). Telling a reader they slipped when they did not is the opposite of mercy over metrics, and 159 to 397 MB is too much to ask on first use. Since the accuracy already fails, the mid-range Android measurement was not run. Nothing reaches users. The alignment in core (`checkRecitation`, tested) and the bench stay for the next attempt.
- **Next attempt, in order:** align the audio against the expected words instead of transcribing freely (a CTC model's forced alignment gives each expected word a confidence); try a larger Quran-tuned model if its license is open; test on the owner's own recitation, with and without deliberate slips, and then on a mid-range Android phone.

### Whole reciters and storage (built, mobile)

- **A whole reciter downloads one surah after another, and the reciters asked for are kept across launches** (MMKV), so a download stopped by a lost connection or a closed app carries on when the app opens again. Surahs already on the phone are skipped. A surah cut short is deleted and fetched again, since each surah is one file. A failure stops the queue until the next launch or a tap on "Resume". Pausing takes the reciter out of the queue and keeps the surahs already in.
- **The storage screen (`/quran/storage`, from the reading settings) lists recitations by reciter and mushaf page fonts by edition, with their sizes.** Removing a whole reciter or an edition's fonts asks first, since fetching them again is hundreds of megabytes; a single surah is removed at once. Page fonts come back by themselves when a page is opened. The reading settings keep "Download for offline" for the surah being read, and add "Download all surahs" for the reciter chosen.
- **While a reciter downloads, the status names the surah under way and how far it is,** since al-Baqarah alone can take minutes and "1 of 114" looked stuck. The hint warns that a whole reciter is often a gigabyte or more: three surahs of Yasser ad-Dussary took 178 MB.
- **Web has no downloads screen:** the service worker keeps the pages, scripts and page fonts opened, and audio streams.

### Verification (Phase 5b)

- **Web: Playwright flows for the Arabic text view and memorizing, a passage and its repeat, and an edition with tajweed, the reciter search and a tafsir, at 1280 px and 360 px with the earlier flows (10 pass).** The screenshot run adds the 1441H page and the verse view in tajweed, the Indopak page and the text view memorizing, in ar and en, light, dark and sepia, at both sizes.
- **Android release build on the emulator:** the verse view in tajweed with the word highlight during recitation, its published text for screen readers, the plain text on a dark page, the 1441H page on paper in dark, hidden words on its justified and centered lines, the verse view in tajweed while memorizing with a word revealed in place, the reciter list, a tafsir, and a whole reciter's download: started, paused, carried on after the app was killed, and removed from the storage screen after its confirmation; a surah of a newly added reciter (as-Sudais) downloaded and played with the network off; tajweed on the sepia page. iOS waits for an EAS build on a device.
- **The APK is 122 MB** (88 MB after Phase 5), with every reciter's timings, the tafsir and the Indopak words inside; Phase 9 sets the budget.

## Phase 6 · Public web pages (2026-10-20)

The plan, the gate and the owner's part are in `docs/PHASE-6.md`.

### A light root

- **The root layout keeps only the document, fonts, theme script, skip link and service worker; the app's messages, Motion and toasts move to the layouts of the app's own routes (`AppProviders`).** Before, every page paid 210 KB gzipped for them, and `/en/quran/2` shipped 604 KB. Public routes now load 143–147 KB. Alt: keep one provider tree and trim it; Motion and the messages alone were over budget.
- **One recitation still plays across every page: its player and bar live at the root and load on the first play** (`recitation-store.ts` is a small store; `RecitationHost` imports the player and its messages lazily). Alt: a player per page, which would stop when the reader moves between surahs.
- **Public pages never send a visitor to onboarding.** The Quran tab no longer asks for setup (it needs no place), and the public routes moved out of the `(app)` group into `(public)` with a server-rendered site shell. The redirect had made the surah pages `noindex` for search engines (SEO 60).

### Surah pages: sent whole, then handed to the reader

- **`/quran/[surah]` sends the whole surah as HTML, in the default view of the address's language, with the same markup and classes as the client reader** (`reader-markup.ts` and CSS utilities shared by both). Ayahs come in groups of 12, each its own Suspense boundary so hydration is chunked, and use `content-visibility: auto`. Alt: a client reader with a server-rendered first screen; search engines and slow phones would see only part of the text.
- **The full reader takes over on the first touch (a word, an ayah's actions, the bar), replaying that touch, and at once for someone who has finished onboarding,** whose settings may ask for another view. An end-to-end test checks that no word moves when it does. Alt: hydrate the full reader on every visit, which cost Performance 32.
- **The first group of ayahs is sent in place, outside any Suspense boundary.** Once a page's HTML is large, React streams each later boundary after the rest of the page and reveals it with a script, so the ayahs on screen would have appeared last. The same splitting on the prayer-time pages moved their content as it was revealed (CLS 0.18) without saving measurable blocking time, so those pages have no boundaries.
- **The Hafs font is served from a fixed address (`/fonts/hafs/UthmanicHafs_V22.woff2`, cached as immutable) and preloaded on the Quran's public pages only.** With `next/font` it was preloaded on every page and its hashed address could not be named in a preload. Readex Pro and Amiri are no longer preloaded (they are not in the first paint of the public pages).
- **The Quran's public pages keep their reading column hidden until the Hafs font is ready, 3 s at most, and show it a frame after the text takes the font.** The text is invisible until then anyway (`block`) but laid out in a fallback that wraps differently, so what follows it moved when the font arrived: CLS 0.065 on the ayah page on CI's Linux runner, 0.016 on al-Baqarah here with the font held back 1.5 s, and 0 for both with this change. A small script in the public Quran layout sets the attribute; without JavaScript nothing is hidden. Alt: reserve the text's height, which depends on the screen's width.
- **Surah names in calligraphy are drawn from outlines shaped at build time** (`surah-names/<n>.json`, HarfBuzz over the pinned surah-name font), instead of loading the 212 KB font to draw one word. The font itself is read, never changed; a content test checks all 114.

### Ayah pages

- **`/quran/[surah]/[ayah]` becomes the ayah's own page: the published text, the translation, each word with its meaning and sound, the short tafsir, its neighbours, Listen, and "Read from here".** The reader now opens at an ayah with an anchor (`/quran/2#ayah-255`), so the two do not compete for one address; the mobile app keeps `/quran/2/255` as its deep link into the reader. Al-Fatihah's ayahs are prerendered; the other 6,229 render on their first visit and are kept.
- **Its description is the translation itself when it fits (200 characters), else a sentence naming the surah and the ayah.** Never a cut-off translation.

### Prayer-time pages

- **The 31,766 bundled GeoNames cities (15,000 people or more) get stable English slugs in every language** (accents removed; namesakes in one country take their region). Country names come from `Intl.DisplayNames`. Every country page and the 100 largest cities are prerendered; the rest render on their first visit. Alt: localized slugs, which would split each city's links three ways.
- **A city's day is cached until its local midnight, an hour at most, and the countdown to the next prayer runs in the visitor's browser.** With Next's `hours` profile, a rarely visited city could have shown yesterday's date for up to a day.
- **A city that does not exist gets the not-found page with `noindex`, served with status 200.** With Cache Components the page's shell is already streaming when the city is looked up. Search engines treat it as a soft 404, which is enough. Alt: check the city in a proxy before rendering, which costs a function call on every visit.
- **"Use this city" writes the place, and the country's method unless the person chose one, to this browser's settings, then opens Today, or onboarding's place step on a first visit.** The page itself always shows the country's usual method and says so.

### Search

- **Absolute addresses come from `NEXT_PUBLIC_SITE_URL`, else Vercel's production address.** Every public page has a canonical address, `hreflang` for ar, en and fr (Arabic as x-default), Open Graph and Twitter tags, and JSON-LD: a `Chapter` for a surah, a `Quotation` for an ayah, a `WebPage` about a `City`, and breadcrumbs. Search console verification tags come from environment variables, so no account's token is in the repository.
- **`robots.txt` keeps crawlers out of `/dev`, `/welcome`, `/you`, `/offline` and the worker; a sitemap index lists the Quran (19,050 addresses) and the places in files of at most 45,000.** Each address names its other languages.

### Share images

- **Share images are drawn as SVG with every line shaped by HarfBuzz (`harfbuzzjs`, MIT) and then turned into a PNG by `next/og`.** Satori, which `next/og` uses, neither joins Arabic letters nor orders right-to-left lines. `lib/og/text.ts` splits each line into runs by script with a simplified bidi algorithm. Interface text uses Readex Pro's subsets, read from its WOFF files; Quran text is shaped whole with the pinned Hafs font, marks and number included. Alt: images drawn at build time, 6,350 Quran pages and 31,766 cities in three languages.
- **An ayah's image shows its published text when it fits on four lines (52, 44 or 38 px), else the surah's calligraphy and the reference.** The text is never cut short.
- **`harfbuzzjs` stays outside the server bundle (`serverExternalPackages`) and the fonts and its WebAssembly travel with the image routes (`outputFileTracingIncludes`).** Bundling it moved the WebAssembly file out of reach.

### Budgets

- **Public pages link with plain `<a>`, not `next/link`.** Each `Link` is a client component that hydrates with its own hooks, and a country can list over a thousand cities; between cached public pages a full load is quick. Scripts went from 148–151 KB to 141–144 KB.
- **The service worker precaches no fonts from `public/fonts` and no scripts.** The Phase 5b editions had added hundreds of page fonts to its install, which competed with a first visit's own downloads. The favicon went from 68 KB to 2 KB (48 px).
- **Lighthouse CI (`@lhci/cli`, Apache-2.0) runs on every pull request on six public pages, mobile, median of three runs (`apps/web/lighthouserc.json`).** It fails on Accessibility or SEO under 100, CLS over 0.05, scripts over 150 KB, or Performance under 80, and warns when LCP passes 2 s or Total Blocking Time 200 ms. Total Blocking Time stands in for INP, which a lab run cannot measure. The timings move with the runner's CPU, so the gate's Performance 95 is measured on the deployed site (PageSpeed Insights) rather than failing every pull request. Alt: fail below 95 in CI, which would block every change on a shared runner's noise.
- **Measured on CI's runner (the first Phase 6 run, median of three):** the prayer-time pages score 0.97–0.98 with TBT around 90 ms, the Quran pages 0.86–0.93; LCP 2.3–2.6 s on the prayer-time pages and 3.2–3.9 s on the Quran pages.
- **Measured locally (production build, Lighthouse 12 in LHCI, simulated slow 4G, median of three):** the prayer-time pages score 0.92–0.93 (LCP 2.6–2.8 s, TBT 156–247 ms), the Quran pages 0.79–0.87 (LCP 3.3–4.2 s). Accessibility, SEO and Best Practices are 100 and CLS at most 0.025 on all six. Unthrottled in Chromium, the same pages paint in 140–300 ms. The simulated LCP is mostly bytes on a 1.6 Mbps link: about 141 KB of framework scripts, the interface fonts, and on Quran pages the 107 KB Hafs font, which keeps `font-display: block` so Quran text never shows in another font.

### Hosting

- **The site runs on Netlify's free plan (the owner's Vercel account is paused), from `main`.** Netlify builds from the repository root with `pnpm --filter @murshid/web build` rather than through Turborepo, which hides undeclared environment variables from the build; package directory `apps/web`; `NEXT_PUBLIC_SITE_URL` set to the site's address. Its Next.js runtime (OpenNext) handles Cache Components, the share images and the sitemaps as they are.
- **On Netlify a page rendered on request may not read the address or its params outside Suspense: it answers 500, where `next start` renders it anyway.** The first deploy failed every city and ayah page not prerendered. The recitation host now sits in Suspense, and the public routes with params set `instant = false`, as the reader routes did before Phase 6 moved them.
- **Netlify serves `public/` without next.config's headers, so `apps/web/netlify.toml` gives the Hafs font its long cache.**
- **The free plan's 300 credits a month are a hard cap: past it, the whole site pauses until the next month.** Each production deploy and every gigabyte served draws on them, which is why the 450 MB of mushaf page fonts need their own host.
- **The mushaf page fonts are served by a Cloudflare Worker with static assets (`al-murshid-assets`, free plan), and the web app reads them from `NEXT_PUBLIC_ASSET_BASE_URL`.** All three editions, 1,812 files and 470 MB, uploaded unchanged after each was checked against its pinned SHA-256, with `Access-Control-Allow-Origin: *` and a year's immutable cache from a `_headers` file. Static assets on Workers cost no requests or bandwidth on the free plan, unlike Netlify's credits. Alt: GitHub Pages (1 GB site limit, about 100 GB a month), or R2 (needs a payment method on file even for its free tier).
- **The service worker keeps the page fonts of all three editions, from the site or the font host.** It matched only the 1421H edition's path on this site before.
- **On Netlify the service worker is a static file, written after `next build` by running Serwist's route handler once with the route's own options (`scripts/static-sw.mjs`, `src/app/serwist/options.mjs`), with its `Service-Worker-Allowed: /` header in `netlify.toml`.** Netlify's build does not prerender `/serwist/sw.js`, and its server function cannot bundle the worker at request time (no esbuild, source or build files there), so it answered 500 and the live site had no offline support. `next start` still serves the prerendered route.
- **The theme script removes Netlify's HTML comment and the bare line breaks around it from `<head>` before React hydrates.** Netlify inserts the comment after the charset on every page, with no setting to turn it off, and React failed to hydrate on its extra text nodes (error 418; Best Practices 96). React renders no comment or bare text in `<head>`. The "Powered by Netlify" badge, a script after `</html>`, is switched off in the project's settings.
- **PageSpeed Insights on the live site (mobile, 2026-10-21):** Performance 95 on al-Ikhlas (LCP 2.9 s), 99 on Ayat al-Kursi's page (LCP 1.7 s), 100 on Tunis (LCP 1.2 s), and 78 on al-Baqarah (LCP 4.2 s: the longest surah's text is the page); Accessibility and SEO 100 on all four.
- **Google Search Console and Bing Webmaster Tools verify the site by meta tag (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION` on Netlify), and both have `/sitemap.xml` (2026-10-21).** Google's property is a URL prefix (`https://al-murshid-pro.netlify.app/`): a Domain property needs DNS, which a `netlify.app` address does not give. Bing's site was added by hand rather than imported from Google, so no account grants the other access. Both found the tags on `/ar`, where `/` redirects.
- **Netlify skips a build when a push changes nothing the site is built from (`ignore` in `netlify.toml`).** Each production build costs free-plan credits, and docs-only commits went through a full build.
- **On Netlify, Turbopack builds without its filesystem cache (`turbopackFileSystemCacheForBuild` off when `NETLIFY=true`; 2026-10-22).** Netlify restores `.next/cache` before every build, and Turbopack's cache in it grew with each one until loading it ran the build machine out of memory (exit 137): the tasbih and widget deploys failed while compiling, and the site stayed on the night-reflection deploy. A deploy retried without the cache published in 4 minutes. Local and CI builds keep the cache.
- **Long surahs stay whole on their public page and may score below Performance 95 (the owner's decision, 2026-10-21).** Al-Baqarah measures 78 (LCP 4.2 s on PageSpeed Insights) because all 286 ayahs come in its HTML. Alt: send the first part and load the rest as the reader scrolls, which search engines would see less of.

### Adhkar and duas

- **No adhkar or dua pages yet, and no placeholders.** They need a named source with references, translations licensed for English and French, and a reviewer (SPEC 10). IslamHouse's Hisn al-Muslim is the one source found with all three languages under usable terms; the owner asks for written permission (`docs/PHASE-6.md`).

### Verification (Phase 6)

- **Web, production build: 58 Playwright tests pass at 1280 px and 360 px.** New: a visitor goes from the countries to Tunis and takes the city into onboarding; canonical, `hreflang`, JSON-LD, share images, `noindex` on an unknown city; robots and sitemaps; a surah sent whole and taken over without anything moving; an ayah's page and reading on from it. The screenshot run adds the public pages in ar, en and fr, light and dark.
- **Share images checked by eye:** a surah's calligraphy, Ayat al-Kursi whole on three lines with its number, al-Fatihah 1 in Arabic, a city's times in Arabic, and a page of links in French.
- **Not done here:** the deployment, search console indexing and PageSpeed Insights on the deployed site, which are the owner's steps (`docs/PHASE-6.md`); and the adhkar and dua pages.

## Phase 7 · Remember, You and seasons (started 2026-10-21)

The plan, the gate and what waits for content are in `docs/PHASE-7.md`.

- **Phase 7 starts with Phase 6's gate open on one item: pages showing as indexed in a search console** (the owner's decision). The site is deployed, verified in Google Search Console and Bing Webmaster Tools, and its sitemaps are submitted; indexing takes days to weeks and nothing in the code changes it. SPEC 12 says never to start a phase with the previous gate open; this is the one exception, recorded here.
- **Every religious text waits for reviewed content, including the tasbih phrases, the Laylat al-Qadr du'a and the takbir.** SPEC 10 asks each item for a source reference and a reviewer's sign-off, so Phase 7 builds what needs none first: Your Sky, the Journey, seasonal modes, night reflection, the tasbih counter and widgets. Nothing stands in for the missing texts.

### Your Sky and the Journey (built)

- **Your Sky shows Hijri months, like the calendar (SPEC 5.4), with the same ±2 day offset mapping each Hijri day to the day its prayers were logged** (`skyMonth` in core). Alt: Gregorian months, which would make the app's two month views disagree.
- **Each day is a small night sky in both themes; its lantern glow grows with the prayers logged (one light to five), and a day without prayers stays plain night.** Days still to come show only their number, with no sky. Tapping a day opens its own sky with the lights where Today's hero places them, and the names of the prayers they are for; nothing names the others. Counts appear only with "Show details", a setting kept with the others (`showSkyDetails`).
- **You opens on Your Sky and the Journey; the settings follow on the same screen.** The Journey shows each track's step, "Change focus" (a sheet of the track's steps; the first prayer step then asks which prayer) and "Step back" (absent on a track's first step). Quran and remembrance can be started and set aside ("Not now"); the prayer track always holds a step.

### Seasonal modes and Today's cards (built)

- **Ramadan follows the Hijri date with the person's offset, and its day begins at Maghrib** (`ramadanState` in core). From Maghrib the hero and the card look at tomorrow's fast: suhoor counts down to its Fajr, and the card's title, juz and "last ten nights" follow it. During the day the hero counts down to iftar at Maghrib. The last ten nights begin at Maghrib on the 20th. After the last iftar there is no fast ahead, but the day's fast can still be logged that evening.
- **When the prayer's own countdown ends at the same moment (Asr until Maghrib, Isha until Fajr), Ramadan's words take its line** ("Suhoor ends in 8:12") rather than showing the same number twice.
- **The day's juz is the day of the fast (juz 1 on the first day), up to 30**, and opens in the person's reading view and edition.
- **Fasting and Taraweeh are one row per date, kept on the device** (Dexie `ramadanLogs` on web, SQLite `ramadan_logs` on mobile), synced in Phase 8 as SPEC 9's fasting logs. "Fasted" and "Not today" are two buttons; pressing the chosen one again clears it. Taraweeh belongs to the evening it is prayed: it can be logged from Isha until Fajr, under the date the night began. Nothing asks why, and nothing counts days.
- **Ramadan's night sky keeps the night's deep blue above and puts a lantern glow on the horizon** (`ramadanNight`, `#0B1020` to `#3A2A1E`). Days are unchanged. The glass over it is held to the same 4.5:1 contrast test as every other sky stop.
- **Ramadan mode is on by default and can be turned off in You (Seasons).** Off, Today shows no countdowns, card or palette for Ramadan.
- **One card at most, in this order: Welcome back, Ramadan, Jumu'ah, the first ten days of Dhul Hijjah, then the adhkar windows and the step offer** (SPEC 5.1). Each seasonal card can be hidden for the day.
- **Jumu'ah runs from Thursday's Maghrib to Friday's Maghrib.** Its card opens Surah Al-Kahf and carries the salawat reminder as one line of interface text ("many blessings upon the Prophet ﷺ"), not a formula of salawat, which waits for reviewed content.
- **Dhul Hijjah notes its first nine days; on the eighth it says the Day of Arafah is tomorrow, "a day many fast", and on the ninth that it is today.** The wording reminds without ruling (SPEC 4). The takbir card and the Laylat al-Qadr du'a wait for reviewed content (see above); nothing stands in for them.
- **Verified with simulated dates:** 20 Playwright tests (1280 px and 360 px) on the first day and night of Ramadan 1448, the 21st night, mode off, a Thursday evening and the eve of Arafah; on Android, the emulator's clock set to the same moments, in ar and en, light and dark, with fasting and Taraweeh kept across a relaunch. The whole web suite, 90 tests, passes on a production build.

### Night reflection and privacy (built)

- **A reflection belongs to an evening: from Fajr it is today's, and before Fajr it is still the night that began the day before** (`reflectionNight` in core). The form in You always edits that evening's reflection, so it can be written at any hour; earlier evenings are read and deleted, not edited.
- **Today invites a reflection from Isha until Fajr, as the last of its cards, after the step offer** (SPEC 5.1 does not rank it). The invitation is on by default and turns off in You ("Invite me after Isha"). "Not tonight" sets that evening aside, past midnight too; a written evening is settled the same way. Ramadan's and Jumu'ah's cards hold the place on their nights.
- **Three fields, as SPEC 5.7 says: a gratitude, an intention for tomorrow and a free note, each up to 1,000 characters.** Saving with nothing written removes the evening's reflection. Nothing counts nights or reflections.
- **Reflections are sealed with AES-256-GCM, with the evening's date as additional data so rows cannot be swapped.** On web the key is a non-extractable WebCrypto key kept in IndexedDB: the page can use it, nothing can read it out. On mobile expo-crypto (MIT, part of Expo) seals with a key made on the phone and kept in expo-secure-store (Android Keystore, iOS Keychain with "this device only"), which Android's backup leaves out: a backed-up database holds only ciphertext. Alt: SQLCipher for the whole database (more native setup than three fields need), or MMKV's encryption (AES-CFB, no integrity check).
- **A reflection whose key is gone (site data cleared, phone restored) shows as one that cannot be opened, and can still be deleted.** The app never guesses or recovers it.
- **The app lock is on mobile only, for the whole You tab, and off by default** (expo-local-authentication, MIT). It asks for the fingerprint, face or passcode when You opens and again after the app has been in the background. Turning it on asks once first, so it is never set on a phone that cannot open it; with no screen lock set up, the switch stays off and says why. The choice is kept in secure storage (SPEC 9). Leaving the app for the share sheet counts as leaving, so You asks again on return. Web has no lock: a browser's own profile is its lock.
- **Export writes one JSON file of everything on the device (`al-murshid-<date>.json`, format version 1):** settings, prayer logs, Ramadan logs, bookmarks, the reading position, the khatmah plan and the reflections, opened. Tombstones kept for a later sync are left out. Web downloads it; mobile writes it to the cache and opens the share sheet (expo-sharing, MIT).
- **"Delete everything on this device" asks once, in a sheet, then deletes the database (with the reflections' key), every stored setting, the app lock and the scheduled reminders, and starts again at onboarding.** Downloaded recitations and cached Quran files stay: they are content, not the person's data, and the confirmation says so. With no accounts yet there is nothing in the cloud; Phase 8 adds the account's deletion.
- **Verified:** 20 Playwright tests (1280 px and 360 px): the invitation after Isha and "Not tonight" past midnight, a reflection written, read back and stored with no readable text in IndexedDB, earlier nights read and deleted, the exported file, and delete everything back to onboarding; screenshots in ar and en, light and dark. On Android: the invitation, a reflection kept across a relaunch with no plaintext in the database files, the lock on and off with a test PIN (asked again after the app returns), the shared export file, and delete everything back to onboarding. The whole web suite, 110 tests, passes on a production build.

### Tasbih (built)

- **Remember shows only what exists: a Tasbih card, and one line saying the adhkar, duas and the 99 Names come once their texts are reviewed.** The "coming soon" placeholder and its strings are gone from both apps.
- **Tasbih counts on its own until the reviewed phrases arrive; there is no phrase picker and no phrase on screen.** Its totals are kept under the phrase "free" (SPEC 9's `tasbih_daily` key), so the picker can add phrases later without moving anything.
- **The whole area counts: on mobile the screen below the top bar, on web the page's main area (the tab bar stays), by pointer or by Space and Enter.** The tasbih is its own screen: a full-screen route on mobile like Qibla, `/remember/tasbih` on web.
- **A target completes a round: the ring fills, "Target reached" is shown and announced, and the next tap starts the next round at 1.** The targets are 33 (the default), 99, 100, a custom one up to 9,999, or none. The count on screen is kept between visits until reset; reset can be undone from its toast.
- **The bead ring has one bead per count for targets up to 100, else 33 beads going round; it is never mirrored, like the progress ring.** The newest bead settles with the snappy spring (SPEC 6.4), and the count rolls digit by digit.
- **The day's total is the sum of every tap that day, whatever the count on screen, kept per calendar day at the person's place.** It shows quietly under the counter and on Remember's card, and goes into the export; delete everything removes it.
- **One setting turns every haptic off (SPEC 6.5), on mobile in Appearance.** Every haptic in the app now goes through one helper that reads it. Tasbih gives a light selection per tap and success at the target; web has none.
- **The screen stays awake while the tasbih is open:** expo-keep-awake on mobile (already part of Expo's native build), the Screen Wake Lock API on web, asked again when the tab returns.
- **The optional tasbih click (SPEC 6.5, off by default) is left for later: it needs a sound of its own, recorded or licensed.** The after-prayer tasbih step of the Journey waits for the phrases, since it is a specific dhikr.
- **Each tap counts from the stored count, not the one on screen.** On a busy phone a second tap can come before the screen has re-rendered, and counting from the rendered value lost taps (12 taps showed 7 on the emulator).
- **Rolling digits leave quickly (`quick`, ease-exit) while the new digit springs in, in every counter.** With the full spring for both, fast tasbih taps piled several digits on top of each other.
- **Verified:** 14 Playwright tests (1280 px and 360 px): Remember to the tasbih, counting by pointer and keyboard, a completed round announced, the count and the day's total after a reload, reset undone, no target and a custom one; screenshots in ar and en, light and dark. On Android (ar, light and dark): Remember and the tasbih, taps counted one for one, the completed round, the haptics switch, and the screen kept on (`KEEP_SCREEN_ON`). The whole web suite, 124 tests, passes on a production build.

### Widgets (built)

- **The Android widgets are written natively in a local Expo module (`apps/mobile/modules/prayer-widget`, Kotlin and Android layouts), not with `react-native-android-widget` as SPEC 8 names.** That library draws each widget as one image from JavaScript, and Expo's Android widgets support a single snapshot, so neither can keep a countdown right without starting JavaScript every minute. The native widget redraws itself each minute with an alarm that is not a wake-up one: while the phone sleeps nothing runs, and the first look at the screen brings it up to date. It draws only what the app wrote, so it costs a few milliseconds and no JavaScript. Without the exact-alarm permission Android may deliver the minute up to about half a minute late.
- **The app writes the coming week for the widgets** (`lib/widget-data.ts`): every prayer's name and time already in the person's language and digits (Jumu'ah on Friday), the minute labels with their plurals, and the sky every half hour from the sun's position, with Ramadan's lantern-lit nights. A widget only finds the entry for "now", offline and in the app's language. The app writes it at launch, on each return, when the language or a setting that moves the prayer times changes, and from the twice-daily background task; "Delete everything" clears it, and the widgets then ask to open the app.
- **Two Android widgets: "Next prayer" (2 x 2) and "Prayer times" (4 x 2, with the day's five prayers and the next one in the lantern color).** The countdown reads like the app's ("in 2:46", then "in 45 minutes"), rounded up to the minute; the screen reader hears the whole line. They follow the app's direction, use the system font (Android widgets cannot load the app's fonts), and open the app on a tap. The picker shows a sample evening in the device's language; the widgets' own words come from packages/i18n through the app.
- **iOS uses Expo's widgets (`expo-widgets` and `@expo/ui`, both part of Expo): small and medium on the home screen, rectangular and inline on the lock screen, one widget with four families.** The app writes a timeline for the next two days, an entry at each prayer and each half hour of the sky, and SwiftUI's timer keeps the countdown running between entries. Both packages are left out of the Android build (`expo.autolinking.android.exclude`). The gallery's name and description come from the app config, so they are in English only; the widget's words follow the app's language, its layout direction the phone's.
- **Not verified on iOS:** the iOS project cannot be generated on Windows. The app config with the widget plugin was checked (`expo config --type introspect`: the extension target and the app group `group.com.malekverse.almurshid`), and the code typechecks; the widgets need an EAS build on a device, which is the gate item for this step (`docs/PHASE-7.md`).
- **iOS is built and checked without a Mac or a paid account (2026-10-23): the `iOS build` workflow runs on GitHub's macOS machines, free for this public repository.** One job runs the app in the iOS Simulator with Maestro (open source; SPEC 8 names it for mobile flows): onboarding by city, Today, the Quran, Remember and the tasbih, You and its privacy section, in Arabic and English, light and dark, then the Face ID lock with a simulated face. The other makes an unsigned Release .ipa; the first build of the iOS app ever passed on its first run (29 minutes) with the widget extension inside. A phone installs it only once Apple signs it: Sideloadly with a free Apple ID (Apple refused the sign-in on the first try, error -80046) or an EAS build with the Apple Developer membership, needed for TestFlight and the App Store anyway (the owner's decision, for Phase 9). Widgets cannot be placed on a simulated home screen by a script, so they wait for a phone.
- **Verified on Android (emulator, Arabic):** both widgets in the picker with a sample evening, placed on the home screen; the next prayer, its time and "in 2:46" in Dhuhr's sky, right to left, the day's five prayers with the next one highlighted, the countdown moving on with the minute and after the app was reinstalled, the screen reader's line, and a tap opening the app. Core's widget prayers are unit-tested; the whole web suite (124 tests) and every check pass.

## Plan v3 · after studying Ameen (2026-10-23)

The owner asked for a plan that matches Ameen's breadth and identity and goes further, with a Fajr
alarm that only stops once the person is awake. Teardown: `docs/COMPETITION.md`; SPEC v3.

- **Four tabs stay; Ameen's Player and Services become a mini player and a Tools hub.** Principles 1 and 2 (organized by time, one obvious action) hold with four destinations; the hub lets people pin their own tools to Today, which is what Ameen's arranged grid gives them. Alt: a fifth tab.
- **Quiet Light stays (the living sky and one lantern light); we match Ameen's polish, not its green.** SPEC 6 rules out green-and-gold, and the sky is already ours alone. The brand moves from Phase 9 to Phase 7c (mark, icons, illustrations, landing page, store screenshots), since the app still uses a temporary icon. Alt: a new palette.
- **Fajr Rise is Phase 7b, before accounts and sync.** It is the clearest reason to choose us over Ameen, which has no such alarm, and its native work (AlarmKit, Android alarms) belongs before launch hardening. Identity follows as 7c so the landing page and the store screenshots can show it. Alt: after launch.
- **Its camera only confirms the person is up: a code they placed away from the bed, or squats; never a prayer mat, wudu or a mosque.** SPEC 13's cut on camera check-ins for worship stands (one Fajr alarm scans prayer mats). Frames stay in memory. Alt: a photo of the prayer place.
- **An escape is always on screen (hold 10 seconds), and nothing records how a morning went.** Safety first (illness, a baby, an emergency) and mercy over metrics; some Fajr alarms have no way out at all. Alt: no escape, or a morning log.
- **Backup alarms every two minutes, cancelled only by finishing the challenge, instead of reacting to dismissals.** AlarmKit's stop button is always there, and developers report that its stop intent does not fire on every path; the chain works the same on both platforms whatever they report. Alt: re-ringing on a dismissal callback.
- **Before iOS 26: notifications, with an honest note; no critical alerts.** Apple grants critical alerts to health and safety apps only. Alt: requiring iOS 26 for the whole feature.
- **Mind is sums and a star-memory game, never questions about religion; Aloud only checks that a voice is heard while the dua for waking is on screen.** The cut on quiz games stays, and nothing judges how anyone reads a dua. Aloud waits for the reviewed dua. Alt: typing adhkar (a chore), recognizing the words (unreliable, and a judgment).
- **No fatwa search, by AI or over fatwa collections (now on the cut list).** The app does not issue or relay rulings (SPEC 10), and rulings differ by school and country, and one given in one school can mislead a reader who follows another. Search by meaning returns only referenced verses, adhkar and duas (Phase 11). Alt: Ameen's AI fatwa search.
- **Search by meaning runs on the phone.** Embeddings of our own reviewed texts are built in advance and the query never leaves the device, so it stays private and free. Alt: a server with a hosted model (cost, privacy).
- **Reciter portraits only with permission; live Makkah, Madinah and radio only as audio streams the broadcaster permits, without trackers.** An embedded video player would bring a third party's trackers (principle 5). Alt: embedding YouTube streams.
- **The landing page is `/[locale]/about`, a Server Component page; the app keeps `/[locale]`.** Whether a visitor has onboarded is only known in the browser, so the landing page and Today cannot share one address and stay fast. Alt: the landing page at `/[locale]` with the app moved.
- **Masjids come from OpenStreetMap.** Free, with ODbL attribution; Google Places is paid past its free tier and sends every search to Google. Alt: Google Places.
- **Reviewed content is a track alongside every phase, and finding the reviewer is now the most urgent item.** Ameen's lead today is mostly content (adhkar, duas, daily hadith), and launch is blocked without sign-off. Alt: waiting for Phase 9.
