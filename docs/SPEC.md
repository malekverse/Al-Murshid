# Al-Murshid (المُرشِد) — Product & Design Spec v3

Oct 17, 2026 · @Malek · v3, Oct 23, 2026: the plan after studying Ameen (`docs/COMPETITION.md`): Fajr Rise (5.10), the Tools hub and share cards (5.11), the brand (6.7), Phases 7b and 7c, and the phases after launch (12)

## 1. How Claude Code should use this spec

Build Al-Murshid v2 from scratch as a Next.js web app and an Expo (React Native) mobile app that share one TypeScript core. This spec is the single source of truth for product, design and architecture. Save it in the repo as `docs/SPEC.md` and reference it from `CLAUDE.md`.

**Read order.** Read sections 2 to 5 (why and what) before any code. Read section 6 (design system) and section 7 (Arabic-first) before any UI. Read sections 8 and 9 before scaffolding the repo.

**Rules of engagement**

1. This spec wins. When something is unclear, missing or contradictory, do not stop to ask. Read it in the light of sections 2 and 3, make the most creative choice that serves the principles, and log it in docs/DECISIONS.md. Small touches that improve the experience are welcome; anything on the cut list in section 13 is not.
2. Build less, finish more. Each v1 screen ships polished (motion, empty states, loading, errors, RTL) before the next one starts. No placeholder UI is ever merged.
3. Design system first. Tokens and primitives exist before screens. Feature code never hard-codes a color, spacing value, font size, radius or animation duration.
4. Arabic first. Every screen is built and reviewed in Arabic (RTL) first, then English and French.
5. Free tools only, verified. Library names and versions here are guidance as of October 2026. Check current official docs before installing and pin exact versions. Use only open-source libraries and free service tiers, never a paid plan or paid add-on (section 8.4).
6. AI never writes religious content. Quran text, translations, hadith and adhkar come only from the sources in section 10, untouched.
7. Look at what you build. After each screen, screenshot it on web and run it on the iOS and Android simulators, in Arabic and English, light and dark. Compare against section 6 and fix gaps before moving on.
8. Log decisions. Keep `docs/DECISIONS.md` with one line per non-obvious choice (what, why, alternatives).

**Quality bar.** If a design-literate person cannot tell this apart from the work of a top product studio, it is not done.

## 2. Product vision and principles

Al-Murshid is a calm, beautiful companion for the five moments of a Muslim's day. It is built first for people who pray sometimes and want to pray more, and polished enough that devoted users switch to it too.

**The gap we fill.** Today's Islamic apps force a choice. All-in-one apps have depth but feel cluttered, carry ads and raise privacy doubts. Minimal apps are beautiful but shallow. Al-Murshid offers the depth of the first with the calm of the second, with no ads and no data selling.

**The bar.** Ameen (free, ad-free, 4.7 stars) shows what users now expect: a strong identity, everything in one place, many widgets, a beautiful player, a landing page that feels alive. We match that breadth where it serves the five moments, and lead where it is weak or absent: privacy (no trackers at all), tested accuracy, a smooth mushaf, accessibility, French, the web, mercy over metrics, and Fajr Rise. Teardown and sources: `docs/COMPETITION.md`.

