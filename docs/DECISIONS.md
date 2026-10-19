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
