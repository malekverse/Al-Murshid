// Sky gradient anchors (SPEC 6.1). The living sky interpolates between these continuously
// from the real sun altitude (packages/core); it never switches abruptly.

export const skyPeriods = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'night'] as const;
export type SkyPeriod = (typeof skyPeriods)[number];

export interface SkyStop {
  top: string;
  bottom: string;
}

export const sky: Record<SkyPeriod, SkyStop> = {
  fajr: { top: '#1E2A4A', bottom: '#C98B8B' },
  sunrise: { top: '#F4C79A', bottom: '#A9C7E3' },
  dhuhr: { top: '#6FA8DC', bottom: '#E8F1FA' },
  asr: { top: '#8DB4D9', bottom: '#F2D49B' },
  maghrib: { top: '#3B2D5C', bottom: '#E9876B' },
  night: { top: '#0B1020', bottom: '#1C2541' },
};
