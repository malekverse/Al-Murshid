import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Madhab } from 'adhan';

/**
 * All supported calculation methods with their regions.
 * The app auto-detects the best method from the user's country code.
 */
export type CalcMethodKey =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'Singapore'
  | 'Turkey'
  | 'Tehran'
  | 'NorthAmerica';

export const CALC_METHOD_LABELS: Record<CalcMethodKey, string> = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm Al-Qura, Makkah',
  Dubai: 'Dubai (UAE)',
  MoonsightingCommittee: 'Moonsighting Committee',
  Singapore: 'Singapore / SE Asia',
  Turkey: 'Diyanet (Turkey)',
  Tehran: 'Institute of Geophysics, Tehran',
  NorthAmerica: 'ISNA (North America)',
};

function getCalcParams(method: CalcMethodKey) {
  switch (method) {
    case 'Egyptian': return CalculationMethod.Egyptian();
    case 'Karachi': return CalculationMethod.Karachi();
    case 'UmmAlQura': return CalculationMethod.UmmAlQura();
    case 'Dubai': return CalculationMethod.Dubai();
    case 'MoonsightingCommittee': return CalculationMethod.MoonsightingCommittee();
    case 'Singapore': return CalculationMethod.Singapore();
    case 'Turkey': return CalculationMethod.Turkey();
    case 'Tehran': return CalculationMethod.Tehran();
    case 'NorthAmerica': return CalculationMethod.NorthAmerica();
    case 'MuslimWorldLeague':
    default: return CalculationMethod.MuslimWorldLeague();
  }
}

/**
 * Auto-detect the best calculation method based on ISO 3166 country code.
 * Falls back to MuslimWorldLeague if unrecognized.
 */
export function detectCalcMethod(countryCode: string | null | undefined): CalcMethodKey {
  if (!countryCode) return 'MuslimWorldLeague';
  const cc = countryCode.toUpperCase();

  // Saudi Arabia & GCC
  if (cc === 'SA') return 'UmmAlQura';
  if (['AE'].includes(cc)) return 'Dubai';
  if (['QA', 'BH', 'KW', 'OM', 'YE'].includes(cc)) return 'UmmAlQura';

  // North Africa & Egypt
  if (['EG', 'LY'].includes(cc)) return 'Egyptian';

  // Maghreb (Algeria, Morocco, Tunisia, Mauritania)
  if (['DZ', 'MA', 'TN', 'MR'].includes(cc)) return 'MuslimWorldLeague';

  // Turkey
  if (cc === 'TR') return 'Turkey';

  // Iran
  if (cc === 'IR') return 'Tehran';

  // South/SE Asia
  if (['PK', 'BD', 'AF', 'IN'].includes(cc)) return 'Karachi';
  if (['SG', 'MY', 'ID', 'BN', 'TH', 'PH'].includes(cc)) return 'Singapore';

  // North America
  if (['US', 'CA', 'MX'].includes(cc)) return 'NorthAmerica';

  // UK & Europe — Moonsighting Committee is popular
  if (['GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'IT', 'ES', 'PT', 'AT', 'CH', 'PL', 'CZ', 'GR', 'RO', 'BG', 'HU'].includes(cc))
    return 'MoonsightingCommittee';

  // Jordan, Palestine, Iraq, Syria, Lebanon, Sudan
  if (['JO', 'PS', 'IQ', 'SY', 'LB', 'SD'].includes(cc)) return 'MuslimWorldLeague';

  // Australia, NZ — commonly Moonsighting or MWL
  if (['AU', 'NZ'].includes(cc)) return 'MoonsightingCommittee';

  return 'MuslimWorldLeague';
}

export const getPrayerTimes = (
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  method: CalcMethodKey = 'MuslimWorldLeague'
) => {
  const coordinates = new Coordinates(latitude, longitude);
  const params = getCalcParams(method);
  // Use Shafi madhab for Asr by default (more common worldwide)
  params.madhab = Madhab.Shafi;

  const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
};

export const getNextPrayer = (
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  method: CalcMethodKey = 'MuslimWorldLeague'
) => {
  const coordinates = new Coordinates(latitude, longitude);
  const params = getCalcParams(method);
  params.madhab = Madhab.Shafi;

  const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);
  return prayerTimes.nextPrayer();
};
