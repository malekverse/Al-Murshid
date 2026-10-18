// Cities and dates for the prayer-time accuracy test (SPEC 11, Phase 3 gate): 20+ cities,
// each country's default method, high latitudes, both hemispheres, and every city's actual
// DST change days in 2026 (or Ramadan's clock change in Morocco).

import type { MethodId } from './methods';

export interface ReferenceCity {
  name: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  method: MethodId;
  dates: readonly string[];
}

const WINTER = '2026-01-15';
const SOLSTICE = '2026-06-21';
const EU_DST = ['2026-03-29', '2026-10-25'];
const US_DST = ['2026-03-08', '2026-11-01'];

export const cities: readonly ReferenceCity[] = [
  {
    name: 'Tunis',
    latitude: 36.8065,
    longitude: 10.1815,
    timeZone: 'Africa/Tunis',
    method: 'tunisia',
    dates: [WINTER, SOLSTICE, '2026-09-23'],
  },
  {
    name: 'Sfax',
    latitude: 34.7406,
    longitude: 10.7603,
    timeZone: 'Africa/Tunis',
    method: 'tunisia',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Algiers',
    latitude: 36.7538,
    longitude: 3.0588,
    timeZone: 'Africa/Algiers',
    method: 'algeria',
    dates: [WINTER, SOLSTICE],
  },
  // Morocco moves its clocks back for Ramadan.
  {
    name: 'Casablanca',
    latitude: 33.5731,
    longitude: -7.5898,
    timeZone: 'Africa/Casablanca',
    method: 'morocco',
    dates: [WINTER, '2026-02-20', '2026-03-25', SOLSTICE],
  },
  // Egypt observes DST again since 2023.
  {
    name: 'Cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    timeZone: 'Africa/Cairo',
    method: 'egypt',
    dates: [WINTER, '2026-04-24', SOLSTICE, '2026-10-30'],
  },
  // Ramadan 1447 runs through early March 2026: Isha 120 minutes after Maghrib.
  {
    name: 'Makkah',
    latitude: 21.3891,
    longitude: 39.8579,
    timeZone: 'Asia/Riyadh',
    method: 'umm-al-qura',
    dates: [WINTER, '2026-03-01', SOLSTICE],
  },
  {
    name: 'Riyadh',
    latitude: 24.7136,
    longitude: 46.6753,
    timeZone: 'Asia/Riyadh',
    method: 'umm-al-qura',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    timeZone: 'Asia/Dubai',
    method: 'dubai',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Doha',
    latitude: 25.2854,
    longitude: 51.531,
    timeZone: 'Asia/Qatar',
    method: 'qatar',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Kuwait City',
    latitude: 29.3759,
    longitude: 47.9774,
    timeZone: 'Asia/Kuwait',
    method: 'kuwait',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Istanbul',
    latitude: 41.0082,
    longitude: 28.9784,
    timeZone: 'Europe/Istanbul',
    method: 'turkey',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    timeZone: 'Europe/Paris',
    method: 'mwl',
    dates: [WINTER, ...EU_DST, SOLSTICE],
  },
  {
    name: 'Lyon',
    latitude: 45.764,
    longitude: 4.8357,
    timeZone: 'Europe/Paris',
    method: 'mwl',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: 'Europe/London',
    method: 'moonsighting',
    dates: [WINTER, ...EU_DST, SOLSTICE],
  },
  {
    name: 'Manchester',
    latitude: 53.4808,
    longitude: -2.2426,
    timeZone: 'Europe/London',
    method: 'moonsighting',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: 'America/New_York',
    method: 'moonsighting',
    dates: [WINTER, ...US_DST, SOLSTICE],
  },
  {
    name: 'Toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    timeZone: 'America/Toronto',
    method: 'moonsighting',
    dates: [WINTER, ...US_DST],
  },
  {
    name: 'Los Angeles',
    latitude: 34.0522,
    longitude: -118.2437,
    timeZone: 'America/Los_Angeles',
    method: 'moonsighting',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Karachi',
    latitude: 24.8607,
    longitude: 67.0011,
    timeZone: 'Asia/Karachi',
    method: 'karachi',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    timeZone: 'Asia/Jakarta',
    method: 'kemenag',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Kuala Lumpur',
    latitude: 3.139,
    longitude: 101.6869,
    timeZone: 'Asia/Kuala_Lumpur',
    method: 'jakim',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timeZone: 'Asia/Singapore',
    method: 'singapore',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Amman',
    latitude: 31.9539,
    longitude: 35.9106,
    timeZone: 'Asia/Amman',
    method: 'jordan',
    dates: [WINTER, SOLSTICE],
  },
  // High latitudes: one seventh of the night applies.
  {
    name: 'Oslo',
    latitude: 59.9139,
    longitude: 10.7522,
    timeZone: 'Europe/Oslo',
    method: 'mwl',
    dates: [WINTER, ...EU_DST, SOLSTICE],
  },
  {
    name: 'Stockholm',
    latitude: 59.3293,
    longitude: 18.0686,
    timeZone: 'Europe/Stockholm',
    method: 'mwl',
    dates: [WINTER, SOLSTICE],
  },
  {
    name: 'Reykjavik',
    latitude: 64.1466,
    longitude: -21.9426,
    timeZone: 'Atlantic/Reykjavik',
    method: 'mwl',
    dates: [WINTER, SOLSTICE],
  },
  // Southern hemisphere: DST ends in April and starts in October.
  {
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    timeZone: 'Australia/Sydney',
    method: 'mwl',
    dates: [WINTER, '2026-04-05', SOLSTICE, '2026-10-04'],
  },
];
