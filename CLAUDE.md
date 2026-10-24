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
  (`Medium_Phone` AVD). iOS: the `iOS build` workflow (GitHub Actions, macOS, free for this public
  repo) runs on pushes touching the app: it runs the app in the iOS Simulator with the Maestro flows in
  `apps/mobile/.maestro` (screenshots in the `ios-simulator-screens` artifact) and builds an unsigned
  Release .ipa. A phone only installs it once Apple signs it: Sideloadly with an Apple ID (free, 7 days)
  or an EAS build with the paid Apple Developer membership.
- Android builds need JDK 17+: use Android Studio's bundled JBR (`JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"`),
  and `ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"` (there is no local.properties, so Gradle cannot find the SDK otherwise).
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
  It runs full Chromium (`channel: 'chromium'`): the old headless shell crashes on the 1441H color fonts.
- Recitation check bench (web, dev only): `/en/dev/recitation-check` downloads the model from Hugging Face
  (159 MB at 4 bits, 397 MB at full precision) and checks a reciter's recording against the published words.
- Mobile reminders: `/dev/reminders` rings a test notification in 5 s. Background tasks (a notification
  action with the app closed) only run reliably in release builds, not in the dev client.
- If the dev client cannot reach Metro after an adb restart: `adb reverse tcp:8081 tcp:8081`.
- Quran data: `packages/content/quran/generated` is built from the pinned sources by
  `pnpm --filter @murshid/content quran` (CI runs `pnpm content:check`). The 604 mushaf page fonts are not in
  git: install each edition's with `pnpm --filter @murshid/content fonts <v1|v2|v4> <unzipped QUL folder>` (the
  web dev server serves them from `public/fonts/quran-<edition>`). QUL's download links redirect to public
  files on Tarteel's CDN.
- The phone's web addresses are in `apps/mobile/src/lib/addresses.ts`: the live site for share links and the
  Fajr Rise card, the asset Worker for page fonts. To use the web dev server instead, set
  `EXPO_PUBLIC_WEB_URL` or `EXPO_PUBLIC_ASSET_BASE_URL=http://localhost:3000` in `apps/mobile/.env`
  (gitignored), restart Metro, and run `adb reverse tcp:3000 tcp:3000` on the emulator.
- If the debug app is killed at launch ("failed to complete startup"), compile it ahead of time:
  `adb shell cmd package compile -m speed -f com.malekverse.almurshid`. Judge the Quran screens on a release
  build: in debug, Today's per-second updates starve the emulator's JS thread.
- Public web pages (`apps/web/src/app/[locale]/(public)`) are Server Components with small client islands.
  Keep the root layout free of client providers: the app's go in `AppProviders`, in the app's own layouts.
  Their budgets: `next build`, then `npx -y @lhci/cli@0.15.1 autorun` from `apps/web` (CI runs it).
- The site deploys to Netlify from `main` (every push spends free-plan credits). A public route with params
  sets `export const instant = false`, and client components that read the address sit in `<Suspense>`:
  otherwise Netlify answers 500 for pages rendered on request.
- Mushaf page fonts on the live site come from the `al-murshid-assets` Cloudflare Worker
  (`https://al-murshid-assets.malek-magraoui3.workers.dev`, set as `NEXT_PUBLIC_ASSET_BASE_URL` on Netlify).
  To change them: a folder with `fonts/quran-<edition>/p<n>.ttf` and a `_headers` file (CORS, immutable cache),
  then `npx wrangler deploy --name al-murshid-assets --assets <folder> --compatibility-date 2026-10-01`;
  rerun it if the upload drops, it resumes.
- If a CSS change is missing from a production build, Turbopack's build cache is stale: delete
  `apps/web/.next/cache/turbopack` and build again.
- Share images (`opengraph-image.tsx`) draw text through `apps/web/src/lib/og`, shaped with HarfBuzz:
  Satori's own text cannot join Arabic letters.
- Store screenshots: download a run's screenshots with
  `gh run download <run> -n ios-simulator-screens -D <folder>`, then run
  `pnpm --filter @murshid/web store -- --screens <folder> --platform ios`.
  The frames land in `design/store/out` (not committed).
- Commands run from the repo root through Turborepo: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- Design tokens live in `packages/tokens`; run `pnpm --filter @murshid/tokens build` after editing them
  (it regenerates `theme.css` for both apps).
- Strings live in `packages/i18n/messages/<locale>/<namespace>.json`; `pnpm i18n:check` must pass.
