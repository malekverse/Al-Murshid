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
- Commands run from the repo root through Turborepo: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- Design tokens live in `packages/tokens`; run `pnpm --filter @murshid/tokens build` after editing them
  (it regenerates `theme.css` for both apps).
- Strings live in `packages/i18n/messages/<locale>/<namespace>.json`; `pnpm i18n:check` must pass.
