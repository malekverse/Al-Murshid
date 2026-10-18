// Coordinates and distances. Pure math, no platform code.

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** The Kaaba, Masjid al-Haram, Makkah. */
export const KAABA: LatLng = { latitude: 21.4225241, longitude: 39.8261818 };

const EARTH_RADIUS_KM = 6371.0088;
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in km (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial great-circle bearing from a to b, in degrees clockwise from true north (0-360). */
export function initialBearing(a: LatLng, b: LatLng): number {
  const φ1 = rad(a.latitude);
  const φ2 = rad(b.latitude);
  const Δλ = rad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Coordinates as the server may store them: rounded to 2 decimals, about 1 km (SPEC 9).
 * Precise coordinates never leave the device.
 */
export function roundForSync({ latitude, longitude }: LatLng): LatLng {
  return {
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(longitude * 100) / 100,
  };
}

/** The device moved far enough to ask whether to update prayer times (SPEC 5.1: about 50 km). */
export function hasMovedFar(previous: LatLng, current: LatLng, thresholdKm = 50): boolean {
  return distanceKm(previous, current) > thresholdKm;
}
