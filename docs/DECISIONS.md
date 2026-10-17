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

- **Arabic-Indic digits don't appear on Android.** `ar-US-u-nu-arab` still formats `48` as Western digits in Hermes, while Node and Chrome honor it. Phase 3 (core) verifies Intl on each engine, as SPEC 7 asks, and falls back to a tested digit mapping if needed.
- **Native glass has no blur yet, and the native sky uses React Native's gradient style.** Phase 2 moves both to Skia and expo-blur / expo-glass-effect.
- **iOS is unverified** (no Mac). The first EAS development build covers it.
