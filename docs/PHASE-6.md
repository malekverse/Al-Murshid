# Phase 6 · Public web pages (plan)

2026-10-19. SPEC 4 and 12: server-rendered prayer-time, surah, ayah, adhkar and dua pages, with SEO
metadata and Open Graph images, deployed early because indexing takes months. Decisions made
along the way go to `docs/DECISIONS.md`.

## Gate

- **Lighthouse on every public route (mobile, simulated 4G):** Performance 95+, Accessibility
  100, SEO 100. LCP under 2.0 s, CLS under 0.05, INP under 150 ms. First-load JavaScript under
  150 KB gzipped per public route (SPEC 11).
- **Indexed in a search console:** the site deployed, its sitemaps submitted, and pages showing
  as indexed (Google Search Console, and Bing Webmaster Tools, both free).

## Status (2026-10-20)

- **Built:** steps 1 to 6 below: the light root, surah and ayah pages, prayer-time pages, search
  metadata, share images, and Lighthouse CI. Details and reasons are in `docs/DECISIONS.md`
  (Phase 6).
- **Measured locally (Lighthouse, mobile, median of three):** Accessibility, SEO and Best
  Practices 100 on every page, CLS at most 0.025, scripts 141–144 KB. Performance 0.92–0.93 on
  the prayer-time pages and 0.79–0.87 on the Quran pages, where the simulated LCP (3.3–4.2 s)
  waits for the 107 KB Hafs font and the framework's scripts on a simulated slow link.
- **Open for the gate:** deploy (step 7), measure Performance and LCP with PageSpeed Insights on
  the deployed site, and submit the sitemaps to the search consoles. If the Quran pages stay under
  95 there, the choice is the owner's: accept it for those pages, or show Quran text in another
  font until the Hafs font arrives (`font-display: swap`), which departs from SPEC 6.2 (the King
  Fahd Complex font for verse-by-verse text).
- **Waiting on content:** the adhkar and dua pages (below).

## Where it starts (measured 2026-10-19, production build)

- `/en/quran/2` scored Performance 32 and SEO 60, and shipped 604 KB of JavaScript. Its HTML
  carried no Quran text, canonical or hreflang, and a first visit was sent to onboarding, which
  is `noindex`.
- The root layout alone costs 210 KB gzipped before any page: React DOM 70, Motion 47 (through
  `MotionConfig` and toasts), Next's runtime about 44, intl-messageformat 12, Serwist 8. The surah
  route adds Zod 34, Dexie 31, the surah metadata 55, tokens 20 and the reader.

## Steps, in order

### 1. A light root, and the app's providers where the app is

- The root layout keeps the document, fonts, theme script, skip link and the service worker. Motion,
  toasts and the translated messages move to the interactive app's layout. Public pages are Server
  Components; their few interactive parts are small islands.
- One recitation still plays across every screen: its player lives at the root, loaded on the first
  play, so public pages do not pay for it.
- Public pages never send a visitor to onboarding; they work for a first visit as they are.

### 2. Surah and ayah pages

- **`/quran/[surah]`** renders the surah on the server in the default view of the address's language
  (the Arabic text with the translation for English and French), so the HTML holds the published
  text. The full reader takes over on the first touch (a word, an ayah's actions, the bar), at once
  for a reader whose settings ask for another view, with identical layout so nothing moves.
- **`/quran/[surah]/[ayah]`** becomes the ayah's own page: the ayah, its translation, its words, its
  tafsir and its neighbours, with "Read from here" into the surah (`/quran/2#ayah-255`). Inside the
  app, links that open the reader at an ayah use that anchor. The mobile app keeps
  `/quran/2/255` opening its reader there.

### 3. Prayer-time pages

- `/prayer-times`, `/prayer-times/[country]` and `/prayer-times/[country]/[city]` for the 31,766
  GeoNames cities of 15,000+ people already bundled (CC BY 4.0, credited). Slugs are stable and
  English in every language; namesakes in a country take their region.
- A city's page: today's times in the city's time zone with the country's default method (named,
  with a link to change it in the app), the next prayer's countdown (a small island), the month's
  table, the Hijri date, the Qibla bearing and distance, and "Use this city" into the app.
- Rendered on demand and cached for an hour; the largest cities are prerendered at build.

### 4. Search metadata

- `NEXT_PUBLIC_SITE_URL` for absolute URLs. Every public page: title, description, canonical and
  `hreflang` for ar, en and fr (x-default to Arabic), Open Graph and Twitter tags.
- `robots.txt` (no `/dev`, `/welcome`, `/you`, `/offline`) and sitemaps split under 50,000 URLs each.
- JSON-LD: `WebSite`, `BreadcrumbList`, and on each page what it is (a chapter of the Quran, a
  quotation of an ayah, a city's prayer times as a web page about a place).

### 5. Open Graph images

- One image per page, generated on demand (`next/og`) in Quiet Light: the surah's calligraphic
  name, the ayah's Arabic text with its translation, the city's next prayer times.
- Satori cannot join Arabic letters, so Arabic is shaped first with HarfBuzz (`harfbuzzjs`, MIT) into
  glyph outlines, with the King Fahd Complex font for Quran text and Readex Pro for the interface.

### 6. Budgets in CI

- Lighthouse CI (`@lhci/cli`, Apache-2.0) on pull requests for a set of public pages, failing below
  the gate's scores (SPEC 8.4).

### 7. Deploy

Prepared here, done by the owner (accounts are the owner's):

- A Vercel Hobby project connected to the GitHub repository (or Cloudflare, if the app ever earns
  money), with `NEXT_PUBLIC_SITE_URL` set, and a custom domain if wanted.
- Google Search Console and Bing Webmaster Tools: verify the site (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  and `NEXT_PUBLIC_BING_SITE_VERIFICATION`, or DNS), then submit `/sitemap.xml`.
- Mushaf page fonts are not in git: until the asset CDN exists (Cloudflare R2, open item), the
  deployed mushaf view has no page fonts. The public pages do not need them.

## Adhkar and dua pages: waiting on content

`/adhkar/[collection]` and `/duas/[feeling]` need adhkar and duas from a named source with
references, translations licensed for English and French, and a reviewer (SPEC 10). None is in the
repository yet, and no placeholder is published. Research (2026-10-19) found one source with all
three languages under terms that allow an app and public pages:

- **IslamHouse:** Hisn al-Muslim in Arabic, English ([39062](https://islamhouse.com/en/books/39062))
  and French ([2846930](https://islamhouse.com/fr/books/2846930), or the older
  [1566](https://islamhouse.com/fr/books/1566)), published by the Two Holy Mosques' Message.
  Use is allowed unchanged and credited; `admin@islamhouse.com` confirms in writing. PDF only: the
  text has to be copied out and proofread by a person.
- **HadeethEnc.com** (the same group): hadith in Arabic, English and French with grading, as JSON,
  allowed unchanged and credited; thin for adhkar.
- sunnah.com's Hisn al-Muslim needs explicit permission for whole collections; Dorar.net's gradings
  are a lookup tool for the reviewer, not data to bundle.

The owner asks IslamHouse for written permission (bundled offline in a free, ad-free app and shown
on public pages), and the reviewer records each item's collection, number and grading. The pages
follow as soon as the content is in (with Phase 7's Remember screens).

## Open items for the owner

- Hosting account, domain, and search console verification (step 7).
- Adhkar and duas: IslamHouse permission and a reviewer.
- The asset CDN for mushaf page fonts and audio (Cloudflare R2), carried over from Phase 5.
