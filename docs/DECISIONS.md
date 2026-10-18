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
