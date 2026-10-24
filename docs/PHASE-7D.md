# Phase 7d · Practical companions (plan)

2026-10-24. The owner picked fourteen of sixteen proposed ideas for the practical moments of the
day (not picked: the Qibla from the sun's shadow, and sadaqah and Zakat al-Fitr), and asked that
every one stay "simple and practical, that anyone understands and doesn't get confused". SPEC 2
(principle 2), 4, 5.11 and 12. Decisions made along the way go to `docs/DECISIONS.md`.

Thirteen build now, before Phase 8. The fourteenth, the Fajr buddy, links two people, so it needs
accounts: Phase 8b.

## Simple for anyone (the owner's rule, for every feature here)

- **One place each.** A feature lives where its moment already is (the prayer hero, the Qibla, the
  tasbih, Fajr Rise) or in the Tools hub. No new tab, and at most one short settings screen.
- **One obvious action, in plain words:** "I'm praying", "Use Istanbul's times", "Scan a product".
  Never a technical word on screen ("Do Not Disturb" is the platform's own name and stays; "ICS",
  "proximity" or "overlay" never appear).
- **Works with no setup.** Defaults that fit most people; a first use explains itself in one
  sentence; a permission is asked only when the person taps the action that needs it, with one
  line on why before the system prompt.
- **Nothing on by itself.** Anything that silences, pauses or watches stays off until the person
  turns it on, and turns off in one tap from the same place.
- **Facts, never rulings** (SPEC 13). The food and prayer helpers show what is known and where it
  comes from; a question of what is allowed goes to a scholar.
- **Mercy over metrics.** Nothing counts what was missed; the children's mode gives light, never
  a penalty.
- **Private.** Sensor and camera data stay in memory on the device; nothing about worship is kept
  beyond what the person logs.
- **The grandfather test.** Before a feature is done, a first-time user finishes its task in under
  30 seconds without help: an end-to-end flow per feature checks the same path.

## The thirteen, in build order

Simplest and most used first. Each lands on mobile, and on the web where it applies, in `ar`, `en`
and `fr`, light and dark.

### Around the prayer

1. **Travel times** (idea 8). Today's "You seem to be in {city}" card (SPEC 5.1) covers people
   who chose their city by hand too: when the phone's time zone no longer matches the city's,
   Today offers the main city of the new zone ("Your phone is on Istanbul time. Use Istanbul's
   prayer times?"). One tap switches; "Not now" is remembered for that zone. Reminders and Fajr
   Rise follow. Web and mobile.
2. **Prayer times in your calendar** (idea 4). "Add to my calendar" under Today's prayer list and
   on each city page: a calendar subscription (a web address that Google, Apple and Outlook
   calendars refresh by themselves) with the day's prayers for the city and method. Dhuhr and Asr
   can show as busy for 20 minutes so meetings avoid them. Nothing to install, no account.
3. **"I'm praying"** (idea 3). Inside a prayer's time, a quiet button under "I prayed": on Android
   it turns on Do Not Disturb for ten minutes (the access is granted once) and restores what was
   there; on iOS, where an app cannot change Focus, it keeps the app silent and says once how to
   add Do Not Disturb from Control Center. Ten minutes later: "Did you pray?" and "Yes" logs it.
4. **Tasbih without looking** (idea 14). In the tasbih, a "Count with the volume buttons" switch:
   each press counts, with a light haptic, a stronger one at 33 and at the target, so the phone
   can stay in a pocket. The screen dims but stays awake while counting.
5. **Bedtime for Fajr** (idea 5). After Isha, Today's one card can read "Sleep now and you have 6 h
   40 min before Fajr" (or before Fajr Rise when it is on), with the before-sleep adhkar in a dim
   view and an optional bedtime reminder at a time the person picks. It computes hours only and
   records nothing about sleep (SPEC 13).
6. **Rak'ah counter** (idea 2). In the Tools hub: place the phone in front of the prayer mat, just
   beyond where the forehead goes; each sujood passes over the proximity sensor, and a large, dim
   "Rak'ah 2 of 4" shows (the prayer chosen from the time, changeable). An aid for the memory, never
   a judge of the prayer: a short reviewed note says that when in doubt the prayer's own rules
   apply. Nothing is stored. Mobile only.
7. **Qibla through the camera** (idea 12). In the Qibla screen, a "Camera" switch: the camera view
   with the line toward the Kaaba and the distance, from the same heading as the compass. No frame
   is kept.
8. **Prayer Pause** (idea 1). In Settings → Reminders, off by default: pick the apps that pause
   when a prayer comes in. Opening one during the first minutes of the prayer shows a calm screen
   ("Dhuhr is here. Pray first?") with "Open anyway" one tap away. Android: usage access and
   drawing over other apps; iOS: Screen Time (Family Controls), once Apple grants the free
   entitlement (requested in this phase).
9. **Prayer times on a flight** (idea 7). In the Tools hub: departure and arrival airports and the
   take-off time; the app follows the great-circle route and lists the prayers that fall during
   the flight, at what time and roughly where, with the Qibla relative to the plane's direction.
   Airports from OurAirports (public domain), offline.

### Food, places, learning, children

10. **Halal places nearby** (idea 10). In the Tools hub: halal restaurants and prayer rooms around
    the person, from OpenStreetMap, with distance and directions in their own maps app. The screen
    says the tags come from the community and may be out of date.
11. **Ingredient check** (idea 9). In the Tools hub: scan a product's barcode (the camera Fajr Rise
    already uses) to see its ingredients from Open Food Facts, with the ones a reviewed list flags
    (gelatin, carmine E120, alcohol, lard...) highlighted and why each may matter. Never "halal" or
    "haram": "Not sure? Ask a scholar, or the maker." An unknown product opens Open Food Facts.
12. **Quranic Arabic, five minutes a day** (idea 13). In Quran: one card at a time with one of the
    Quran's most frequent words (from the word-by-word data), tap to see its meaning, then "Knew
    it" or "Again" on a spaced schedule. "The words you know make up {n}% of the Quran's text,"
    counted from the same data.
13. **Little ones** (idea 16). In You: a child's own prayer tracker on the same phone, five stars
    that light up for the child's day and a kind word with each, never a missed mark; Phase 12's
    "Learn to pray" guide comes forward once its reviewed text is in.

### Phase 8b, after accounts

14. **Fajr buddy** (idea 6). Pair with one person through a code. If Fajr Rise is still ringing
    ten minutes after it began, the buddy's phone shows "{name}'s Fajr alarm is still ringing.
    Call?" Both opt in, either one unpairs in one tap, and nothing else is shared or kept.

## Content each needs

- Bedtime (5): the before-sleep adhkar from HadeethEnc (DECISIONS, "Content sources"), unchanged
  and referenced.
- The rak'ah counter's note (6) and the flagged ingredients (11): plain text written in each
  language; it touches practice, so the reviewer signs it.
- Little ones (13): Phase 12's reviewed "Learn to pray" guide.

## Gate

Each feature: the polish checklist (SPEC 11), an end-to-end flow that passes the grandfather test,
screenshots in `ar`, `en` and `fr`, light and dark. Do Not Disturb, Prayer Pause and the proximity
sensor on a real Android phone, and Family Controls on an iPhone, in Phase 9.

## Status

- Planned 2026-10-24.
- Step 1, travel times: built on web and Android, in `ar`, `en` and `fr`. Verified in the browser
  (Lagos and Istanbul clocks against a city chosen by hand), by an end-to-end test on Istanbul time
  (desktop and phone sizes), and on the Android emulator, including a zone changed while the app
  was in the background.
