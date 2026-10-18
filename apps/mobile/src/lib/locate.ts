import { loadCities } from '@murshid/content/cities';
import { locationFromCity, type LocationSetting } from '@murshid/data';
import * as Location from 'expo-location';

export { locationFromCity };

/**
 * The phone's location, named offline after its nearest city (SPEC 3). Throws "denied" when
 * the person keeps location off; a manual city then works fully.
 */
export async function locateDevice(): Promise<LocationSetting> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) throw new Error('denied');
  let position: Location.LocationObject | null = null;
  try {
    position =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  } catch {
    position = null;
  }
  if (!position) throw new Error('failed');
  const { latitude, longitude } = position.coords;
  const cities = await loadCities();
  return locationFromCity(cities.nearest(latitude, longitude), { latitude, longitude });
}

/** The current position only if location is already allowed: never asks. */
export async function quietPosition(): Promise<{ latitude: number; longitude: number } | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return null;
  const position = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 }).catch(
    () => null,
  );
  return position ? position.coords : null;
}
