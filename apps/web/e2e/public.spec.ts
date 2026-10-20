import { expect, test, type Page } from '@playwright/test';

// The public pages of Phase 6 (SPEC 4): a visitor finds a city's prayer times and takes the city
// into the app; every page names itself to search engines (canonical address, languages,
// structured data, share image), and the robots file and sitemaps list them. Nothing is seeded:
// these are a first visit.

/** The page's own path from an absolute address (the site's address differs by deployment). */
const pathOf = (url: string) => {
  const u = new URL(url);
  return u.pathname + u.search;
};

async function head(page: Page) {
  return page.evaluate(() => ({
    canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? '',
    languages: [...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')]
      .map((l) => `${l.hreflang} ${new URL(l.href).pathname}`)
      .sort(),
    image: document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? '',
    robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? '',
    data: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => JSON.parse(s.textContent ?? '{}') as { '@type': string },
    ),
  }));
}

test('a visitor finds a city and takes it into the app', async ({ page }) => {
  await page.goto('/en/prayer-times');
  await expect(
    page.getByRole('heading', { name: 'Prayer times around the world', level: 1 }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Tunisia', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Prayer times in Tunisia', level: 1 }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Tunis', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/prayer-times\/tunisia\/tunis$/);
  await expect(
    page.getByRole('heading', { name: 'Prayer times in Tunis', level: 1 }),
  ).toBeVisible();

  // Today's five prayers and sunrise, the next one counted down, and the month's timetable.
  const today = page.locator('section[aria-labelledby="today"]');
  await expect(today.locator('time')).toHaveCount(6);
  await expect(today.getByRole('group', { name: /^Fajr, / })).toBeVisible();
  await expect(today.getByText(/^(Next|Now): /)).toBeVisible();
  expect(await page.locator('section[aria-labelledby="month"] tbody tr').count()).toBeGreaterThan(
    27,
  );
  // (The country's page stays in the document, hidden, after a client-side navigation.)
  await expect(page.getByRole('main').getByText(/^Method: /)).toBeVisible();

  // The city becomes the place in the app; a first visit continues at onboarding's place step.
  await page.getByRole('button', { name: 'Use this city' }).click();
  await expect(page).toHaveURL(/\/en\/welcome#location$/);
  await expect(page.getByText('Tunis, Tunisia')).toBeVisible();
});

test('public pages name themselves to search engines', async ({ page, request }) => {
  await page.goto('/ar/quran/112');
  const surah = await head(page);
  expect(pathOf(surah.canonical)).toBe('/ar/quran/112');
  expect(surah.languages).toEqual([
    'ar /ar/quran/112',
    'en /en/quran/112',
    'fr /fr/quran/112',
    'x-default /ar/quran/112',
  ]);
  expect(surah.data.map((d) => d['@type'])).toEqual(
    expect.arrayContaining(['Chapter', 'BreadcrumbList']),
  );
  expect(surah.robots).not.toContain('noindex');

  // Its share image is a PNG drawn on the server.
  const image = await request.get(pathOf(surah.image));
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/png');

  await page.goto('/en/quran/2/255');
  const ayah = await head(page);
  expect(pathOf(ayah.canonical)).toBe('/en/quran/2/255');
  expect((await request.get(pathOf(ayah.image))).headers()['content-type']).toBe('image/png');

  await page.goto('/fr/prayer-times/tunisia/tunis');
  const city = await head(page);
  expect(pathOf(city.canonical)).toBe('/fr/prayer-times/tunisia/tunis');
  expect(city.data.map((d) => d['@type'])).toEqual(
    expect.arrayContaining(['WebPage', 'BreadcrumbList']),
  );
  expect((await request.get(pathOf(city.image))).headers()['content-type']).toBe('image/png');

  // A city that does not exist is a page that asks not to be indexed.
  await page.goto('/en/prayer-times/tunisia/no-such-city');
  expect((await head(page)).robots).toContain('noindex');
});

test('robots and sitemaps list the public pages', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /*/welcome');
  expect(robots).toMatch(/Sitemap: \S+\/sitemap\.xml/);

  const index = await (await request.get('/sitemap.xml')).text();
  const files = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathOf(m[1]!));
  expect(files).toEqual(expect.arrayContaining(['/sitemaps/quran.xml', '/sitemaps/places-1.xml']));

  const quran = await (await request.get('/sitemaps/quran.xml')).text();
  expect(quran).toMatch(/<loc>[^<]+\/ar\/quran\/112<\/loc>/);
  expect(quran).toMatch(/hreflang="en" href="[^"]+\/en\/quran\/2\/255"/);
  // Below the 50,000 addresses a search engine reads from one file.
  expect(quran.match(/<url>/g)!.length).toBeLessThanOrEqual(50_000);
});

// Screenshots of the public pages in ar, en and fr, light and dark, for review (SPEC 11).
const screens = [
  '/prayer-times',
  '/prayer-times/tunisia',
  '/prayer-times/tunisia/tunis',
  '/quran/112',
  '/quran/1/1',
];

for (const locale of ['ar', 'en', 'fr']) {
  for (const theme of ['light', 'dark']) {
    test(`public ${locale} ${theme}`, async ({ page }, info) => {
      // The browser keeps the real time: the server renders the city's real day.
      await page.addInitScript((t) => localStorage.setItem('murshid-theme', t), theme);
      for (const path of screens) {
        await page.goto(`/${locale}${path}`);
        await expect(page.locator('h1').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const name = `public${path.replaceAll('/', '-')}`;
        await page.screenshot({
          path: `e2e/.screens/${info.project.name}/${locale}-${theme}-${name}.png`,
          fullPage: path.startsWith('/prayer-times'),
        });
      }
    });
  }
}
