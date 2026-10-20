import { loadCities, type City } from '@murshid/content/cities';

// Countries and cities as public pages (Phase 6): /prayer-times/[country]/[city], with stable
// English slugs in every language (SPEC 4: one path per place). Built once per server from the
// GeoNames table the apps already carry (cities of 15,000+ people, CC BY 4.0).

export interface Country {
  code: string;
  slug: string;
  /** Its cities, the most populous first. */
  cities: City[];
}

export interface Places {
  countries: Country[];
  country: (slug: string) => Country | undefined;
  city: (countrySlug: string, citySlug: string) => City | undefined;
  /** A city's path below /prayer-times. */
  path: (city: City) => string;
}

/** Lowercase ASCII words joined by hyphens: "Montréal" -> "montreal", "Côte d'Ivoire" -> "cote-d-ivoire". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const englishRegion = new Intl.DisplayNames(['en'], { type: 'region' });
/** A country's slug from its English name ("TN" -> "tunisia"), or its code if it has none. */
export const countrySlug = (code: string) =>
  slugify(englishRegion.of(code) ?? code) || code.toLowerCase();

let places: Promise<Places> | null = null;

export function loadPlaces(): Promise<Places> {
  places ??= loadCities().then((index) => {
    const byCountry = new Map<string, City[]>();
    for (const city of index.all()) {
      const list = byCountry.get(city.countryCode);
      if (list) list.push(city);
      else byCountry.set(city.countryCode, [city]);
    }
    const countries: Country[] = [];
    const bySlug = new Map<string, Country>();
    const cityPaths = new Map<number, string>();
    const cityBySlug = new Map<string, City>();
    for (const [code, cities] of byCountry) {
      const country: Country = { code, slug: countrySlug(code), cities };
      countries.push(country);
      bySlug.set(country.slug, country);
      // A city's slug is its English name; namesakes in one country add their region, then
      // their GeoNames id, so every slug stays the same however the table grows.
      const base = (c: City) => slugify(c.names.en ?? c.name) || `city-${c.id}`;
      const counts = new Map<string, number>();
      for (const c of cities) counts.set(base(c), (counts.get(base(c)) ?? 0) + 1);
      const withRegion = (c: City) =>
        counts.get(base(c))! > 1 && c.region ? `${base(c)}-${slugify(c.region)}` : base(c);
      const regionCounts = new Map<string, number>();
      for (const c of cities)
        regionCounts.set(withRegion(c), (regionCounts.get(withRegion(c)) ?? 0) + 1);
      for (const c of cities) {
        const slug =
          regionCounts.get(withRegion(c))! > 1 ? `${withRegion(c)}-${c.id}` : withRegion(c);
        cityPaths.set(c.id, `${country.slug}/${slug}`);
        cityBySlug.set(`${country.slug}/${slug}`, c);
      }
    }
    return {
      countries,
      country: (slug) => bySlug.get(slug),
      city: (country, city) => cityBySlug.get(`${country}/${city}`),
      path: (city) => cityPaths.get(city.id)!,
    };
  });
  return places;
}
