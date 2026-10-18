// Qibla (SPEC 5.3): the great-circle direction to the Kaaba, from true north.

import { Coordinates, Qibla } from 'adhan';
import { distanceKm, KAABA, type LatLng } from './geo';

/** Bearing to the Kaaba in degrees clockwise from true north (0-360). */
export function qiblaBearing(place: LatLng): number {
  return Qibla(new Coordinates(place.latitude, place.longitude));
}

/** Distance to the Kaaba in km. */
export function distanceToMakkah(place: LatLng): number {
  return distanceKm(place, KAABA);
}

/** Within this many degrees the compass ring fills with light (SPEC 5.3). */
export const QIBLA_ALIGNED_DEGREES = 3;

/**
 * Signed difference from the device heading to the Qibla, -180..180. Zero means the top of the
 * phone points at the Kaaba; negative means turn counter-clockwise.
 */
export function qiblaOffset(heading: number, bearing: number): number {
  return ((((bearing - heading) % 360) + 540) % 360) - 180;
}

export function isAligned(heading: number, bearing: number): boolean {
  return Math.abs(qiblaOffset(heading, bearing)) <= QIBLA_ALIGNED_DEGREES;
}

/**
 * Low-pass filter for a noisy compass heading, so the needle never jitters (SPEC 6.4).
 * Works on the circle: 359° and 1° average to 0°, not 180°.
 */
export function smoothHeading(previous: number, next: number, factor = 0.2): number {
  const delta = qiblaOffset(previous, next);
  return (previous + delta * factor + 360) % 360;
}
