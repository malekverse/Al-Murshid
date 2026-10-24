# Phase 5b · Quran depth (plan)

2026-10-19 · Owner decision: before Phase 6, make the Quran section as customizable as the best
Quran apps: many reciters with downloads, reading modes, four mushaf editions, tajweed colors,
marking, tafsir, memorization tools and a recitation check. SPEC 5.5 and 12 carry the scope; this
file is the working plan. Decisions made along the way go to `docs/DECISIONS.md`.

## Gate

- **Text integrity, per edition.** Every edition's glyph or Unicode script covers all 6,236 ayahs
  and lines up with the shared word locations (surah:ayah:word); any difference is listed in a
  test, never patched. Its pages and lines cover the Quran in order with no gap or overlap. Each
  source is pinned by SHA-256, and CI fails on stale generated data.
- **Tajweed** renders in light, dark and sepia on web and on an Android release build, or in the
  fallback recorded in DECISIONS.md.
- **Memorization:** hiding and revealing never moves a word or a line.
- **Downloads:** any reciter's downloaded surahs play with the network off, and the storage screen
  shows and frees the space they use.
- **Recitation check:** a prototype measured on a mid-range Android release build, with a recorded
  go or no-go (step 6).
- The polish checklist (SPEC 11) on every new screen; e2e flows and screenshots updated.

## Status (2026-10-19)

Built on web and mobile, with the decisions in `docs/DECISIONS.md` (Phase 5b):

- Reading views, the four editions, and tajweed in the mushaf and in both scrolling layouts. On
  phones this uses fallback (c): the fonts' own colors, on a light page in dark mode.
- 18 reciters with search and styles; whole-reciter downloads and the storage screen (mobile);
  Al-Mukhtasar in three languages; passages; memorization; repeating a passage.
- Recitation check: measured, **no-go for now** (one correct word in five marked on a clean
  studio recording, even at full precision; 159 to 397 MB). Nothing reaches users; the bench and
  the alignment stay for the next attempt.

Left out, or changed from the plan below:

