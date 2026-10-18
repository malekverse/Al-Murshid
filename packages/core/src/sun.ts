// Sun position for the living sky (SPEC 5.1). Low-precision solar coordinates (Astronomical
// Almanac, about 0.01 degree from 1950 to 2050), plenty for colors and a sunrise check.

import type { LatLng } from './geo';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const mod = (a: number, n: number) => ((a % n) + n) % n;

interface Equatorial {
  /** Declination, degrees. */
  declination: number;
  /** Right ascension, degrees. */
  rightAscension: number;
  /** Days since J2000.0. */
  n: number;
}

function equatorial(instant: Date): Equatorial {
  const n = instant.getTime() / 86_400_000 + 2440587.5 - 2451545.0;
  const L = mod(280.46 + 0.9856474 * n, 360);
  const g = rad(mod(357.528 + 0.9856003 * n, 360));
  const lambda = rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const epsilon = rad(23.439 - 0.0000004 * n);
  return {
    declination: deg(Math.asin(Math.sin(epsilon) * Math.sin(lambda))),
    rightAscension: mod(
      deg(Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))),
      360,
    ),
    n,
  };
}

/** Hour angle in degrees, -180..180: negative before the sun crosses the meridian. */
function hourAngle(instant: Date, longitude: number, eq: Equatorial): number {
  const gmstHours = mod(18.697374558 + 24.06570982441908 * eq.n, 24);
  const lst = gmstHours * 15 + longitude;
  return mod(lst - eq.rightAscension + 180, 360) - 180;
}

/** Geometric altitude of the sun's center above the horizon, in degrees. */
export function sunAltitude(instant: Date, { latitude, longitude }: LatLng): number {
  const eq = equatorial(instant);
  const H = rad(hourAngle(instant, longitude, eq));
  const φ = rad(latitude);
  const δ = rad(eq.declination);
  return deg(Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(H)));
}

export interface SunPosition {
  altitude: number;
  /** Highest altitude that day (at solar noon). */
  noonAltitude: number;
  /** True before solar noon. */
  rising: boolean;
}

/** Everything the sky needs (`skyAt` in packages/tokens) for one moment and place. */
export function sunPosition(instant: Date, place: LatLng): SunPosition {
  const eq = equatorial(instant);
  return {
    altitude: sunAltitude(instant, place),
    noonAltitude: 90 - Math.abs(place.latitude - eq.declination),
    rising: hourAngle(instant, place.longitude, eq) < 0,
  };
}
