import { defaultMethodFor, prayerTimes, type CivilDate, type LatLng } from '@murshid/core';

// The landing page's fallback (live-sky.tsx): a day past the end of the table written at build
// time, calculated in the page. Loaded only then, since it brings adhan-js.

export function calculateDay(place: LatLng, country: string, date: CivilDate) {
  return prayerTimes(place, date, {
    method: defaultMethodFor(country),
    asr: 'standard',
    highLatitude: 'auto',
  });
}
