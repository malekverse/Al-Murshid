import { expect, test } from '@playwright/test';

// Screenshots of every screen so far in ar, en and fr, light and dark (SPEC 11 polish checklist).
// They land in e2e/.screens for review; nothing is compared automatically.
const settings = {
  onboarded: true,
  location: {
    label: 'Tunis',
    countryCode: 'TN',
    latitude: 36.819,
    longitude: 10.166,
    timeZone: 'Africa/Tunis',
    source: 'city',
    cityId: 2464470,
    names: { ar: 'تونس', en: 'Tunis' },
  },
  method: 'tunisia',
  lastOpenedOn: '2026-10-18',
  previousOpenedOn: '2026-10-17',
};

const screens = ['', '/you', '/qibla', '/calendar', '/quran', '/quran/2/255', '/quran/page/50'];

for (const locale of ['ar', 'en', 'fr']) {
  for (const theme of ['light', 'dark']) {
    test(`${locale} ${theme}`, async ({ page }, info) => {
      // The date is set, but time keeps flowing so animations finish.
      await page.clock.setSystemTime(new Date('2026-10-18T14:30:00Z'));
      await page.addInitScript(
        ({ s, t }) => {
          localStorage.setItem('murshid-settings', s);
          localStorage.setItem('murshid-theme', t);
        },
        { s: JSON.stringify(settings), t: theme },
      );
      for (const path of screens) {
        await page.goto(`/${locale}${path}`);
        await expect(page.locator('h1').first()).toBeVisible();
        // The reader's text, and a mushaf page's own font, load after the page itself.
        if (path.startsWith('/quran/page/')) {
          await expect(page.locator('figure [aria-hidden] span').first()).toBeVisible();
        } else if (path.startsWith('/quran/')) {
          await expect(page.locator('article').first()).toBeVisible();
        }
        await page.evaluate(() => document.fonts.ready);
        // Today fades in; shoot once it has.
        await expect(page.locator('main#main').first()).toHaveCSS('opacity', '1');
        const name = path.slice(1).replaceAll('/', '-') || 'today';
        await page.screenshot({
          path: `e2e/.screens/${info.project.name}/${locale}-${theme}-${name}.png`,
          // A whole surah is one very tall page; its first screen is what matters.
          fullPage: !path.startsWith('/quran/'),
        });
      }
    });
  }
}

// The reading views of Phase 5b, in Arabic first and English: the 1441H mushaf and the verse view
// in tajweed colors, the Indopak mushaf, and the Arabic text view memorizing, on each page color.
const readers = [
  { name: 'tajweed-page', path: '/quran/page/3', quran: { edition: 'v4', tajweed: true } },
  {
    name: 'tajweed-verses',
    path: '/quran/2',
    quran: { view: 'verses', layout: 'translation', edition: 'v4', tajweed: true },
  },
  { name: 'indopak-page', path: '/quran/page/3', quran: { edition: 'indopak' } },
  {
    name: 'text-memorize',
    path: '/quran/112',
    quran: { view: 'verses', layout: 'text', hide: 'firstWord' },
  },
] as const;

for (const locale of ['ar', 'en']) {
  for (const theme of ['light', 'dark', 'sepia'] as const) {
    test(`readers ${locale} ${theme}`, async ({ page }, info) => {
      await page.clock.setSystemTime(new Date('2026-10-18T14:30:00Z'));
      for (const reader of readers) {
        await page.addInitScript(({ s }) => localStorage.setItem('murshid-settings', s), {
          s: JSON.stringify({ ...settings, quran: { ...reader.quran, theme } }),
        });
        await page.goto(`/${locale}${reader.path}`);
        await expect(page.locator('h1').first()).toBeVisible();
        if (reader.path.startsWith('/quran/page/')) {
          await expect(page.locator('figure [aria-hidden] span').first()).toBeVisible();
        } else {
          await expect(page.locator('main#main p[lang="ar"]').nth(1)).toBeVisible();
        }
        if (reader.name === 'tajweed-verses') {
          await expect(page.locator('article [style*="qcf-v4"]').first()).toBeVisible();
        }
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: `e2e/.screens/${info.project.name}/${locale}-${theme}-${reader.name}.png`,
        });
      }
    });
  }
}
