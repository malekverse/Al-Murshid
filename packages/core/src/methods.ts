// Calculation methods and the country-to-method defaults (SPEC 10). Every default is a
// starting point the person can change; none is a religious ruling. `reviewed` stays false
// until a qualified reviewer confirms the country's current official practice.

export type MethodId =
  | 'mwl'
  | 'isna'
  | 'egypt'
  | 'umm-al-qura'
  | 'karachi'
  | 'dubai'
  | 'kuwait'
  | 'qatar'
  | 'gulf'
  | 'singapore'
  | 'turkey'
  | 'moonsighting'
  | 'tunisia'
  | 'algeria'
  | 'morocco'
  | 'uoif'
  | 'kemenag'
  | 'jakim'
  | 'jordan';

export interface MethodDefinition {
  id: MethodId;
  /**
   * adhan-js has this method built in (with its own minute adjustments, e.g. Dubai, Turkey).
   * Otherwise the angles below define it.
   */
  adhan?:
    | 'MuslimWorldLeague'
    | 'NorthAmerica'
    | 'Egyptian'
    | 'UmmAlQura'
    | 'Karachi'
    | 'Dubai'
    | 'Kuwait'
    | 'Qatar'
    | 'Singapore'
    | 'Turkey'
    | 'MoonsightingCommittee';
  fajrAngle: number;
  /** Degrees below the horizon, or... */
  ishaAngle?: number;
  /** ...minutes after Maghrib. */
  ishaInterval?: number;
  /**
   * Minutes the method itself adds to a time (on top of adhan-js's own adjustments), e.g. Maghrib
   * a few minutes after sunset for safety.
   */
  minutes?: Partial<Record<'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>>;
  source: string;
  reviewed: boolean;
}

const ALADHAN = 'Aladhan API /v1/methods, retrieved 2026-10-18';

export const methods: Record<MethodId, MethodDefinition> = {
  mwl: {
    id: 'mwl',
    adhan: 'MuslimWorldLeague',
    fajrAngle: 18,
    ishaAngle: 17,
    source: `Muslim World League; ${ALADHAN}`,
    reviewed: false,
  },
  isna: {
    id: 'isna',
    adhan: 'NorthAmerica',
    fajrAngle: 15,
    ishaAngle: 15,
    source: `ISNA; ${ALADHAN}`,
    reviewed: false,
  },
  egypt: {
    id: 'egypt',
    adhan: 'Egyptian',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    source: `Egyptian General Authority of Survey; ${ALADHAN}`,
    reviewed: false,
  },
  'umm-al-qura': {
    id: 'umm-al-qura',
    adhan: 'UmmAlQura',
    fajrAngle: 18.5,
    ishaInterval: 90,
    source: `Umm al-Qura University, Makkah (Isha 120 min in Ramadan); ${ALADHAN}`,
    reviewed: false,
  },
  karachi: {
    id: 'karachi',
    adhan: 'Karachi',
    fajrAngle: 18,
    ishaAngle: 18,
    source: `University of Islamic Sciences, Karachi; ${ALADHAN}`,
    reviewed: false,
  },
  dubai: {
    id: 'dubai',
    adhan: 'Dubai',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
    source: `UAE (Dubai); ${ALADHAN}; adhan-js minute adjustments`,
    reviewed: false,
  },
  kuwait: {
    id: 'kuwait',
    adhan: 'Kuwait',
    fajrAngle: 18,
    ishaAngle: 17.5,
    source: `Kuwait; ${ALADHAN}`,
    reviewed: false,
  },
  qatar: {
    id: 'qatar',
    adhan: 'Qatar',
    fajrAngle: 18,
    ishaInterval: 90,
    source: `Qatar; ${ALADHAN}`,
    reviewed: false,
  },
  gulf: {
    id: 'gulf',
    fajrAngle: 19.5,
    ishaInterval: 90,
    source: `Gulf Region; ${ALADHAN}`,
    reviewed: false,
  },
  singapore: {
    id: 'singapore',
    adhan: 'Singapore',
    fajrAngle: 20,
    ishaAngle: 18,
    source: `MUIS Singapore; ${ALADHAN}`,
    reviewed: false,
  },
  turkey: {
    id: 'turkey',
    adhan: 'Turkey',
    fajrAngle: 18,
    ishaAngle: 17,
    source: `Diyanet; ${ALADHAN}; adhan-js minute adjustments`,
    reviewed: false,
  },
  moonsighting: {
    id: 'moonsighting',
    adhan: 'MoonsightingCommittee',
    fajrAngle: 18,
    ishaAngle: 18,
    source: 'Moonsighting Committee Worldwide (seasonal Fajr and Isha); adhan-js',
    reviewed: false,
  },
  tunisia: {
    id: 'tunisia',
    fajrAngle: 18,
    ishaAngle: 18,
    source: `Tunisia; ${ALADHAN}`,
    reviewed: false,
  },
  algeria: {
    id: 'algeria',
    fajrAngle: 18,
    ishaAngle: 17,
    source: `Algeria; ${ALADHAN}`,
    reviewed: false,
  },
  morocco: {
    id: 'morocco',
    fajrAngle: 19,
    ishaAngle: 17,
    minutes: { dhuhr: 5, maghrib: 5 },
    source: `Morocco (Dhuhr and Maghrib +5 min); ${ALADHAN}`,
    reviewed: false,
  },
  uoif: {
    id: 'uoif',
    fajrAngle: 12,
    ishaAngle: 12,
    source: `UOIF (Musulmans de France); ${ALADHAN}`,
    reviewed: false,
  },
  kemenag: {
    id: 'kemenag',
    fajrAngle: 20,
    ishaAngle: 18,
    source: `Kementerian Agama, Indonesia; ${ALADHAN}`,
    reviewed: false,
  },
  jakim: {
    id: 'jakim',
    fajrAngle: 20,
    ishaAngle: 18,
    source: `JAKIM, Malaysia; ${ALADHAN}`,
    reviewed: false,
  },
  jordan: {
    id: 'jordan',
    fajrAngle: 18,
    ishaAngle: 18,
    minutes: { maghrib: 5 },
    source: `Ministry of Awqaf, Jordan; ${ALADHAN}`,
    reviewed: false,
  },
};

/**
 * Default method per country (ISO 3166-1 alpha-2). Covers at least Tunisia, Algeria, Morocco,
 * Egypt, Saudi Arabia and the Gulf, Turkey, France, the UK and North America (SPEC 10).
 * Everything else falls back to the Muslim World League.
 */
export const countryMethods: Readonly<Record<string, MethodId>> = {
  TN: 'tunisia',
  DZ: 'algeria',
  MA: 'morocco',
  EG: 'egypt',
  SA: 'umm-al-qura',
  AE: 'dubai',
  KW: 'kuwait',
  QA: 'qatar',
  BH: 'gulf',
  OM: 'gulf',
  TR: 'turkey',
  // France has no single official authority; the person can switch to UOIF (12°) in settings.
  FR: 'mwl',
  GB: 'moonsighting',
  IE: 'moonsighting',
  US: 'moonsighting',
  CA: 'moonsighting',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
  ID: 'kemenag',
  MY: 'jakim',
  SG: 'singapore',
  JO: 'jordan',
};

export function defaultMethodFor(countryCode: string | null | undefined): MethodId {
  return (countryCode && countryMethods[countryCode.toUpperCase()]) || 'mwl';
}
