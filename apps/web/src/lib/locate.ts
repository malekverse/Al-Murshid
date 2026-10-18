'use client';

import { loadCities } from '@murshid/content/cities';
import { locationFromCity, type LocationSetting } from '@murshid/data';

export { locationFromCity };

export type LocateFailure = 'denied' | 'failed';

export function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('failed'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 10 * 60_000,
    });
  });
}

/** The device's location, named offline after its nearest city (SPEC 3). */
export async function locateDevice(): Promise<LocationSetting> {
  let position: GeolocationPosition;
  try {
    position = await currentPosition();
  } catch (error) {
    const denied =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 1;
    throw new Error(denied ? 'denied' : 'failed');
  }
  const { latitude, longitude } = position.coords;
  const cities = await loadCities();
  return locationFromCity(cities.nearest(latitude, longitude), { latitude, longitude });
}
