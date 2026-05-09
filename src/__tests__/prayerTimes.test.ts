import { detectCalcMethod } from '../utils/prayerTimes';

describe('detectCalcMethod', () => {
  it('returns MuslimWorldLeague for null/undefined', () => {
    expect(detectCalcMethod(null)).toBe('MuslimWorldLeague');
    expect(detectCalcMethod(undefined)).toBe('MuslimWorldLeague');
  });

  it('detects UmmAlQura for Saudi Arabia', () => {
    expect(detectCalcMethod('SA')).toBe('UmmAlQura');
  });

  it('detects Dubai for UAE', () => {
    expect(detectCalcMethod('AE')).toBe('Dubai');
  });

  it('detects Egyptian for Egypt', () => {
    expect(detectCalcMethod('EG')).toBe('Egyptian');
  });

  it('detects Turkey for TR', () => {
    expect(detectCalcMethod('TR')).toBe('Turkey');
  });

  it('detects Tehran for Iran', () => {
    expect(detectCalcMethod('IR')).toBe('Tehran');
  });

  it('detects Karachi for Pakistan', () => {
    expect(detectCalcMethod('PK')).toBe('Karachi');
    expect(detectCalcMethod('BD')).toBe('Karachi');
    expect(detectCalcMethod('IN')).toBe('Karachi');
  });

  it('detects Singapore for SE Asia', () => {
    expect(detectCalcMethod('SG')).toBe('Singapore');
    expect(detectCalcMethod('MY')).toBe('Singapore');
    expect(detectCalcMethod('ID')).toBe('Singapore');
  });

  it('detects NorthAmerica for US/CA/MX', () => {
    expect(detectCalcMethod('US')).toBe('NorthAmerica');
    expect(detectCalcMethod('CA')).toBe('NorthAmerica');
    expect(detectCalcMethod('MX')).toBe('NorthAmerica');
  });

  it('detects MoonsightingCommittee for UK/Europe', () => {
    expect(detectCalcMethod('GB')).toBe('MoonsightingCommittee');
    expect(detectCalcMethod('FR')).toBe('MoonsightingCommittee');
    expect(detectCalcMethod('DE')).toBe('MoonsightingCommittee');
  });

  it('falls back to MuslimWorldLeague for unrecognized', () => {
    expect(detectCalcMethod('XX')).toBe('MuslimWorldLeague');
  });

  it('is case-insensitive', () => {
    expect(detectCalcMethod('sa')).toBe('UmmAlQura');
    expect(detectCalcMethod('Us')).toBe('NorthAmerica');
  });
});
