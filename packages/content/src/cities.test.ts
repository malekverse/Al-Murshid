import { beforeAll, describe, expect, it } from 'vitest';
import { cityName, loadCities, normalizeName, type CityIndex } from './cities';

let cities: CityIndex;
beforeAll(async () => {
  cities = await loadCities();
});

describe('city search (any of the three languages)', () => {
  it('loads every city of 15,000+ people once', async () => {
    expect(cities.size).toBeGreaterThan(30_000);
    expect(await loadCities()).toBe(cities);
  });

  it('finds a city by its English, Arabic or French name, largest first', () => {
    expect(cities.search('tunis')[0]!.id).toBe(2464470);
    expect(cities.search('تونس')[0]!.id).toBe(2464470);
    expect(cities.search('Le Caire')[0]!.id).toBe(360630);
    expect(cities.search('alger')[0]!.id).toBe(2507480);
    expect(cities.search('لندن')[0]!.id).toBe(2643743);
  });

  it('forgives accents, Arabic diacritics, letter variants and a missing article', () => {
    expect(cities.search('القاهرة')[0]!.id).toBe(360630);
    expect(cities.search('قاهرة')[0]!.id).toBe(360630);
    expect(cities.search('القَاهِرَة')[0]!.id).toBe(360630);
    expect(cities.search('montréal')[0]!.countryCode).toBe('CA');
    expect(cities.search('MONTREAL')[0]!.countryCode).toBe('CA');
  });

  it('ranks whole-name matches before prefixes, and prefixes before inner words', () => {
    const paris = cities.search('paris');
    expect(paris[0]!.id).toBe(2988507);
    expect(cities.search('new york')[0]!.id).toBe(5128581);
    expect(cities.search('york').some((c) => c.id === 5128581)).toBe(true);
  });

  it('returns nothing for an empty query and respects the limit', () => {
    expect(cities.search('  ')).toEqual([]);
    expect(cities.search('a', 5)).toHaveLength(5);
  });
});

describe('nearest city (naming a device location offline)', () => {
  it('names a position by its closest city', () => {
    expect(cities.nearest(36.8, 10.18).id).toBe(2464470);
    expect(cities.nearest(48.857, 2.352).id).toBe(2988507);
  });

  it('works across the date line', () => {
    const fiji = cities.nearest(-18.14, 178.44);
    expect(fiji.countryCode).toBe('FJ');
    expect(cities.nearest(-18.14, -179.99).countryCode).toBe('FJ');
  });

  it('knows the main city of a time zone', () => {
    expect(cities.mainCityOf('Europe/Istanbul')?.name).toBe('Istanbul');
    expect(cities.mainCityOf('Africa/Tunis')?.id).toBe(2464470);
    expect(cities.mainCityOf('Etc/GMT+3')).toBeUndefined();
  });
});

describe('names', () => {
  it('shows the name in the person’s language, with fallbacks', () => {
    const cairo = cities.get(360630)!;
    expect(cityName(cairo, 'ar')).toBe('القاهرة');
    expect(cityName(cairo, 'fr')).toBe('Le Caire');
    expect(cityName(cairo, 'en')).toBe('Cairo');
    const nyc = cities.get(5128581)!;
    expect(cityName(nyc, 'en-US')).toBe('New York');
    const noArabic = { ...cairo, names: {} };
    expect(cityName(noArabic, 'ar')).toBe('Cairo');
    expect(cities.get(-1)).toBeUndefined();
  });

  it('normalizes text for matching', () => {
    expect(normalizeName('  Saint-Étienne ')).toBe('saint etienne');
    expect(normalizeName('إسْطَنبولـ')).toBe('اسطنبول');
    expect(normalizeName('مكّة المكرّمة')).toBe('مكه المكرمه');
  });
});
