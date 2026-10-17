---
name: quiet-light
description: Al-Murshid's design system ("Quiet Light") and Arabic-first rules. Use for any UI work in apps/web or apps/mobile — screens, components, styling, motion, haptics, copy, RTL, accessibility — before writing or reviewing the code.
---

# Quiet Light

The source of truth is `docs/SPEC.md` sections 6 (design system), 7 (Arabic first) and 11
(polish checklist). Read them when a question is not answered here. This skill is the working
summary plus how the tokens map to code.

## Non-negotiables

- **Tokens only.** No hex colors, px font sizes, radii or durations in feature code. Web resets
  Tailwind's palette, text sizes, radii, shadows and easings, so only token utilities exist.
- **Arabic first.** Build and screenshot in `ar` (RTL) first, then `en` and `fr`, light and dark.
- **Logical properties only:** `ms/me/ps/pe/start/end/text-start/border-s/rounded-s…`, and
  `marginStart`, `paddingEnd`, `start`, `end` in styles. ESLint (`murshid/logical-properties`) fails
  the build on `ml-*`, `left-*`, `marginLeft`, `textAlign: 'right'` and friends.
- **Never letter-space, fake-bold, italicize or transform Arabic.** Quran text is never animated.
- **No religious text from AI.** Quran, hadith, adhkar and duas only come from `packages/content`.
- **Mercy over metrics.** No red for worship, no "missed", no streaks, no scores. `danger` is for
  deleting data only.

## Token → code map

| Need                            | Web (Tailwind v4)                                                           | Mobile (Uniwind)                                    | TS (`@murshid/tokens`)               |
| ------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| App background                  | `bg-canvas`                                                                 | `bg-canvas`                                         | `colors[theme].canvas`               |
| Card / sheet                    | `bg-surface` + `shadow-card border border-card-edge`                        | same, plus `dark:shadow-none`                       | `surface`, `cardEdge`                |
| Glass over the sky (Today only) | `bg-surface-glass backdrop-blur-md` inside `data-theme={glassToneFor(sky)}` | `colors[glassToneFor(sky)].surfaceGlass`            | `glassToneFor()`                     |
| Text                            | `text-ink`, `text-ink-muted`                                                | same                                                | `ink`, `inkMuted`                    |
| The one accent                  | fill `bg-lantern` + label `text-on-lantern`; as text `text-lantern-ink`     | same                                                | `lantern`, `onLantern`, `lanternInk` |
| Type                            | `<Text role="body">` picks `text-body` or `text-ar-body`                    | `<Text role="body">` (also picks the weight family) | `typeScale`                          |
| Sacred Arabic (adhkar, duas)    | `<Text role="dhikr" script="arabic">` (Amiri)                               | same                                                | `fonts.*.sacred`                     |
| Spacing                         | steps 1, 2, 3, 4, 6, 8, 12, 16 (4–64 px) only                               | same                                                | `space`                              |
| Radius                          | `rounded-control` 12, `rounded-card` 20, `rounded-sheet` 28, `rounded-full` | same                                                | `radius`                             |
| Touch target                    | `min-h-touch min-w-touch` / `size-touch` (48)                               | same                                                | `touchTarget`                        |
| Reading width                   | `max-w-reading` (720), page `max-w-page` (1200)                             | —                                                   | `layout`                             |
| Easing                          | `ease-standard`, `ease-exit`                                                | —                                                   | `easing`, `cubicBezierCss()`         |
| Duration                        | `duration-(--duration-quick)`                                               | `duration.quick`                                    | `duration`                           |
| Spring                          | Motion `{ type: 'spring', ...spring.snappy }`                               | Reanimated `withSpring(v, spring.snappy)`           | `spring`                             |
| Press feedback                  | Motion `whileTap={{ scale: motion.pressScale }}`                            | `<PressableScale>`                                  | `motion.pressScale` (0.97)           |
| Sky gradients                   | `from-sky-<period>-top to-sky-<period>-bottom`                              | Skia (Phase 2)                                      | `sky`, `skyPeriods`                  |

Edit tokens only in `packages/tokens/src`, then run `pnpm --filter @murshid/tokens build`.
Contrast pairs are unit-tested (`pnpm --filter @murshid/tokens test`); a new pair goes in
`contrastRequirements`.

## Motion and haptics (SPEC 6.4, 6.5)

- Motion explains, confirms or calms. Animate transform and opacity (and the sky). UI thread on
  native. With Reduce Motion, movement becomes a fade and ambient motion stops.
- Every pressable: scale 0.97, spring back (`spring.snappy`). Sheets and shared elements:
  `spring.gentle`. Celebrations and Qibla: `spring.soft`.
- Haptics: selection for tabs, toggles and each tasbih tap; medium impact for a finished dhikr
  count or Qibla alignment; success for a logged prayer or tasbih target. None on scroll or web.

## Arabic-first details (SPEC 7)

- Strings: `packages/i18n/messages/<locale>/<namespace>.json`, ICU. Arabic plurals need all six
  categories; `pnpm i18n:check` enforces it. Prefer gender-neutral phrasing.
- Numbers through `Intl` (`useFormatter`), never interpolated raw: digits follow the locale and
  the Maghreb rule. Token names, hex values and other code go in `<bdi dir="ltr">` on web or a
  Latin `script` on native.
- Mirror layout, navigation, progress and directional icons. Never mirror clocks, checks, media
  controls, numbers or the Quran page turn.
- Mixed content: wrap in `<bdi>` (web) or `isolate()` from `@murshid/i18n` (native).

## Before calling a screen done

Run the SPEC 11 polish checklist: tokens only; screenshots in ar/en/fr × light/dark; loading,
empty, error and offline states; press feedback and haptics; screen-reader labels and focus order;
360 dp phone, large phone, tablet, web at 1280 and 1920; unit tests and one end-to-end flow.
