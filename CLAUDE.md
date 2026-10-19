# Al-Murshid

Read docs/SPEC.md before any task. It is the source of truth and overrides generic skill advice.

- Arabic first: build and review every screen in RTL first, then en and fr.
- Tokens only: no hard-coded colors, spacing, font sizes, radii or durations.
- Never generate, translate or edit religious text. Use packages/content only.
- After any UI change: screenshot web (Playwright) and run iOS + Android simulators,
  in ar and en, light and dark. Apply the polish checklist (SPEC section 11).
- One phase at a time (SPEC section 12). Don't stop to ask: when the spec is silent, decide creatively in its spirit.
- Free tools only: open-source libraries and free tiers; no paid plans or add-ons.
- Log non-obvious decisions in docs/DECISIONS.md.

## Working here

- Dev machine is Windows: there is no iOS simulator. Verify on web and the Android emulator
  (`Medium_Phone` AVD); iOS is checked through EAS builds on a device.
- Android builds need JDK 17+: use Android Studio's bundled JBR (`JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"`).
- The repo stays in OneDrive, so paths are long: keep pnpm's `nodeLinker: hoisted` and the
  `with-short-native-build-paths` config plugin (C++ builds go to `%LOCALAPPDATA%\murshid-cxx`).
  Stop Metro, Gradle (`./gradlew --stop`) and dev servers before reinstalling, or Windows file locks block it.
- Run the app on Android: start the `Medium_Phone` emulator, then `pnpm --filter @murshid/mobile android`.
- Reanimated shared values: use `.get()` and `.set()`, never `.value =` (the React Compiler lint rejects it).
- Hermes needs the FormatJS polyfills in `apps/mobile/src/lib/intl-polyfills.ts` (plurals, digits, times).
- Measure performance on a release build (`./gradlew app:assembleRelease`); debug builds run unoptimized
  native code and dev-mode JS, and are roughly ten times slower. For the emulator, build only its ABI
  (`-PreactNativeArchitectures=x86_64 --max-workers=3`) and run `./gradlew --stop` afterwards, or the
  daemon starves the emulator into ANRs. If `createBundleReleaseJsAndAssets` fails with `0xC0000005`
  after "Done writing bundle output", node crashed on exit: rerun the build.
- Web flows and screenshots: `pnpm --filter @murshid/web e2e` (Playwright, reuses the dev server on 3000;
  screenshots land in `apps/web/e2e/.screens`). Pass dates with `page.clock.setSystemTime` so animations still run.
- Mobile reminders: `/dev/reminders` rings a test notification in 5 s. Background tasks (a notification
  action with the app closed) only run reliably in release builds, not in the dev client.
- If the dev client cannot reach Metro after an adb restart: `adb reverse tcp:8081 tcp:8081`.
- Quran data: `packages/content/quran/generated` is built from the pinned sources by
  `pnpm --filter @murshid/content quran` (CI runs `pnpm content:check`). The 604 mushaf page fonts are not in
  git: install them with `pnpm --filter @murshid/content fonts:v2 <unzipped QUL folder>` (web serves them from
  `public/fonts/quran-v2`; the emulator reaches the web dev server with `adb reverse tcp:3000 tcp:3000`).
- If the debug app is killed at launch ("failed to complete startup"), compile it ahead of time:
  `adb shell cmd package compile -m speed -f com.malekverse.almurshid`. Judge the Quran screens on a release
  build: in debug, Today's per-second updates starve the emulator's JS thread.
- Commands run from the repo root through Turborepo: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- Design tokens live in `packages/tokens`; run `pnpm --filter @murshid/tokens build` after editing them
  (it regenerates `theme.css` for both apps).
- Strings live in `packages/i18n/messages/<locale>/<namespace>.json`; `pnpm i18n:check` must pass.