**The core insight.** Islam already has the best daily rhythm a product could ask for: five fixed prayer moments, a weekly peak (Jumu'ah) and yearly seasons (Ramadan, Dhul Hijjah). We do not invent hooks. We show up beautifully at each of those moments, then get out of the way.

**Success is not time in app.** The goal is a 30-second visit at each prayer moment that leaves the user lighter. North-star metric: share of weekly active users who open the app at 3 or more distinct prayer moments per week (measured with privacy-respecting, aggregate, opt-in analytics only).

**Principles (in priority order when they conflict)**

1. **Organized by time, not by feature.** The app always knows where the user is in their day and leads with what matters now.
2. **One obvious action per screen.** A grandfather and a ten-year-old can both use every screen without explanation.
3. **Mercy over metrics.** No guilt, no red "missed" marks, no broken-streak penalties, no scores of faith, no public comparison of worship.
4. **Calm reverence.** Beauty serves worship. Motion never touches Quran text. Nothing playful or gimmicky around sacred content.
5. **Private by default.** Fully usable without an account. Worship logs stay on the device unless the user opts into sync. No ads, no third-party trackers, ever.
6. **Depth on demand.** A simple surface, with depth (tafsir, word-by-word, audio, history) one tap away for those who want it.
7. **Speed is a feature.** Useful content on screen in under one second, and every core feature works offline.

**Voice and tone.** Warm, short and plain, like a kind older sibling. Never preachy, never scolding, never long.

| Never write | Write instead |
| --- | --- |
| "You missed Fajr." | Nothing. Show the next prayer. |
| "Streak lost!" | "Welcome back. Let's start with the next prayer." |
| "You only prayed 2/5 today." | The sky shows two lights. No number, no judgment. |
| "Level up! You are now Al-Sabiq." | "A new step is ready when you are." |
| "Warning: Asr ends in 10 minutes!" | "Asr is still here, about 10 minutes left." |

## 3. Users and the Journey system

One app serves every starting point. The Journey replaces points, levels and streaks with private, optional next steps that never take anything away.

**Personas**

| Persona | Where they are | What they need | What drives them away |
| --- | --- | --- | --- |
| Yassine, 24 (primary) | Prays sometimes, mostly Jumu'ah. Feels guilty. | Low friction, zero judgment, one small step at a time | Guilt, walls of text, red marks, preachy tone |
| Amina, 35 | Prays five. Wants Quran consistency and daily adhkar. | Accurate times, a great Quran reader, adhkar, calm design | Clutter, ads, slow screens |
| Hajj Mohamed, 68 | Prays all five. Weak eyesight, low tech comfort. | Huge readable text, adhan, Quran audio, nothing hidden behind gestures | Small text, gesture-only controls, non-Arabic UI |
| Sara, 11 | Learning to pray with her family. | Simple screens, short surahs, encouragement | Complexity, anything not age-appropriate |

**Onboarding (under 60 seconds, no account required)**

1. **Language.** Arabic, English or French, preselected from the device locale (Arabic if the locale is unsupported).
2. **Location.** "Use my location" or "Choose a city". Manual city works fully. The calculation method is picked by country and editable later.
3. **Where are you today?** "Just starting", "I pray sometimes", "I pray most days", "I pray all five". Caption: "This stays on your phone. There is no wrong answer." This sets the starting step only.
4. **Reminders.** Explain the value first, then request permission. Style choice: full adhan, soft tone or silent banner.
5. **Arrival.** Land on Today with the sky transition for the current time of day.

Account creation is offered later, in You, as "Back up and sync".

**The Journey: steps, not scores**

The user holds one focus at a time per track. The prayer track is the spine; the other two are optional.

| Track | Steps (examples, each one small) |
| --- | --- |
| Prayer | One chosen prayer daily, then two, then all five, then five plus morning and evening adhkar, then the Sunnah rawatib |
| Quran | One ayah a day, then one page, then a personal khatmah plan |
| Remembrance | Morning adhkar, then evening adhkar, then tasbih after prayer |

Rules:

- When a step is held on 5 of the last 7 days, the app offers the next one. It never advances automatically.
- The user can decline, pause or step back at any time, with no message of failure.
- Every feature is always available to everyone. The Journey only changes what Today emphasizes and how reminders behave.
- No points, XP, levels, faith scores, badges or leaderboards. Nothing about worship is ever shown to other people.
- The app never tries to detect "cheating". Logging is between the user and Allah; prayers from earlier today or yesterday can be logged without comment.

**Progress you can see: Your Sky**

Today's background is the real sky for the current time. Each logged prayer adds a soft light to that day's sky. In You, a calendar of small sky tiles shows the past weeks: days with prayers glow, other days are plain night, never red or empty-marked.

**Return and recovery flows**

- After 3 or more days away, the next open shows a "Welcome back" card with the next prayer and one verse about Allah's mercy (for example Az-Zumar 39:53). It never counts the days missed.
- If reminders are ignored 5 times in a row, they quietly reduce to the user's focus prayer only, with one gentle note and a toggle to restore them.
- Celebrations are proportional: a light and a haptic for a logged prayer, a slightly larger moment for completing the day's focus, a short du'a when a new step is accepted. No confetti, no sounds except the adhan.

**Comfort for every age**

- **Comfort size:** respects system text size and adds an in-app setting up to 200%. Layouts reflow; nothing truncates.
- **Simple view:** a toggle that reduces Today to the prayer times list and one large "I prayed" button. Suggested during onboarding when the device text size is large.
- **Kids:** no AI chat and no social features for anyone who indicates they are under 13; content is safe for all ages by default.

## 4. Information architecture and navigation

The app has four destinations, identical on web and mobile: **Today, Quran, Remember, You**. Occasional tools live one tap away from Today instead of taking a tab.

**Structure**

- **Today**
  - Hero: current or next prayer, live countdown, one "I prayed" action
  - Today's five prayer times (tap a row for its reminder settings)
  - One contextual card at most: adhkar window, Jumu'ah and Surah Al-Kahf, Ramadan iftar countdown, Welcome back, or a new step offer
  - A one-line Journey focus
  - Tools row: up to four pinned tools (Qibla and Hijri calendar by default), and the Tools hub with every tool (5.11)
- **Quran**
  - Continue reading (last position, one tap)
  - Surah list, Juz list, search
  - Reader: verse-by-verse view and mushaf page view
  - Bookmarks, notes, khatmah plan
  - Listen: reciters, favorites, radio (Phase 10), with a mini player above the tab bar on every tab while audio plays
- **Remember**
  - Adhkar collections: morning, evening, after prayer, before sleep, on waking, and daily-life occasions
  - Duas by feeling: anxious, sad, grateful, angry, afraid, hopeful, sick, guilty, lonely
  - Tasbih
  - The 99 Names of Allah
- **You**
  - Your Sky (history calendar)
  - Journey (current steps, change focus)
  - Night reflection (private journal)
  - Settings: language, location and calculation method, adhan and reminders (with Fajr Rise), appearance (theme, comfort size, simple view), Quran (view, edition, tajweed, reciter, translation, tafsir, downloads), privacy and data (export, delete), back up and sync, about and sources

**Navigation rules**

- Mobile: a bottom tab bar with 4 tabs, icon plus label always visible. In RTL the order mirrors, so Today sits on the right.
- Web desktop: a slim side rail on the start side plus content area. Web on small screens uses the same bottom bar as the app.
- Maximum depth is 3 levels from any tab. Back always works, by gesture and by a visible button.
- No action exists only behind a gesture. Every swipe has a visible equivalent.
- Content opens as pushed screens with shared-element transitions. Sheets are only for short tasks (a setting, logging an earlier prayer).
- Every surah, ayah, dhikr and dua has one stable path shared by web and app (for example `/quran/2/255`). Universal links and app links open the app when installed.
- Search: within Quran (surah names, Arabic text, translation) and Remember (adhkar and duas) in v1. On web desktop, `Ctrl/Cmd + K` opens it.

**Web and mobile have different jobs**

|  | Mobile app | Web |
| --- | --- | --- |
| Primary job | Daily companion | Discovery, study and sharing |
| Unique strengths | Adhan notifications, home-screen widgets, compass Qibla, haptics, full offline | Search-engine traffic, large-screen Quran study, keyboard use, shareable links |
| Public pages (no login) | Not applicable | `/[locale]/about` (the landing page), `/[locale]/prayer-times/[country]/[city]`, `/[locale]/quran/[surah]`, `/[locale]/quran/[surah]/[ayah]`, `/[locale]/adhkar/[collection]`, `/[locale]/duas/[feeling]` |
| Path to the other | Share links open the web page for people without the app | Smart app banner and QR code to install; installable PWA as fallback |

Public web pages are server-rendered, localized under `/ar`, `/en` and `/fr` with `hreflang` tags, and carry structured data. They are the main free acquisition channel, so they must be fast and beautiful, not an afterthought.

**The landing page** (`/[locale]/about`, Phase 7c) is a day you scroll through: scrolling moves the sun from Fajr to Isha. The hero is the live sky at the visitor's own time, with the next prayer's countdown for a city guessed from the browser's time zone (no location prompt, "Change city" one tap away). Then one section per prayer moment, each with a real feature working in the page: Fajr Rise, a mushaf page in its printed font, an ayah playing, tap-to-count tasbih, the "I prayed" light. Then the privacy promise in plain words and the download links. It is a Server Component page with small client islands, holds the section 11 budgets, and turns the scroll animation into fades with Reduce Motion. The app keeps `/[locale]` itself; the welcome screen links to the landing page.

## 5. Feature specification (v1)

v1 ships Today, reminders, Qibla, Hijri calendar, Quran, Remember, You, seasonal modes, two widgets, Fajr Rise, and the Tools hub with share cards. Everything here is in scope; what follows launch is in section 12 (Phases 10 to 14), and everything else is in section 13.

### 5.1 Today

- **Hero.** Shows the next prayer in large type (Arabic name always, plus the localized name), its time and a live countdown in minutes (seconds only in the final minute). Inside a prayer's window it reads "Now: Asr" with the time remaining and one large "I prayed" button.
- **Logging.** Tapping "I prayed" morphs the button into a soft check while a small light rises into the sky, with a success haptic. An "Earlier prayers" link opens a sheet to log prayers from earlier today or yesterday.
- **Prayer list.** Fajr, Sunrise (shown as a marker, not a prayer), Dhuhr, Asr, Maghrib, Isha. Logged rows show a filled light; others a neutral outline, never red. The current row is highlighted.
- **Living sky.** The background gradient is computed from the real sun altitude at the user's location and shifts continuously through the day; stars fade in after Isha. With Reduce Motion it becomes a static gradient for the current period.
- **Dates.** Hijri date under the Gregorian date, with a ±2 day adjustment in settings.
- **Contextual card (one at most, in this priority):** Welcome back, Ramadan countdowns, Jumu'ah (Thursday Maghrib to Friday Maghrib, Surah Al-Kahf), adhkar window (morning after Fajr, evening after Asr), new step offer, the Fajr Rise offer (5.10, once in the first week), verse of the day.
- **Edge cases.** High latitudes (above about 48°) use an automatic high-latitude rule that the user can change. Handle DST changes. If the device moves more than about 50 km or changes time zone, ask: "You seem to be in Paris. Update prayer times?" No location permission means manual city, fully functional.

### 5.2 Prayer reminders (mobile only in v1)

- Per prayer: adhan, soft tone, silent banner or off, plus an optional pre-reminder (5 to 30 minutes before).
- Choice of 3 to 5 adhan recordings. iOS notification sounds are limited to about 30 seconds, so ship short versions for iOS (verify current limits).
- Notifications are scheduled locally. iOS keeps at most 64 pending local notifications, so schedule a rolling window (about 6 days) and refresh it on app open and background refresh.
- Notifications carry an "I prayed" action that logs without opening the app.
- Text is gentle and localized. Example: "Asr has come in. Two minutes with Allah?"

### 5.3 Qibla

- Mobile: a full-screen compass with one clear line toward the Kaaba, using true north. As alignment approaches, the screen gradually warms; within ±3° the ring fills with light and a haptic tick fires.
- Shows the bearing in degrees and the distance to Makkah. A figure-eight calibration hint appears when heading accuracy is low.
- No magnetometer, or web desktop: show the bearing from north and a simple map line from the user to Makkah. Mobile browsers use device orientation where permitted.

### 5.4 Hijri calendar

- Month view with swipe between months and small Gregorian dates. Uses the Umm al-Qura calendar plus the user's ±2 day adjustment.
- Marks Islamic New Year, Ashura, Ramadan, Laylat al-Qadr range, Eid al-Fitr, the first ten days of Dhul Hijjah, the Day of Arafah, Eid al-Adha and the white days (13 to 15).
- A short note explains that moon sighting differs by country and links to the adjustment setting.

### 5.5 Quran

- **Home.** Continue reading (one tap to last position), Surah list (number, calligraphic Arabic name, translated name, ayah count, Meccan or Medinan), Juz list, search.
- **Views.** The same text three ways: the mushaf (the book), the Arabic text alone, and verse by verse with translation.
- **Verse-by-verse view.** Uthmani Arabic in a proper Quran font, translation below (toggle). Tapping an ayah opens an action bar: play from here, short tafsir, word by word, bookmark, note, copy, share as an image card.
- **Word by word.** Tapping a word shows its meaning and transliteration in a small popover.
- **Mushaf view.** Four editions, each in its own printed layout with page-accurate fonts: the Madani mushaf of 1405H, 1421H and 1441H (King Fahd Complex, 604 pages) and the 15-line Indopak mushaf (King Fahd Complex Nastaleeq, 610 pages). Page turning matches a physical mushaf in every UI language.
- **Tajweed.** A toggle colors the text by tajweed rule in every view, using the 1441H edition's color fonts; a legend names each color.
- **Audio.** A catalog of reciters with word timestamps (about 30 to start, as rights are confirmed), grouped as murattal, mujawwad and teaching. Word highlighting synced to audio, background playback with lock-screen controls, repeat an ayah or a range N times, playback speed, download a whole reciter or chosen surahs for offline, and a storage screen to free space.
- **Tafsir.** A short tafsir in each language (Al-Mukhtasar in Arabic, English and French), one tap from any ayah.
- **Memorization.** Hide all words, all but each ayah's first word, or only the ayah markers, and reveal by tap. Hidden words keep their place, so nothing reflows.
- **Recitation check.** Recite a range and the app marks the published words as recited, skipped or different. It runs on the device only, keeps no audio, shows no score, and says plainly that it does not judge vowels or tajweed. It ships only if a prototype proves reliable: the Phase 5b one marked too many correct words and stays out (DECISIONS.md), and the next attempt aligns the audio against the expected words.
- **Reading settings.** View, edition, tajweed, Arabic size, translation on or off and choice per language, light, sepia and dark themes.
- **Khatmah plan.** Pick a finish date or pages per day. Shows today's portion and a progress ring. If the user falls behind, the plan quietly recalculates; it never shows "debt".
- **Bookmarks and notes.** Several colored bookmarks for one ayah or a range, shown in every view and edition, automatic last-read position, private notes per ayah.
- **Text integrity.** Never apply letter-spacing, synthetic bold or italic, or text transforms to Quran text. Ayah numbers use the traditional end-of-ayah marker.

### 5.6 Remember

- **Adhkar.** One card per dhikr: large Arabic, toggles for translation and transliteration, a small source reference (for example "Muslim 2723"). Tap the card to count; a ring fills around the count. On completion the card settles and the next slides in. A thin progress bar tracks the collection.
- **Duas by feeling.** A calm grid of feelings. Each opens 2 to 5 short duas with meaning and reference.
- **Tasbih.** The whole screen is the tap target. Large count, phrase picker (SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illa Allah, Astaghfirullah, salawat), target (33, 99, 100, custom, none). Light haptic per tap, stronger at the target. Screen stays awake. Daily totals saved locally.
- **99 Names.** A grid that opens into a detail view: meaning, a related verse reference, a two-line reflection. Swipe between names.

### 5.7 You

- **Your Sky.** A monthly grid of day tiles whose glow reflects prayers logged. Tap a day to see its lights. No numbers by default; "Show details" reveals counts for users who want them.
- **Journey.** Each track's current step, with "Change focus" and "Step back" one tap away.
- **Night reflection.** An optional prompt after Isha with three fields at most: one gratitude, one intention for tomorrow, a free note. Stored on the device only and encrypted. Optional app lock (Face ID, fingerprint or passcode) for You.
- **Privacy and data.** Export everything as JSON. Delete everything, local and cloud, in one confirmed action.

### 5.8 Seasonal modes

- **Ramadan** (automatic by Hijri date, can be turned off): the hero shows suhoor and iftar countdowns, Quran suggests a daily juz, Taraweeh can be logged, the last ten nights are highlighted with the Laylat al-Qadr du'a, and the palette shifts to a lantern-lit night theme. Fasting log is "fasted" or "not today", and the app never asks why.
- **Dhul Hijjah** (first ten days): takbir card and a Day of Arafah fasting reminder.
- **Jumu'ah**: Surah Al-Kahf card and a salawat reminder; Friday's Dhuhr row reads "Jumu'ah".

### 5.9 Widgets (mobile)

- Small and medium home-screen widgets: next prayer and countdown, styled with the current sky.
- An iOS lock-screen widget with the next prayer.
- Both read from data the app writes to a shared container, so they work offline.

### 5.10 Fajr Rise (mobile)

An optional alarm for Fajr that moves with the prayer time every day and keeps ringing until the user is really up. Plan: `docs/PHASE-7B.md`.

- **When.** At Fajr, up to 60 minutes before it, or a chosen number of minutes before sunrise; on chosen weekdays. It follows the city, method, travel and DST like the reminders. The same engine later rings for Tahajjud (the last third of the night) and suhoor (Phase 12).
- **The ring.** The chosen adhan or a soft tone fades in over 30 seconds on the alarm sound channel, through silent mode and Focus or Do Not Disturb where the platform allows. The screen is the live Fajr sky in Night theme, the time in large type and one challenge.
- **Challenges.** The user picks one and can try it in setup:

  | Challenge | What the user does | How it is checked |
  | --- | --- | --- |
  | Steps | Walk 20 to 60 steps | The phone's step counter |
  | Your spot | Scan a code placed away from the bed: any barcode (a tube of toothpaste) or a card the app prints | Camera barcode scan, matched to the code saved in setup |
  | Move | 5 to 20 squats in front of the phone | On-device pose detection. In a dark room it first asks for a light, and the screen glows as a soft fill light |
  | Mind | Solve sums (three levels), or repeat the order in which stars light up | In the app, in the user's digits |
  | Aloud | Read the dua for waking (from `packages/content`) aloud | The microphone checks that a voice is heard for a few seconds; it never judges the words |
  | Shake | Shake the phone | The motion sensor: the option for anyone who cannot do the others |

- **No going back to sleep.** Backup alarms ring every two minutes for 20 minutes until the challenge is done, so stopping the sound from the lock screen is not enough. An optional "Still up?" check five minutes later rings again if it is not answered within two minutes.
- **Mercy.** A "Turn off" escape is always on screen: hold it for 10 seconds (illness, a sleeping baby, an emergency). No snooze by default; one 5-minute snooze can be turned on. Nothing records how a morning went: no counts, no history, no word about lateness. Afterwards the screen says how long Fajr lasts ("Fajr is here until sunrise at 06:31"), and logging stays the usual "I prayed".
- **Privacy.** Camera, microphone and motion data are processed in memory on the device, never stored or sent. The camera never looks at prayer, wudu, a prayer mat or a mosque (section 13).
- **Platforms.** iOS 26 and later through AlarmKit; on earlier versions setup says plainly that Fajr Rise needs iOS 26 (a notification cannot ring through silent mode, so it would be an alarm in name only). Android through exact alarms, a full-screen alarm screen and a ringing service. Not on web.
- **Where.** Fajr's row on Today, Settings → Reminders, the Tools hub, and one offer card in the first week (in the verse of the day's place), never shown again once dismissed.

