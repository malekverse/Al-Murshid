// Fajr Rise's notifications are told apart from the reminders by their id, so rebuilding one
// never cancels the other (lib/reminders.ts, lib/rise.ts).

export const STILL_UP_SUFFIX = '-still-up';

export const stillUpId = (morning: string) => `${morning}${STILL_UP_SUFFIX}`;

export const isRiseNotification = (id: string) => id.endsWith(STILL_UP_SUFFIX);
