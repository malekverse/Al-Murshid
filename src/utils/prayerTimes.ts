import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';

export const getPrayerTimes = (latitude: number, longitude: number, date: Date = new Date()) => {
  const coordinates = new Coordinates(latitude, longitude);
  // Default to Muslim World League method
  const params = CalculationMethod.MuslimWorldLeague();

  const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);
  
  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha
  };
};

export const getNextPrayer = (latitude: number, longitude: number, date: Date = new Date()) => {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);
  
  return prayerTimes.nextPrayer();
};
