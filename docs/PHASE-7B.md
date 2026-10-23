# Phase 7b · Fajr Rise (plan)

2026-10-23. SPEC 5.10 and 12. The owner's idea: an alarm for Fajr that only stops once the person
is really awake, through a photo, a movement or a small game. No all-in-one Islamic app has it
(`docs/COMPETITION.md`). Decisions made along the way go to `docs/DECISIONS.md`.

It starts when the owner says so. Phase 7's gate is still open on two items that need things
outside the code: the iOS widgets and Face ID on a real iPhone (with the Apple membership, Phase
9), and the reviewed content.

## The morning, step by step

1. **Setup** (Fajr's row on Today, Settings → Reminders, or the Tools hub). Choose the time: at
   Fajr, up to 60 minutes before it, or a number of minutes before sunrise. Choose the weekdays,
   the sound (the reminders' adhan recordings or a soft tone) and one challenge, then "Try it",
   which runs the challenge once without sound. The platform permissions are asked here, one at a
   time, each after a sentence saying why.
2. **The night before.** Fajr's row on Today shows a small alarm mark with the time. Nothing else
   changes.
3. **The ring.** The sound fades in over 30 seconds. The screen is the live Fajr sky in Night
   theme, the time in large type, the challenge's one action, and "Turn off" small at the bottom.
4. **The challenge.** Once it is done, the sound stops with a success haptic and the backups are
   cancelled. The screen shows the dua for waking (from `packages/content`, once reviewed) and how
   long Fajr lasts ("Fajr is here until sunrise at 06:31").
5. **"Still up?"** (optional, on by default). Five minutes later a notification asks; if it is not
   answered within two minutes, the alarm rings again with the same challenge.
6. **After.** Today as usual. Logging stays "I prayed"; Fajr Rise records nothing about the
   morning.

## Challenges

| Challenge | Check                                                                                                     | Library (verify the current version before installing, SPEC 1 rule 5)                             | Permission                                   |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Steps     | Steps counted since the ring, 20 to 60                                                                    | `expo-sensors` Pedometer                                                                          | Motion (iOS), activity recognition (Android) |
| Your spot | The barcode or QR value saved in setup, scanned again                                                     | `expo-camera` barcode scanning                                                                    | Camera                                       |
| Move      | Squats from the hip, knee and ankle angles: down below about 100°, up above about 160°, both legs in view | Apple Vision body pose and ML Kit pose detection, in the `fajr-rise` module, fed by camera frames | Camera                                       |
| Mind      | Sums in three levels, or a 3 by 3 field of stars lighting in an order to repeat (four, then five)         | None                                                                                              | None                                         |
| Aloud     | A voice above the room's level for three seconds in total, while the dua for waking is on screen          | `expo-audio` recording with metering, never written to a file                                     | Microphone                                   |
| Shake     | Fifteen firm shakes                                                                                       | `expo-sensors` Accelerometer                                                                      | None                                         |

- Every challenge works offline and in `ar`, `en` and `fr`, follows the user's digits, and has
  screen-reader labels. Mind and Shake need no camera or microphone, so there is always a
  choice for someone who cannot move, see or speak easily.
- **Your spot** offers a printable card: the mark, a QR code with a random value, and one line
  ("Put me where you'll go after waking"). It never suggests a prayer mat, the wudu sink or a
  mosque (SPEC 13).
- **Move** in a dark room: it asks for a light first and turns the screen white at full
  brightness as a fill light. It ships only if a prototype counts squats correctly at Fajr light
  levels on a mid-range Android phone; if not, it waits, like the recitation check.
- **Aloud** waits for the reviewed dua for waking; until then it is not offered.
- Later, not in this phase: a photo of a chosen spot matched on the device, once a prototype
  proves reliable.

## The engine

A local Expo module, `apps/mobile/modules/fajr-rise` (Swift and Kotlin), like `prayer-widget`.
`packages/core` computes the alarm times; the module only schedules, rings and cancels.

- **Times** (`packages/core`): the next 14 alarm instants from the prayer times, the offset or the
  "before sunrise" rule, the weekdays, the city's time zone and DST. Recomputed whenever the
  reminders are (launch, return, settings, the twice-daily background task), so the alarm always
  follows the real Fajr. Unit tested across DST, a time-zone change and high latitudes.
- **Backups:** each alarm is scheduled with ten backups two minutes apart. Finishing the challenge
  cancels them; nothing else does. This works whatever the platform reports about dismissals.

### iOS 26 and later: AlarmKit

- `AlarmManager` schedules each alarm and backup with a fixed date; `NSAlarmKitUsageDescription`
  goes into Info.plist through the module's config plugin, and authorization is asked in setup.
- The alert shows the system stop button (always present) and a custom button whose App Intent
  opens the app at `/rise` (`openAppWhenRun`). Stopping from the lock screen silences that ring
  only; the next backup rings two minutes later.
- AlarmKit sounds come from the app bundle, so the adhan recordings and tones ship trimmed for it.
- The alarm presentation uses the widget extension `expo-widgets` already adds; check whether
  AlarmKit needs its Live Activity there for plain alarms, and add it if so.
- Verified in the iOS Simulator by the `iOS build` workflow (Maestro), then on a phone in Phase 9.
- Developer reports say the stop intent does not fire on every dismissal path and that dismissals
  are not observable; the backup chain is designed not to depend on either.

### iOS before 26

Time-sensitive local notifications (sound at most 30 seconds) at the alarm time and each backup,
opening `/rise`. They cannot ring through silent mode, and setup says so plainly. No critical
alerts: Apple grants them to health and safety apps only.

### Android

- `AlarmManager.setAlarmClock` (exact, runs in Doze, shows the system alarm icon), with
  `USE_EXACT_ALARM` declared as an alarm function, or `SCHEDULE_EXACT_ALARM` asked in setup.
- The alarm's receiver starts a foreground service that plays on the alarm audio stream with the
  fade-in and vibration. Use the service type the current documentation names for alarms (it
  lists `systemExempted` for apps holding the exact-alarm permission); exact alarms may start a
  foreground service from the background.
- A full-screen intent opens an activity over the lock screen that hosts the React Native `/rise`
  screen. Since Android 14 the permission is granted by default only to alarm and calling apps:
  file the Play Console declaration for the alarm function, check `canUseFullScreenIntent()`, and
  if it is refused, send the user to the setting from setup
  (`ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT`).
- `BOOT_COMPLETED`, `TIME_SET` and `TIMEZONE_CHANGED` re-arm the alarms.
- Verified on the `Medium_Phone` emulator and on a real phone (some makers kill alarms; note
  which in DECISIONS).

## Privacy and mercy, as tests

- Camera frames, audio buffers and motion samples stay in memory; a test checks the app's
  storage after a challenge (no new files, no new database rows).
- The only data kept: the alarm settings and the saved code's value, local and encrypted (SPEC 9).
- No string anywhere mentions lateness, missing or failure; the i18n check gets a word list for
  this screen.
- "Turn off" works by holding for 10 seconds with a progress ring, also from the screen reader
  (a single long action), and its result is "Alarm off." plus how long Fajr lasts.

## Steps, in order

Each step lands with tests and screenshots in `ar` and `en`, light and dark (the ring screen is
always dark).

1. **Times in core**, with unit tests.
2. **The Android engine** and the permission screens, ringing a plain "I'm up" button.
3. **The iOS engine** (AlarmKit, then the fallback), checked in the simulator workflow.
4. **The ring screen and setup:** the sky, the sound fade-in, the escape, "Try it", the entry
   points on Today and in Settings, and the Today offer card.
5. **Challenges without the camera:** Mind, Steps, Shake.
6. **Your spot**, with the printable card on web (`/[locale]/rise/card`, print styles).
7. **Move:** the prototype and its go or no-go, then the challenge.
8. **"Still up?"**, then the polish checklist on every screen.

## Gate

SPEC 12, Phase 7b. In short: it rings on time, locked, silent and in Do Not Disturb or Focus,
seven simulated mornings in a row across a DST change and a time-zone change; every challenge
works offline in three languages; the lock-screen stop and a force-quit still bring the next
backup; nothing from the camera or microphone reaches storage.

## Sources

- [Wake up to the AlarmKit API (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/230/)
- [AlarmKit: behaviors when dismissing alarms (Apple Developer Forums)](https://developer.apple.com/forums/thread/815064)
- [Full-screen intent limits (Android)](https://source.android.com/docs/core/permissions/fsi-limits)
- [Foreground service and full-screen intent requirements (Google Play)](https://support.google.com/googleplay/android-developer/answer/13392821)
