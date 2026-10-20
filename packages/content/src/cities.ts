// Cities for choosing a location by hand and for naming the device's location offline (SPEC 3,
// 5.1, 9): GeoNames cities of 15,000+ people (CC BY 4.0). The table is loaded on first use, so
// it never weighs on screens that do not search.

export interface City {
  id: number;
  /** GeoNames' main name, usually the local romanization. */
  name: string;
  /** Localized names, when GeoNames has one that differs. */
  names: { en?: string; ar?: string; fr?: string };
  countryCode: string;
  /** First-level region (state, governorate), in English, for telling namesakes apart. */
  region: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  population: number;
}

type Row = [number, string, string, string, string, string, string, number, number, number, number];
interface Table {
  zones: string[];
  rows: Row[];
}

/** Lowercase, without accents, Arabic diacritics or letter variants, so "Le Caire" finds "le caire". */
export function normalizeName(text: string): string {
  return (
    text
      .normalize('NFD')
      // Latin accents, Arabic harakat and the superscript alef, tatweel.
      .replace(/[̀-ًͯ-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  );
}

const KM_PER_DEGREE = 111.2;
const CLOSE_KM = 10;

/** Arabic city names usually carry the article; let "قاهرة" find "القاهرة". */
const withoutArticle = (word: string) => (word.startsWith('ال') ? word.slice(2) : word);

export class CityIndex {
  private readonly cities: City[];
  private readonly keys: string[][];
  private readonly byId: Map<number, City>;

  constructor(table: Table) {
    this.cities = table.rows.map(
      ([id, name, en, ar, fr, countryCode, region, lat, lon, zone, pop]) => ({
        id,
        name,
        names: { ...(en && { en }), ...(ar && { ar }), ...(fr && { fr }) },
        countryCode,
        region,
        latitude: lat,
        longitude: lon,
        timeZone: table.zones[zone]!,
        population: pop,
      }),
    );
    this.keys = this.cities.map((c) =>
      [c.name, c.names.en, c.names.ar, c.names.fr]
        .filter((n): n is string => Boolean(n))
        .map(normalizeName),
    );
    this.byId = new Map(this.cities.map((c) => [c.id, c]));
  }

  get size(): number {
    return this.cities.length;
  }

  /** Every city, the most populous first. */
  all(): readonly City[] {
    return this.cities;
  }

  get(id: number): City | undefined {
    return this.byId.get(id);
  }

  /**
   * Cities matching what the person typed in any of the three languages: whole-name matches
   * first, then names that start with it, then any word that starts with it; larger cities
   * first within each group (the table is sorted by population).
   */
  search(query: string, limit = 20): City[] {
    const q = normalizeName(query);
    if (!q) return [];
    const qBare = q.split(' ').map(withoutArticle).join(' ');
    const groups: City[][] = [[], [], []];
    this.cities.forEach((city, i) => {
      let best = 3;
      for (const key of this.keys[i]!) {
        const bare = key.split(' ').map(withoutArticle).join(' ');
        if (key === q || bare === qBare) best = 0;
        else if (key.startsWith(q) || bare.startsWith(qBare)) best = Math.min(best, 1);
        else if (
          key.split(' ').some((w) => w.startsWith(q) || withoutArticle(w).startsWith(qBare))
        ) {
          best = Math.min(best, 2);
        }
      }
      if (best < 3) groups[best]!.push(city);
    });
    return groups.flat().slice(0, limit);
  }

  /**
   * The city to name a device location by, without any network call: the most populous place
   * within 10 km (so a district of Paris reads "Paris"), or else simply the nearest one.
   */
  nearest(latitude: number, longitude: number): City {
    const cosLat = Math.cos((latitude * Math.PI) / 180);
    let nearest = this.cities[0]!;
    let nearestKm = Infinity;
    let largestClose: City | null = null;
    for (const city of this.cities) {
      // An equirectangular distance is exact enough at this scale.
      const dLat = city.latitude - latitude;
      let dLon = Math.abs(city.longitude - longitude);
      if (dLon > 180) dLon = 360 - dLon;
      const km = Math.hypot(dLat, dLon * cosLat) * KM_PER_DEGREE;
      if (km < nearestKm) [nearest, nearestKm] = [city, km];
      // The table is sorted by population, so the first close city is the largest.
      if (km <= CLOSE_KM && !largestClose) largestClose = city;
    }
    return largestClose ?? nearest;
  }
}

/** The city's name in the person's language, falling back to GeoNames' main name. */
export function cityName(city: City, locale: string): string {
  const lang = locale.split('-')[0] as 'ar' | 'en' | 'fr';
  return city.names[lang] ?? (lang === 'ar' ? city.name : (city.names.en ?? city.name));
}

let index: Promise<CityIndex> | null = null;

/** Loads the table once (about 32,000 cities), on first use. */
export function loadCities(): Promise<CityIndex> {
  index ??= import('../places/cities.json').then(
    (m) => new CityIndex((m as unknown as { default: Table }).default),
  );
  return index;
}
