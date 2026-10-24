# Phase 7c · Identity and home (plan)

2026-10-24. SPEC 4 (the landing page), 5.11, 6.7 and 12. Decisions made along the way go to
`docs/DECISIONS.md`.

Started on the owner's instruction to keep going (2026-10-23), with Phase 7b's gate open on what
needs a real phone: a week of real mornings on an Android phone and the iPhone (Phase 9), and Move
and Aloud (PHASE-7B).

## Steps, in order

Each step lands on web and mobile where it applies, in `ar`, `en` and `fr`, light and dark, with
tests and screenshots.

1. **The landing page** (`/[locale]/about`): a day you scroll through. The hero is the sky at
   the visitor's own time, with the next prayer's countdown for the main city of the browser's time
   zone (no location prompt; "Change city" leads to the prayer-time pages). Then one section per
   moment, each with something real working in the page:
   - Fajr: Fajr Rise, the ring screen drawn with the app's own components.
   - Dhuhr: the Quran, Al-Fatiha in the King Fahd Complex font from `packages/content`.
   - Asr: the tasbih, counting in the page.
   - Maghrib: Your Sky, a month of lights.
   - Isha: the night reflection, and the privacy promise in plain words.
   - Then the four destinations, the three languages, and the way in: open the app on the web
     now; the phone apps follow their store review.

   A Server Component page with small client islands, under the section 11 budgets; the sun's
   path follows the scroll with CSS scroll-driven animation where supported, and each section
   keeps its own sky where not. Reduce Motion turns movement into fades.

2. **The mark and the icons**, made in code (`design/scripts`): one eight-pointed star from the
   lattice rising over the horizon arc; the app icon over the Fajr gradient, the Android adaptive
   and monochrome layers, the splash mark, the favicon and PWA icons, the notification icon; the
   wordmark "المُرشِد" shaped with HarfBuzz from Readex Pro. Alternate icons (Night, Dawn,
   discreet) when a free native module allows choosing them.
3. **Today's greeting and the Tools hub**: a short greeting for the time of day on the hero, and a
   Tools screen with every tool (Qibla, Hijri calendar, Fajr Rise), four of them pinned to Today.
4. **Share cards**: an ayah (the reader's action bar), then the Names, dhikr and duas once
   reviewed, and seasonal greeting cards, drawn on the device; Arabic joined with its marks.
5. **Surah headers**: an ornamental frame from the lattice around the calligraphic surah name in
   the verse-by-verse and Arabic-only views.
6. **Paper and light**: layered paper horizons drawn in code and tinted by the live sky, for
   onboarding, empty states and the landing page.
7. **Store screenshots**, a first set: "the day in five lights", eight per platform and language.

## Gate

SPEC 12, Phase 7c: the icon reads at 29 pt on light, dark and tinted home screens; the landing
page meets the section 11 budgets in `ar`, `en` and `fr`; share cards keep Arabic joined with its
marks on both platforms.

## Status

- Steps 1–3 built and verified on web and the Android emulator (step 3), in `ar`, `en` and `fr`,
  light and dark. The landing page holds the section 11 script budget by reading prayer times
  computed at build time (DECISIONS, "The landing page").
- Step 4, the ayah card: built on both platforms. The Names, dhikr and duas wait for their
  reviewed text; seasonal greeting cards follow with step 6's illustrations.
- Step 5, the surah frames: built on both platforms and on the public surah page.
- Open: alternate icons (no free module chosen yet), steps 6 and 7.