- No tajweed legend yet: the rule names need writing in-house and review.
- No reciter sample in the picker; the chosen reciter plays in the reader.
- Al-Muyassar left out (QUL's file mixes surah introductions into the passages).
- Timings, the tafsir and the Indopak words ship inside the apps instead of downloading on mobile
  (no asset CDN yet). The APK is 122 MB, up from 88 MB; Phase 9 sets the size budget.

## Steps, in order

### 1. Reading modes and mushaf editions

- **Three views:** mushaf (the book), Arabic text (verses flowing, no translation), and
  translation (today's verse view, with word meanings and transliteration as toggles).
- **Four editions** behind one renderer, one setting:

  | Edition                    | Pages          | Drawn with                       | QUL sources                    |
  | -------------------------- | -------------- | -------------------------------- | ------------------------------ |
  | Madani 1405 (KFGQPC V1)    | 604 × 15 lines | one QCF V1 font per page         | layout 15, font 238, script 57 |
  | Madani 1421 (KFGQPC V2)    | 604 × 15 lines | one QCF V2 font per page (done)  | layout 10, font 249, script 61 |
  | Madani 1441 (KFGQPC V4)    | 604 × 15 lines | one QCF V4 tajweed font per page | layout 19, font 240, script 47 |
  | Indopak (KFGQPC Nastaleeq) | 610 × 15 lines | one Unicode font                 | layout 8, font 462, script 52  |

- **Pipeline:** `build-quran.ts` builds each edition's pages and glyphs the way it builds V2 now
  (`mushaf-<edition>.json`), with the same tests. `install-v2-fonts.ts` becomes
  `fonts:install <edition> <folder>`, with one hash manifest per edition. Page fonts are served
  from `public/fonts/quran-<edition>/` and downloaded per page on mobile, as now.
- **Indopak** uses a normal Unicode font, not one font per page, so each line is fitted to the page
  width ourselves (justified per line). A test rebuilds every line from the script byte for byte.
- **Position across editions:** the reading position and bookmarks are kept by ayah, so switching
  editions keeps the place. A khatmah keeps its pace in Madani pages; in Indopak, today's portion
  shows as an ayah range.
- **Tajweed (1441 only; the 1405 and 1421 fonts have no colors).** The V4 page fonts are COLRv0
  color fonts with six palettes: tajweed on and off, each in light and dark, plus a second light
  set. Which palette suits sepia is decided by eye.
  - Web: `@font-palette-values` and `font-palette` choose the palette per theme and per toggle.
  - Mobile: React Native does not expose font palettes. Spike, in order: (a) draw the page with
    React Native Skia if it can pick a palette; (b) keep a copy of each page font on the phone
    with the wanted palette moved first (glyphs untouched; only if the font's terms allow it);
    (c) fallback: tajweed pages sit on a light page surface in dark mode. Record the choice.
  - Verse views with tajweed draw each word with its V4 glyph, the same source as the mushaf,
    rather than a second, differently encoded tajweed text. The Unicode text stays underneath for
    screen readers, copy and search.
  - A legend sheet names the colors' rules. Rule names and short explanations are written
    in-house and reviewed (SPEC 10), like the 99 Names' meanings.

### 2. Reciters and downloads

- **Catalog:** the 5 reciters we have plus the QUL surah-by-surah recitations with word timestamps
  listed below (about 30 more), grouped as murattal, mujawwad and teaching (al-Husary's muallim
  recitation suits memorization). A picker with search and a short sample.
- **Timings stay small:** each reciter's word timings are about 1.8 MB. The web loads them per
  surah, as now. Mobile bundles only the default reciter's; the others download with the audio (or
  on first play) from the asset base and are kept.
- **Downloads:** a whole reciter or chosen surahs, resumable, with a storage screen (size per
  reciter, remove). Speed and repeat already exist.
- Ayah-by-ayah recitations (one file per ayah) wait: one audio model keeps playback simple.

### 3. Tafsir

- **Al-Mukhtasar in interpreting the Noble Quran**, in Arabic, English and French (one work, one
  structure in all three languages), opened from the ayah actions. A passage that covers several
  ayahs shows once, with its range. Its HTML is reduced to `<b>` and `<i>`.
- **Al-Muyassar** (Arabic), optional, only once its QUL text is checked against the King Fahd
  Complex print: QUL's entry 38 opens Al-Muzzammil with a "naming of the surah" passage that reads
  like Al-Mukhtasar.
- Bundled per surah on web (lazy chunks); downloaded per surah on mobile, so the app does not grow.
- Written permission before launch (open item, like the translations).

### 4. Marking

- Bookmarks become ranges (first and last ayah, five colors), shown in every view: a colored edge
  beside the ayahs in the verse views, and on the mushaf page beside the lines they cover.
- Sync: `quran_bookmarks` gains `ayah_end` (SPEC 9). Private notes stay with Phase 7, which brings
  the encrypted local store.

### 5. Memorization tools

- In every view and edition: **hide all words**, **hide all but each ayah's first word**, or
  **hide only the ayah markers**. Tap a word or a marker to reveal it; hold to peek at the whole
  ayah. Reveals are instant (Quran text never animates).
- A hidden word keeps its exact place and width (a soft bar in a token color), so lines and pages
  never reflow.
- **Repeat a range:** from one ayah to another, N times, with an optional pause, extending today's
  repeat.

### 6. Recitation check (prototype, then decide)

- **On the device only.** Model: `tarteel-ai/whisper-base-ar-quran` (Apache-2.0, 5.75% word error
  rate on its evaluation set), downloaded on first use. Mobile through `whisper.rn` (whisper.cpp,
  MIT); web through Transformers.js (Apache-2.0) on WebGPU or WebAssembly.
- **What it does:** the reader picks a range and recites; the app aligns the recognized words with
  the expected ones (normalized forms, as search does) and marks the published words as recited,
  skipped or different. It never shows the model's transcript as Quran text.
- **What it says it does not do:** vowel marks and tajweed pronunciation.
- **Mercy over metrics:** no score, no percentage, no red. A difference is a calm mark and
  "Listen to this ayah" or "Try again from here".
- **Privacy:** audio is processed in memory and never stored or sent. The microphone permission is
  asked on first use only (`app.json` turns it off today).
- **Measure, then decide:** accuracy on test recordings (the owner's recitation, with and without
  deliberate slips) and latency on a mid-range Android release build. Ship only if it marks real
  slips and rarely marks correct recitation; otherwise keep it out and record why.

### 7. Close

Playwright flows for the new views, editions and memorization; the screenshot run; Android release
checks; DECISIONS.md verification notes; the SPEC updated with anything that changed.

## QUL downloads for the owner

Downloads need the owner's QUL account. Put everything in one empty folder, unzipped, and give
its path. Each recitation download holds `segments.json` and `surah.json`, as before.

**Editions**

| #   | Resource                               | Link                                                                  | Format        |
| --- | -------------------------------------- | --------------------------------------------------------------------- | ------------- |
| 1   | KFGQPC V1 layout (1405H print)         | [mushaf-layout/15](https://qul.tarteel.ai/resources/mushaf-layout/15) | sqlite        |
| 2   | QPC V1 Font                            | [font/238](https://qul.tarteel.ai/resources/font/238)                 | ttf           |
| 3   | QPC V1 Glyphs - Word by Word           | [quran-script/57](https://qul.tarteel.ai/resources/quran-script/57)   | json          |
| 4   | KFGQPC V4 layout (1441H print)         | [mushaf-layout/19](https://qul.tarteel.ai/resources/mushaf-layout/19) | sqlite        |
| 5   | QPC V4 Tajweed Font                    | [font/240](https://qul.tarteel.ai/resources/font/240)                 | ttf           |
| 6   | V4 Glyphs(With Tajweed) - Word by word | [quran-script/47](https://qul.tarteel.ai/resources/quran-script/47)   | json          |
| 7   | KFGQPC Nastaleeq 15 lines layout       | [mushaf-layout/8](https://qul.tarteel.ai/resources/mushaf-layout/8)   | sqlite        |
| 8   | KFGQPC Nastaleeq (font)                | [font/462](https://qul.tarteel.ai/resources/font/462)                 | ttf and woff2 |
| 9   | QPC Nastaleeq script - Word by Word    | [quran-script/52](https://qul.tarteel.ai/resources/quran-script/52)   | json          |

**Tafsir**

| #   | Resource                                            | Link                                                      | Format |
| --- | --------------------------------------------------- | --------------------------------------------------------- | ------ |
| 10  | Arabic Al-Mukhtasar in interpreting the Noble Quran | [tafsir/251](https://qul.tarteel.ai/resources/tafsir/251) | json   |
| 11  | English Al-Mukhtasar                                | [tafsir/266](https://qul.tarteel.ai/resources/tafsir/266) | json   |
| 12  | French Abridged Explanation of the Quran            | [tafsir/259](https://qul.tarteel.ai/resources/tafsir/259) | json   |
| 13  | Tafsir Muyassar (optional)                          | [tafsir/38](https://qul.tarteel.ai/resources/tafsir/38)   | json   |

**Reciters (surah by surah, with segments, json).** First set:

| #   | Reciter                                | Link                                                              |
| --- | -------------------------------------- | ----------------------------------------------------------------- |
| 14  | Abdur-Rahman as-Sudais                 | [recitation/407](https://qul.tarteel.ai/resources/recitation/407) |
| 15  | Sa`ud ash-Shuraym                      | [recitation/317](https://qul.tarteel.ai/resources/recitation/317) |
| 16  | Maher al-Muaiqly                       | [recitation/405](https://qul.tarteel.ai/resources/recitation/405) |
| 17  | Yasser ad-Dussary                      | [recitation/422](https://qul.tarteel.ai/resources/recitation/422) |
| 18  | Abu Bakr al-Shatri                     | [recitation/315](https://qul.tarteel.ai/resources/recitation/315) |
| 19  | Hani ar-Rifai                          | [recitation/333](https://qul.tarteel.ai/resources/recitation/333) |
| 20  | Nasser Al Qatami                       | [recitation/356](https://qul.tarteel.ai/resources/recitation/356) |
| 21  | Fares Abbad                            | [recitation/336](https://qul.tarteel.ai/resources/recitation/336) |
| 22  | Muhammad Jibreel                       | [recitation/419](https://qul.tarteel.ai/resources/recitation/419) |
| 23  | Khalid Al-Jalil                        | [recitation/420](https://qul.tarteel.ai/resources/recitation/420) |
| 24  | Abdullah Basfar                        | [recitation/416](https://qul.tarteel.ai/resources/recitation/416) |
| 25  | Muhammad Siddiq al-Minshawi (mujawwad) | [recitation/395](https://qul.tarteel.ai/resources/recitation/395) |
| 26  | Mahmoud Khalil Al-Husary - Muallim     | [recitation/334](https://qul.tarteel.ai/resources/recitation/334) |

More, if wanted: Abdullah Awad al-Juhani ([415](https://qul.tarteel.ai/resources/recitation/415)),
Abdullah Ali Jabir ([404](https://qul.tarteel.ai/resources/recitation/404)),
Salah Bukhatir ([362](https://qul.tarteel.ai/resources/recitation/362)),
Salah al-Budair ([320](https://qul.tarteel.ai/resources/recitation/320)),
Akram Al-Alaqmi ([370](https://qul.tarteel.ai/resources/recitation/370)),
Abdullah Matroud ([409](https://qul.tarteel.ai/resources/recitation/409)),
Bandar Baleela ([388](https://qul.tarteel.ai/resources/recitation/388)),
Khalifah Taniji ([389](https://qul.tarteel.ai/resources/recitation/389)),
Mohammad Al-Tablawi ([348](https://qul.tarteel.ai/resources/recitation/348)),
Mahmood Ali Al-Bana ([372](https://qul.tarteel.ai/resources/recitation/372)),
Hady Toure ([421](https://qul.tarteel.ai/resources/recitation/421)),
Aziz Alili ([321](https://qul.tarteel.ai/resources/recitation/321)),
Mostafa Ismaeel ([346](https://qul.tarteel.ai/resources/recitation/346)),
Ahmad Nauina ([341](https://qul.tarteel.ai/resources/recitation/341)),
Sahl Yasin ([361](https://qul.tarteel.ai/resources/recitation/361)) and
Ali Hajjaj Alsouasi ([371](https://qul.tarteel.ai/resources/recitation/371)).

Not from QUL: the recitation-check model comes from Hugging Face, downloaded in step 6 after
asking.

## Open items for the owner

- Written permission for the English Al-Mukhtasar (and Al-Muyassar, if used) before launch. The
  Arabic and French ones come from QuranEnc.com under its published terms (DECISIONS, "Content
  sources", 2026-10-24).
- Rights for every added reciter before hosting audio on our CDN. Until then audio streams from
  the publishers' servers, as today. Self-hosting all of it would not fit Cloudflare R2's free
  10 GB (a reciter is roughly 0.5 to 1.5 GB).
- The King Fahd Complex font terms for the V1, V4 and Nastaleeq fonts, and whether a palette-only
  copy (step 1, option b) is allowed.
- Reviewer: tajweed legend text, the tafsir in each language, and the new editions' text.
- Reviewer: confirm that the 1441H print has no rings around stopping vowels (entry 14 of the
  fonts, hidden on web; still drawn on phones until the palette-only copy is allowed).
- Recitation check, next attempt: alignment against the expected words (CTC), a larger open model,
  the owner's own recordings, then a mid-range Android phone.