### 5.11 Tools hub, greeting and share cards

- **Tools hub.** Today's tools row opens a Tools screen with every tool: Qibla, Hijri calendar, Fajr Rise, and later the monthly timetable, masjid, Zakat, Hajj and Umrah and Learn to pray (Phase 12). The user pins up to four to Today's row; the rest stay one tap away. This replaces a fifth tab.
- **Greeting.** Today's hero opens with a short greeting for the time of day in the user's language ("Good morning", "Good evening"); nothing else is added to the hero.
- **Share cards.** Any ayah, dhikr, dua or Name shares as an image card in the user's language and theme, with its source reference and the app's mark small in a corner. Seasonal greeting cards (Ramadan, Eid, Jumu'ah) carry the user's own words or a greeting from `packages/content`. Cards are drawn on the device (Skia on mobile, the HarfBuzz pipeline in `apps/web/src/lib/og` on web), so Arabic joins and keeps its marks.

## 6. Design system: "Quiet Light"

The visual language is light itself: the real sky is the only strong color, UI surfaces float over it like paper and glass, and one warm lantern accent marks what matters. It must look like nothing else in the category: no green-and-gold clichés, no mosque silhouettes, no crescent on every icon, no generic purple gradients.

**Direction references** (for feel only, never copy assets): the sky backgrounds of Apple Weather, the calm crispness of Things 3, the gentle tone of Headspace, the motion precision of Linear.

### 6.1 Color

Themes: Light ("Day paper"), Dark ("Night") and Auto. Auto follows the system by default, with an option to follow prayer times (dark from Maghrib to Fajr). Notifications for Fajr and Isha always open into dark UI so nobody is blinded at night.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | #F7F4EE | #0E1116 | App background off Today |
| `surface` | #FFFFFF | #161A21 | Cards, sheets |
| `surface-glass` | #FFFFFF at 70% + blur | #161A21 at 60% + blur | Cards over the sky (Today only) |
| `text` | #1C1B19 | #F2EFE8 | Primary text |
| `text-muted` | #6B665D | #A39F96 | Secondary text |
| `hairline` | #1C1B19 at 8% | #F2EFE8 at 10% | Dividers, borders |
| `lantern` | #C98A2E | #E8B25A | The one accent: primary action, logged-prayer lights, focus |
| `positive` | #2F7D6D | #5FB8A3 | Rare confirmations outside prayer lights |
| `danger` | #B5483B | #E07A6C | Destructive actions only (delete data). Never used for worship. |

These are starting values. Final values must pass WCAG AA (4.5:1 for body text, 3:1 for large text and UI) in both themes.

**Sky gradients** are interpolated continuously from sun altitude, never switched abruptly. Anchor stops (top to bottom):

| Period | Top | Bottom |
| --- | --- | --- |
| Fajr | #1E2A4A | #C98B8B |
| Sunrise | #F4C79A | #A9C7E3 |
| Dhuhr | #6FA8DC | #E8F1FA |
| Asr | #8DB4D9 | #F2D49B |
| Maghrib | #3B2D5C | #E9876B |
| Isha and night | #0B1020 | #1C2541 |

Text never sits directly on a gradient, except hero display text with a subtle scrim that keeps AA contrast.

### 6.2 Typography

Three families only:

1. **UI: Readex Pro** (variable, Arabic and Latin designed together, so Arabic, English and French UI feel like one voice). Alternative if needed: IBM Plex Sans Arabic with IBM Plex Sans.
2. **Sacred Arabic text** (adhkar, duas, hadith): **Amiri**, a classical naskh.
3. **Quran:** the King Fahd Complex Uthmani Hafs font for verse-by-verse view, the QPC page fonts for mushaf view, and a surah-name ligature font for calligraphic surah titles (sources in section 10).

Type scale (sizes in pt or px; Arabic runs larger and looser than Latin):

| Token | Latin size / line height | Arabic size / line height | Weight |
| --- | --- | --- | --- |
| `display` | 40 / 1.15 | 42 / 1.35 | 600 |
| `title-1` | 28 / 1.2 | 30 / 1.45 | 600 |
| `title-2` | 22 / 1.25 | 24 / 1.5 | 600 |
| `headline` | 18 / 1.35 | 19 / 1.6 | 500 |
| `body` | 16 / 1.5 | 18 / 1.75 | 400 |
| `callout` | 15 / 1.45 | 16 / 1.7 | 400 |
| `caption` | 13 / 1.4 | 14 / 1.6 | 400 |
| `quran` | not applicable | 28 / 2.1 (user range 20 to 48) | 400 |
| `dhikr` | not applicable | 24 / 1.9 | 400 |

All text scales with system text size and the in-app comfort size. Never letter-space Arabic. Never use fake bold or italic on Arabic.

### 6.3 Space, shape and depth

- **Spacing:** 4-point grid. Tokens 4, 8, 12, 16, 24, 32, 48, 64.
- **Radius:** 12 for controls, 20 for cards, 28 for sheets, full for pills.
- **Touch targets:** at least 48 by 48 everywhere (elders and kids).
- **Width:** reading content max 720 px on web; page layouts max 1200 px.
- **Depth:** glass cards with backdrop blur only over the sky on Today; solid surfaces elsewhere for readability. Shadows are soft and layered, never harsh. In dark mode, use a hairline border instead of shadow.
- **Icons:** one line icon set (Phosphor or Lucide) at a consistent 1.5 to 1.75 stroke. Custom glyphs for the five prayers showing the sun's position on an arc. Directional icons mirror in RTL; clocks, checks and media controls do not.
- **Pattern:** one geometric motif (an eight-fold star lattice) at 4% opacity or less, used only in empty states, the Qibla ring and the splash. Never behind text.

### 6.4 Motion

Motion has three jobs only: explain where things come from and go, confirm that an action happened, and calm through slow ambient change. It is never decoration near reading content.

| Token | Value | Use |
| --- | --- | --- |
| `instant` | 100 ms | Press states, toggles |
| `quick` | 200 ms | Tab cross-fades, small reveals |
| `standard` | 300 ms | Screen and sheet transitions |
| `gentle` | 500 ms | Celebrations, morphs |
| `ambient` | 1200 ms or more | Sky shifts, star fades |
| `spring-snappy` | stiffness 400, damping 30 | Presses, counters |
| `spring-gentle` | stiffness 170, damping 26 | Sheets, cards, shared elements |
| `spring-soft` | stiffness 100, damping 20 | Celebration lights, Qibla ring |
| `ease-standard` | cubic-bezier(0.2, 0, 0, 1) | Non-spring enters |
| `ease-exit` | cubic-bezier(0.3, 0, 1, 1) | Exits |

Signature patterns:

- **Every pressable:** scales to 0.97 on press, springs back on release.
- **Screen push:** shared-element transitions (surah row to reader title, prayer row to its detail sheet).
- **Tab switch:** 200 ms cross-fade with an 8 px slide in the reading direction, mirrored in RTL.
- **Sheets:** spring up; the screen behind dims and scales to 0.96; drag to dismiss.
- **Lists:** staggered enter (30 ms per item, first 8 items, first load only).
- **Numbers:** countdown and counters roll digit by digit.
- **"I prayed":** button morphs to a check, a light rises along a curve into the sky over 800 ms, success haptic.
- **Tasbih:** the digit rolls and the bead ring advances one bead with a snappy spring.
- **Qibla:** heading passes through a low-pass filter and a spring so the needle never jitters.

Rules: animate transform and opacity (plus the sky gradient); run native animations on the UI thread; hold 60 fps on a three-year-old mid-range Android phone and use 120 Hz where available. With Reduce Motion on, movement becomes fades and ambient motion and particles stop.

### 6.5 Haptics and sound

- Light selection: tab change, toggles, each tasbih tap.
- Medium impact: finishing a dhikr's count, Qibla alignment.
- Success notification: prayer logged, tasbih target reached.
- No haptics on scroll. One setting turns all haptics off. No haptics on web.
- Sound is only the adhan, Quran recitation and an optional tasbih click (off by default).

### 6.6 Components to build first

Text (script-aware), Button (primary, secondary, ghost, large), IconButton, Card (solid, glass), ListRow, Sheet, Toggle, SegmentedControl, Slider, ProgressRing, Countdown, Toast, EmptyState, Skeleton, TabBar, SkyBackground, PrayerRow, AyahText, DhikrCard. Every component has default, pressed, focus-visible, disabled and loading states, in both themes and both directions.

**States:** skeletons shaped like the real content (no spinner visible longer than 300 ms), empty states with one warm sentence and one action, errors in plain words with one way forward.

### 6.7 Brand, icon and illustration

The identity is the sky and one light, recognizable from the icon alone. We match the polish of the best apps in the category, never their palette or layouts.

- **Mark.** One eight-pointed star from the lattice (6.3), in lantern light, rising over the horizon arc of the prayer glyphs: the guide above the day. The wordmark "المُرشِد" is drawn from Readex Pro's Arabic with refined joins, with "Al-Murshid" in Readex Pro beside it; Arabic leads every lockup.
- **App icon.** The mark over the Fajr gradient. Light, dark and tinted variants on iOS; adaptive and monochrome on Android. Alternate icons chosen in Appearance: Night (Ramadan), Dawn (Eid) and a discreet neutral icon (section 13).
- **Illustration: paper and light.** Abstract layered paper horizons and glass, tinted live by the current sky, for onboarding, empty states, Fajr Rise and the landing page. No objects, buildings or people, never behind text. An optional tilt parallax of a few points stops with Reduce Motion.
- **Surah headers.** An ornamental frame drawn from the star lattice in lantern ink around the calligraphic surah name, static, in the verse-by-verse and Arabic-only views. Mushaf pages keep their printed headers.
- **Reciters.** Portraits only with the reciter's or publisher's permission; otherwise the reciter's name as an Arabic monogram on a sky tile.
- **Store screenshots.** One story, "the day in five lights": eight screens per platform and language, each over its prayer's sky, with one short line on each.

## 7. Arabic first, then English and French

Arabic is the design language, not a translation. English and French are full peers in v1, and adding a fourth language (Turkish, Indonesian, Urdu) must be a content task, never a code task.

**Locales and switching**

- Locales: `ar` (default), `en`, `fr`. The language is changeable at any time in Settings.
- Switching between same-direction languages (English and French) is instant.
- On mobile, switching between Arabic and a left-to-right language flips the layout direction, which React Native has traditionally applied only after a reload. Do it gracefully: persist the choice, then reload behind a branded cross-fade so it feels intentional. Check whether the current React Native version can switch direction at runtime and prefer that if it is reliable.
- On web, the locale is the first URL segment and sets `<html lang dir>`. Switching navigates to the same page in the other locale.

**Layout direction**

- Feature code uses logical properties only (start and end, never left and right). Add a lint rule that rejects physical direction utilities and styles.
- Mirror layout, navigation, progress bars (they fill from the start side) and directional icons (back, chevrons).
- Never mirror clocks, check marks, media controls, numbers or the Quran page turn.
- Content direction is separate from UI direction. An English translation under an Arabic ayah in an Arabic UI is a left-to-right block. Wrap user content and mixed-script strings in bidi isolates (`<bdi>` on web, Unicode isolate marks on native).

**Numbers, dates and time**

- Digits setting: Auto, Arabic-Indic (٠١٢٣) or Western (0123). Auto uses Western digits in every language, Arabic included (owner decision, Oct 18, 2026); Arabic-Indic digits are an opt-in.
- Ayah numbers inside Quran text always use Arabic-Indic digits in the traditional marker.
- Use `Intl` for numbers, dates, times and lists. Time format (12 or 24 hour) follows the device, with an override.
- Hijri dates use the Umm al-Qura calendar. Verify that the JavaScript engine on each platform supports it through `Intl`; otherwise use one tested conversion in the shared core package for both apps.

**Writing for Arabic**

- Plurals use ICU message format. Arabic has six plural categories (zero, one, two, few, many, other) and every count string must cover them.
- Arabic verbs and pronouns change with the gender of the person addressed. Prefer neutral phrasing ("حان وقت العصر" rather than an imperative). Offer an optional "How should we address you?" setting (masculine, feminine, neutral) that feeds ICU `select` where neutral phrasing is not possible.
- Arabic copy is written natively in warm, simple Modern Standard Arabic, never machine-translated. French and English copy is reviewed by native speakers.
- A shared glossary fixes religious terms per language. Prayer names stay Arabic in every language, with standard local spellings (French: Fajr, Dohr, Asr, Maghreb, Icha).

**String management**

- All strings live in `packages/i18n`, one JSON file per namespace per locale (for example `today.json`), with dotted keys such as `today.hero.now`.
- Both apps use the same keys and the same message files. A CI check fails the build when any key is missing in any locale.
- Test with pseudo-localization (strings 40% longer) to catch overflow, and with screenshots of every screen in `ar`, `en` and `fr`, light and dark.

## 8. Technical architecture

One pnpm + Turborepo monorepo holds a Next.js web app, an Expo mobile app and shared TypeScript packages for everything that is not pixels. UI is written per platform from the same design tokens, so each app feels native while behaving identically.

As of mid-October 2026, Next.js 16.x is the stable web line ([source](https://releases.sh/vercel/nextjs.md)). Expo SDK 57 ships React Native 0.86 and React 19.2 ([source](https://expo.dev/changelog/sdk-57)), and SDK 58 with React Native 0.88 has been in beta since September ([source](https://expo.dev/changelog/sdk-58-beta)). Use the newest stable of each at scaffold time.

### 8.1 Repository layout

```
al-murshid/
  apps/
    web/            Next.js (App Router), public SEO pages + signed-in app
    mobile/         Expo (Expo Router), iOS + Android
  packages/
    core/           Pure TS: prayer times, sun position (sky), Qibla bearing,
                    Hijri, Journey rules, reminder scheduling plan. No React.
    content/        Quran metadata, adhkar, duas, 99 Names (JSON + refs),
                    import scripts for source data, content version
    i18n/           ICU message files (ar, en, fr), glossary, digits/direction utils
    tokens/         Design tokens in TS -> generated theme.css (Tailwind v4)
                    + TS constants (springs, durations) for native
    data/           Supabase generated types, Zod schemas, sync logic
    config/         tsconfig, ESLint (incl. logical-properties rule), Prettier
  supabase/         migrations, seed, RLS tests, edge functions
  docs/             SPEC.md, DECISIONS.md
```

Rules: `core`, `content`, `i18n`, `tokens` and `data` never import React, Next.js or React Native. `core` has 100% unit-test coverage of prayer, Qibla, Hijri and Journey logic.

### 8.2 Web (apps/web)

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16.x, App Router, React 19.2, TypeScript strict, Turbopack | Server Components for public pages; client components only where interactive |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Theme variables generated from `packages/tokens`; logical utilities only |
| UI primitives | shadcn/ui on Radix or Base UI | Copied in and fully restyled to Quiet Light; never shipped with default look |
| Animation | Motion (`motion/react`) + View Transitions for route changes | Springs from tokens; respect `prefers-reduced-motion` |
| i18n | next-intl with `/[locale]` routing | Same ICU messages as mobile from `packages/i18n` |
| Server state | TanStack Query + `@supabase/ssr` | Auth via cookies; RLS enforces access |
| Local state | Zustand | UI state only |
| Offline data | Dexie (IndexedDB) | Prayer logs, bookmarks, last read when signed out |
| PWA | Serwist | Offline Quran reading for visited surahs, install prompt |
| Speech recognition | Transformers.js with an open Quran model, in the browser | Recitation check (Phase 5b); audio never leaves the device |
| Icons | Phosphor (same set on mobile) | Regular and light weights only |
| Fonts | `next/font` for Readex Pro and Amiri; self-hosted Quran fonts | Subset and preload; no layout shift |
| Hosting | Vercel Hobby or Cloudflare (free tiers) | Static and incremental rendering for city and surah pages |

Public pages (`/prayer-times/...`, `/quran/...`, `/adhkar/...`, `/duas/...`) are statically generated or incrementally revalidated, include JSON-LD, Open Graph images generated per page, and score 95+ on Lighthouse performance and accessibility.

### 8.3 Mobile (apps/mobile)

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Expo (latest stable SDK), New Architecture, development builds (not Expo Go) | Continuous native generation; no committed `ios/` or `android/` |
| Navigation | Expo Router with native stacks and NativeTabs | File-based routes mirror web paths for deep links |
| Styling | Uniwind (Tailwind v4 for React Native) | Consumes the same generated theme as web; fallback: Unistyles 3 |
| Animation | Reanimated 4 + Worklets + Gesture Handler | All motion on the UI thread |
| Custom drawing | React Native Skia | Sky gradient and stars, prayer lights, Qibla ring, progress rings |
| Native controls | `@expo/ui` (SwiftUI and Jetpack Compose) | Settings toggles, pickers, sliders, sheets; custom UI for signature screens |
| Lists | FlashList | Surah list, verse lists, adhkar |
| Local database | `expo-sqlite` + Drizzle ORM | Source of truth for personal data |
| Key-value | MMKV | Settings, last position, flags |
| Notifications | `expo-notifications` | Local scheduling, actionable "I prayed" |
| Location and heading | `expo-location` (true heading) | Manual city fallback |
| Audio | `expo-audio` if it covers background play and lock-screen controls in the current SDK; else `react-native-track-player` | Downloads to app storage |
| Speech recognition | `whisper.rn` (whisper.cpp) with an open Quran model | Recitation check (Phase 5b); on the device only |
| Haptics | `expo-haptics` | Mapped in section 6.5 |
| Widgets | Expo iOS widgets (stable since SDK 56); `react-native-android-widget` for Android | Read from shared app-group storage |
| Other | `expo-image`, `expo-font`, `expo-localization`, `expo-keep-awake`, `expo-local-authentication`, `expo-secure-store`, `expo-glass-effect` (iOS) |  |
| Release | EAS free plan (Build, Submit, Update); eas build --local when free build credits run out | OTA updates for JS and content fixes |

### 8.4 Cross-cutting

- **Validation:** Zod schemas in `packages/data`, shared by both apps and edge functions.
- **Prayer times:** `adhan` (adhan-js) inside `packages/core`, wrapped so both apps call one function with the same inputs.
- **Testing:** Vitest for packages, Playwright for web flows and screenshots, Maestro for mobile flows, React Native Testing Library for components.
- **Monitoring:** Sentry (free Developer plan) with PII scrubbing on both apps.
- **Analytics:** opt-in only, cookie-free and aggregate (PostHog free tier in cookieless mode, without identifiers, on both apps). Never send worship logs or reflection content.
- **CI:** type-check, lint, unit tests, i18n key check, web build and Lighthouse budget on every pull request; EAS preview builds on demand.

**Cost policy: free tools only.** Every library is open source and every service runs on its free tier: Supabase Free, Vercel Hobby or Cloudflare, EAS Free, Cloudflare R2, Sentry Developer, PostHog Free. Never use paid plans or paid add-ons (for example Motion+ or paid component kits). Supabase free projects pause after a period of inactivity, so expect to resume them from the dashboard during development. Vercel Hobby is for non-commercial use; if the app ever earns money, move the web app to Cloudflare. The only unavoidable costs are store fees (Apple Developer Program yearly, Google Play one-time) and an optional custom domain.

## 9. Data, Supabase and privacy

Personal data lives on the device first. Supabase adds optional accounts, backup and multi-device sync. Reflections and Quran notes never leave the device in v1.

**Principles**

- Every feature works without an account. An account only adds backup and sync.
- Auth: email one-time code, Sign in with Apple and Google, via Supabase Auth.
- Host the Supabase project in an EU region (close to Tunisia and France, and GDPR-friendly).
- Row Level Security on every table (`user_id = auth.uid()`), with RLS tests in CI.
- The recitation check processes audio in memory on the device; it is never stored or sent. Fajr Rise's camera, microphone and motion challenges work the same way.
- Data minimization: precise coordinates stay on the device. The server stores the city label and coordinates rounded to 2 decimals (about 1 km).
- Clients use only the publishable key. The service role key lives only in edge functions and CI secrets.

**Synced tables (Postgres)**

| Table | Key | Main columns | Merge rule |
| --- | --- | --- | --- |
| `profiles` | `user_id` | locale, address form, digits preference | Last write wins |
| `settings` | `user_id` | calculation method, Asr school, high-latitude rule, Hijri offset, city label, rounded coordinates, time zone, theme, comfort size, simple view, reminders (jsonb), Quran preferences (jsonb) | Last write wins |
| `prayer_logs` | `user_id, date, prayer` | logged\_at, source (app, notification, widget), deleted | Union; idempotent |
| `fasting_logs` | `user_id, date` | fasted, deleted | Union; idempotent |
| `journey_state` | `user_id, track` | current step, step history (jsonb) | Last write wins |
| `reading_progress` | `user_id` | last surah, ayah and page | Last write wins |
| `quran_bookmarks` | `id` (uuid) | surah, ayah, ayah\_end (a range), color, deleted | Last write wins per row |
| `khatmah_plans` | `id` (uuid) | start date, target date, pages per day, current page, status | Last write wins per row |
| `tasbih_daily` | `user_id, date, phrase, device_id` | count | Per-device rows, summed on read |

Every synced row carries `updated_at` (client), `server_updated_at` (set by trigger) and a `deleted` tombstone. All tables cascade on user deletion.

**Local-only in v1:** night reflections, Quran notes, app lock settings and Qibla calibration, encrypted at rest on device; and Fajr Rise's alarms with the code saved for "Your spot" (an alarm belongs to one phone, so two synced phones never both ring; nothing in them is personal, so they are not encrypted).

**Sync design (simple because the data is simple)**

- Push: upsert dirty rows in batches on their natural keys.
- Pull: fetch rows where `server_updated_at` is newer than the last pull.
- Triggers: app foreground, 10 seconds after a local write (debounced), and network regained. No polling loop and no checksums.
- First sign-in merges local and server data as a union. Signing in never deletes local data.
- Sign-out asks whether to keep data on this device.
- In-app account deletion (required by Apple) calls an edge function that deletes the auth user and all rows, then wipes local data.

**Content is not in the database**

- Quran text, translations, adhkar, duas and the 99 Names are bundled with the apps from `packages/content`. The app works fully offline from first launch.
- Large assets (mushaf page fonts, recitation audio) download on demand from a CDN with immutable, versioned URLs (Cloudflare R2 free tier, which charges no egress; Supabase Storage's free quota is too small for recitations).
- City prayer-time pages on web are generated from an open cities dataset (for example GeoNames cities above 15,000 people, CC BY 4.0, with attribution).

**Edge functions in v1:** `delete-account` only.

## 10. Content sources and religious accuracy

Trust is the product: one wrong diacritic in the Quran or one fabricated hadith undoes all the design work. Every religious text comes from a named source, carries its reference, is reviewed by a qualified person, and is never generated or edited by AI.

| Content | Source | Requirement |
| --- | --- | --- |
| Quran text (Uthmani, Hafs) | Tanzil or the King Fahd Complex text | Never modified; a CI test compares a hash of the bundled text with the source |
| Quran fonts, mushaf layouts (Madani 1405H, 1421H and 1441H; Indopak), surah-name font, word by word, transliteration, tafsir, recitation timestamps | [Quranic Universal Library (QUL)](https://qul.tarteel.ai/resources) | QUL resources are meant to be downloaded and packaged with your app (no API); check and record each resource's license and credit |
| Translations | Per language, chosen from licensed options (for example a short Arabic tafsir such as Al-Muyassar; established English and French translations) | Each translation's copyright checked; written permission where required; license recorded in the content manifest |
| Recitation audio | Reciters available with timestamps through QUL or the reciter's publisher | Redistribution rights confirmed per reciter before hosting on our CDN |
| Recitation check model | [`tarteel-ai/whisper-base-ar-quran`](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) (Apache-2.0) | Runs on the device; its output only marks published words and is never shown as Quran text |
| Adhkar and duas | Authentic hadith (sahih or hasan) with collection, number and grading | Translations written in-house or licensed, then reviewed |
| 99 Names of Allah | The commonly cited list, with a note that the enumeration is scholarly discussion | Meanings and reflections written in-house, then reviewed |
| Guides: wudu, salah, Hajj and Umrah steps (Phase 12) | A named published guide in each language | Reviewed like adhkar; illustrations show no faces |
| Prayer calculation | `adhan` methods plus a reviewed country-to-method map | Defaults follow each country's official practice; users can change method and adjust minutes per prayer |

**Content pipeline**

- All content lives in `packages/content` as JSON validated by a schema: `id`, `arabic`, `translations` (en, fr), `transliteration` (en, fr), `reference` (collection, number, grading), `review` (reviewer, date).
- CI fails if any item lacks a reference, a review record or a translation for a supported locale.
- A qualified reviewer (an imam or student of knowledge) signs off on every religious text in every language before launch, and on every later change.
- The country-to-method map covers at least Tunisia, Algeria, Morocco, Egypt, Saudi Arabia and the Gulf, Turkey, France, the UK and North America. Verify each against current official practice and record the source.
- The About screen lists every source, translator, reciter and license, and states that the app does not issue religious rulings.

## 11. Performance, accessibility and the polish checklist

These budgets are release blockers, not goals. Measure them on real mid-range devices, not only on a development machine.

| Area | Budget |
| --- | --- |
| Mobile cold start to interactive Today | Under 1.5 s on a mid-range Android phone; under 1 s on a recent iPhone |
| Animation | 60 fps sustained in every transition on a three-year-old mid-range Android phone |
| Web public pages (4G) | LCP under 2.0 s, CLS under 0.05, INP under 150 ms |
| Lighthouse (public pages) | Performance 95+, Accessibility 100, SEO 100 |
| Web first-load JS per public route | Under 150 KB gzipped |
| Offline | Today, reminders, Qibla, Quran text, Remember and You all work in airplane mode |
| Stability | 99.8% or more crash-free sessions |
| Prayer-time accuracy | Matches the selected method's reference values within 1 minute in automated tests across 20+ cities, including high latitudes |

**Accessibility**

- WCAG 2.2 AA on web, with the same standard applied on native.
- Complete VoiceOver and TalkBack labels in Arabic, English and French. Each ayah announces its surah and number.
- Text scales to 200% with no truncation or overlap.
- Color never carries meaning alone. Reduce Motion and Reduce Transparency are honored (glass becomes solid).
- Visible focus rings, full keyboard navigation and a skip link on web.
- Touch targets of at least 48 by 48.

**Polish checklist (every screen, before it is called done)**

- [ ] Uses tokens only; no hard-coded colors, sizes, radii or durations
- [ ] Screenshots reviewed in `ar`, `en`, `fr`, light and dark
- [ ] Loading, empty, error and offline states designed and implemented
- [ ] Press feedback, transitions and haptics follow section 6
- [ ] Accessibility labels, roles and focus order verified with a screen reader
- [ ] Checked on a small phone (360 dp wide), a large phone, a tablet and web at 1280 and 1920 px
- [ ] Unit tests for logic and one end-to-end flow test

## 12. Build phases and definition of done

Build in nine phases, plus Phase 5b (added by the owner on 2026-10-19) and Phases 7b and 7c (added on 2026-10-23, after studying Ameen), one at a time. Phases 10 to 14 follow launch. A phase is done only when its gate passes; never start the next phase with the previous gate open.

1. **Foundation.** Monorepo, shared configs, CI, `tokens` generating the theme for both apps, `i18n` with all three locales, fonts, Supabase project with migrations and RLS tests.
   - Gate: both apps boot to a token showcase screen in `ar`, `en`, `fr`, light and dark; CI is green.
2. **Design system.** All section 6.6 components in both apps, a component gallery (web route `/dev/gallery`, mobile dev screen), motion tokens, the SkyBackground (Skia on mobile, CSS on web).
   - Gate: gallery reviewed against section 6; the sky holds 60 fps on a mid-range Android phone.
3. **Core engine.** Prayer times, sun position, Qibla bearing, Hijri, Journey rules and the reminder scheduling plan in `packages/core`, fully tested.
   - Gate: accuracy tests pass for 20+ cities, including high latitudes and DST changes.
4. **Today.** Onboarding, Today, logging, reminders with the "I prayed" action, Qibla and Hijri calendar, on mobile and web.
   - Gate: the full daily loop works offline and passes the polish checklist.
5. **Quran.** Content import pipeline, both reader views, word by word, audio with sync and downloads, bookmarks, khatmah plan.
   - Gate: Quran text hash test passes; audio highlight stays in sync; downloads work offline.
5b. **Quran depth.** Reading views, the 1405H, 1441H and Indopak editions, tajweed colors, a reciter catalog with whole-reciter downloads, tafsir, range bookmarks, memorization tools and a recitation-check prototype. Plan and source list: `docs/PHASE-5B.md`.
   - Gate: every edition's text and layout tests pass; tajweed renders in light, dark and sepia on web and Android; hiding never reflows a line; downloaded reciters play offline; the recitation check has a recorded go or no-go from measurements on a mid-range Android phone.
6. **Public web pages.** Server-rendered prayer-time, surah, ayah, adhkar and dua pages with SEO metadata and Open Graph images. Deploy these early, because search indexing takes months.
   - Gate: Lighthouse budgets met; pages indexed in a search console.
7. **Remember, You and seasons.** Adhkar, duas by feeling, tasbih, 99 Names, Your Sky, Journey, night reflection, Ramadan, Dhul Hijjah and Jumu'ah modes, widgets.
   - Gate: polish checklist on every screen; Ramadan mode verified with a simulated date.
7b. **Fajr Rise.** The alarm engine on Android and iOS (AlarmKit), the ring screen, the six challenges, backup alarms, the "Still up?" check and the escape (5.10). Plan: `docs/PHASE-7B.md`.
   - Gate: on a real Android phone and in the iOS Simulator, the alarm rings at the computed time with the screen locked, the sound off and Do Not Disturb or Focus on, over seven simulated mornings that cross a DST change and a time-zone change; every challenge works offline in `ar`, `en` and `fr`; stopping from the lock screen or force-quitting still brings the next backup; no camera frame or audio reaches storage. A real iPhone confirms it in Phase 9.
7c. **Identity and home.** The final mark, app icons and alternate icons, the paper-and-light illustrations, surah headers, Today's greeting and Tools hub, share and greeting cards, the landing page, and a first set of store screenshots (5.11, 6.7, section 4).
   - Gate: the icon reads at 29 pt and on light, dark and tinted home screens; the landing page meets the section 11 budgets in `ar`, `en` and `fr`; share cards keep Arabic joined with its marks on both platforms.
8. **Accounts and sync.** Sign-in, sync engine, first-sign-in merge, export, account deletion.
   - Gate: two devices converge after offline edits on both; deletion removes all server rows.
9. **Hardening and launch.** Performance and accessibility audits, content review sign-off, privacy policy and store privacy labels, store screenshots in three languages, a closed beta of 20 to 50 users.
   - Gate: every section 11 budget met; beta feedback triaged; reviewer sign-off recorded.

**After launch (v1.x).** One phase at a time, in this order unless the owner reorders them. Each ships on mobile and web where it applies and passes the polish checklist.

10. **Listen.** A player that feels like an instrument: reciter portraits (with permission) or monograms, favorites, recitation styles (murattal, mujawwad, teaching, short selections), sleep timer, continue listening, the mini player on every tab, listening counted toward the khatmah if the user wants. Quran radio and live audio from Makkah and Madinah only as audio streams whose broadcaster permits it, with no trackers. Adhkar audio and more adhan voices, with rights. CarPlay and Android Auto.
    - Gate: two hours of background playback without a drop on a mid-range Android phone; CarPlay and Android Auto pass in their simulators; every stream's permission recorded.
11. **Study.** More tafsirs from QUL (licenses recorded), up to three side by side (columns on web desktop, swipe on mobile). Search by meaning on the device: the translations, reviewed adhkar and duas, and the Names are embedded at build time with an open multilingual model, the query runs on the phone, and results are only referenced texts, never generated ones (the first step toward Ask, section 13). Sajdah markers in every view. Hifz plans: memorize and review on a spaced schedule, built on Phase 5b's hiding and repeats.
    - Gate: search by meaning returns the expected references for a reviewed set of 50 queries per language, offline, with a model download under 60 MB.
12. **Tools for the day.** Each in the Tools hub:
    - Monthly timetable per city, Hijri or Gregorian: print and PDF on web (also public pages per month), an image to share in the app.
    - Your masjid: a masjid from OpenStreetMap with its iqamah times; "Iqamah at Masjid Al-Fath in 10 minutes"; on arrival (a geofence on the phone) a gentle reminder to silence the phone, or Do Not Disturb on Android if the user allows it. A masjid finder on the same data.
    - Voluntary fasts (Mondays and Thursdays, the white days, Ashura, Arafah, six of Shawwal) with reminders, the "fasted / not today" log and a suhoor alarm from Fajr Rise.
    - Tahajjud and Duha: the last third of the night and the Duha window on demand under Today's list, with an optional Tahajjud alarm from Fajr Rise.
    - Your duas: a private list of the user's own duas, with optional reminders at the moments the Sunnah names (between adhan and iqamah, the last hour of Friday, before iftar, the last third of the night), each with its reviewed reference. Local only, behind the You lock.
    - Dates to remember: personal Hijri dates with yearly reminders.
    - Zakat calculator: savings, gold, silver and cash against the nisab, from a price the user enters or a free price source, with a plain note that it is a calculator and a scholar answers questions.
    - Hajj and Umrah: the steps from a reviewed guide, offline, with a lap counter for tawaf and sa'i (seven laps, the current one in large type, a haptic per lap).
    - Learn to pray: wudu and salah step by step for "Just starting" users and children, reviewed, with simple illustrations that show no faces.
    - Gate: the polish checklist per tool; the reviewer signs off every text.
13. **Everywhere.** Interactive widgets (log a prayer, count tasbih) and more of them (Hijri date, Jumu'ah, khatmah, Ramadan, a daily ayah from a reviewed set), with sky or plain styles. Live Activities and the Dynamic Island for the next prayer and iftar, and Android's ongoing countdown, both opt-in. Apple Watch and Wear OS: the next prayer as a complication, tasbih on the wrist, Fajr Rise on the wrist. Siri, Shortcuts and Android App Actions ("log my prayer", "when is Asr"). Tablet layouts on iPad. Web push reminders.
    - Gate: each surface in `ar` and `en`, light and dark, on its simulator and one real device.
14. **Together.** Family circles and Ask (section 13), a revocable link that shares a hifz plan's progress with one teacher, and more languages (Turkish, Indonesian, Urdu, Bengali).
    - Gate: nothing about a person's worship is visible to anyone without that person's opt-in, verified by RLS tests.

**Content track (alongside every phase).** The largest gap with Ameen is reviewed content, not code: the adhkar and duas (Hisn al-Muslim from a named source), the tasbih phrases, the 99 Names and the dua for waking, then guides and more tafsirs. Import each into `packages/content` with its reference as soon as its source and license are confirmed, and find the reviewer now: launch (Phase 9) is blocked without their sign-off.

**Working rhythm inside a phase:** plan the screen in a few lines, build it, run it on web and both simulators, screenshot it in Arabic and English, apply the polish checklist, then commit in a small, focused change. Record any deviation from this spec in `docs/DECISIONS.md`.

## 13. Out of scope and explicitly cut

Section 5 is the core of v1, and Claude Code may add small creative touches that serve the principles. The items below are either planned for later, with their intended shape, or cut permanently.

**Later (not v1)**

| Feature | Intended shape | When |
| --- | --- | --- |
| Ask (AI) | Retrieval only over our verified content: returns verses, duas and adhkar with references. Never gives rulings, never generates religious text, opt-in, queries not stored. Runs behind an edge function. | Phase 14; search by meaning on the device comes first, in Phase 11 |
| Family circles | Private groups of up to 8 for a shared khatmah and gentle nudges. Nobody's prayer data is visible unless each member opts in. | Phase 14 |
| Masjid finder and Zakat calculator | Tools in the Tools hub | Phase 12 |
| Discreet icon | Optional neutral alternate app icon for users who need privacy | Phase 7c |
| Hifz plans | Memorization schedules and review cycles. Hiding words, repeating a range and the recitation check arrive earlier, in Phase 5b | Phase 11 |
| Platform extras | Apple Watch and Wear OS, Live Activities, Siri and Shortcuts actions ("log my prayer"), CarPlay and Android Auto | Phases 10 and 13 |
| Web reminders | Web push for prayer times | Phase 13 |
| More languages | Turkish, Indonesian, Urdu, Bengali | Phase 14 |

**Cut permanently (do not build)**

- Points, XP, levels, ranks and badges
- Any faith or "iman" score
- Public leaderboards, community feeds and heatmaps of other people's worship
- Quiz games such as the old Knowledge Duel (Fajr Rise's Mind challenge is sums and memory, never questions about religion)
- Camera check-ins for prayer or wudu (Fajr Rise's camera only confirms the user is up, looking at a code or a movement, never at worship; 5.10)
- Sleep and health tracking (Fajr Rise wakes; it records nothing about sleep)
- Ads, ad SDKs and any sale or sharing of user data
- AI-generated religious text of any kind
- Rulings (fatwas) of any kind, generated by AI or retrieved from collections of fatwas: the app does not issue or relay rulings, and they differ by school and country
- Red "missed" marks and streak counters

## 14. Claude Code setup: skills, plugins and tools

Install a small, non-overlapping set: one strong design skill, one UI auditor, the official Expo and Supabase skills, browser verification, plus a project skill made from this spec. Too many overlapping design skills give Claude conflicting advice, so this spec always wins when they disagree.

| What | Why it matters here | Install (run in your terminal or inside Claude Code) |
| --- | --- | --- |
| [frontend-design](https://www.remoteopenclaw.com/plugins/anthropics-claude-plugins-official/frontend-design) (Anthropic, official) | Pushes Claude toward a deliberate, distinctive aesthetic instead of the generic AI look | `/plugin install frontend-design@claude-plugins-official` |
| [Vercel agent skills](https://github.com/vercel-labs/agent-skills/wiki): web-design-guidelines, react-best-practices, react-view-transitions, react-native-guidelines | Audits UI against 100+ interface rules (accessibility, focus, interaction) and keeps React and Next.js code fast | `npx skills add vercel-labs/agent-skills` |
| [Expo plugin](https://docs.expo.dev/skills/) (official) | Skills for design systems, animation (Reanimated, gestures, haptics), native UI, Expo Router, project structure, store releases and OTA updates; also registers the Expo MCP server | `claude plugin install expo@claude-plugins-official` |
| [Supabase agent skills](https://github.com/supabase/agent-skills) | Postgres schema, index and Row Level Security best practices | `/plugin marketplace add supabase/agent-skills` then `/plugin install postgres-best-practices@supabase-agent-skills` |
| Supabase MCP server | Lets Claude inspect the schema, run migrations and generate types | Follow Supabase's MCP guide; connect only the development project, read-only where possible, never production |
| Playwright MCP (or Vercel's agent-browser) | Lets Claude open the web app, take screenshots in each locale and theme, and check its own work | `claude mcp add playwright -- npx @playwright/mcp@latest` |
| Context7 MCP (optional) | Pulls current docs for Next.js, Expo, Motion and Supabase so Claude does not code against stale APIs | Follow Context7's install guide |
| skill-creator (Anthropic, official) | Turns section 6 into a project skill that loads on every UI task | `/plugin install skill-creator@claude-plugins-official` |

Plugin and skill names change often; run `/plugin` inside Claude Code to browse what is current before installing.

**Project skill to create first:** ask Claude to use skill-creator to build `.claude/skills/quiet-light/SKILL.md` from sections 6 and 7 (tokens, type, motion, haptics, RTL rules, the polish checklist). That makes the design system load automatically whenever Claude touches UI.

**Starter `CLAUDE.md` for the repo root:**

```markdown
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
```

**Sources:** [Expo SDK 57](https://expo.dev/changelog/sdk-57) · [Expo SDK 58 beta](https://expo.dev/changelog/sdk-58-beta) · [Next.js releases](https://releases.sh/vercel/nextjs.md) · [Expo Skills](https://docs.expo.dev/skills/) · [Supabase agent skills](https://github.com/supabase/agent-skills) · [Vercel agent skills](https://github.com/vercel-labs/agent-skills/wiki) · [frontend-design plugin](https://www.remoteopenclaw.com/plugins/anthropics-claude-plugins-official/frontend-design) · [QUL resources](https://qul.tarteel.ai/resources)
