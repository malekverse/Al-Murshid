import { expect, test, type Page } from '@playwright/test';

// The landing page (SPEC 4, Phase 7c): the sky and the next prayer where the visitor is, from the
// browser's time zone alone; the five moments; the tasbih counting in the page; the ways in.
// Nothing is seeded: this is a first visit. The clock is a Wednesday morning in Tunis.

test.use({ timezoneId: 'Africa/Tunis' });

const MORNING = '2026-10-21T08:00:00Z';

async function visit(page: Page, path: string, theme = 'light') {
  await page.clock.setSystemTime(new Date(MORNING));
  await page.addInitScript((t) => localStorage.setItem('murshid-theme', t), theme);
  await page.goto(path);
}

test('the sky and the next prayer where the visitor is, and the tasbih counts', async ({
  page,
}) => {
  await visit(page, '/en/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A calm companion for the five moments of your day.',
  );
  // 09:00 in Tunis: after sunrise, so the next prayer is Dhuhr, in the main city of the zone.
  await expect(page.getByText(/^Dhuhr in /)).toBeVisible();
  await expect(page.getByText('The sky in Tunis right now')).toBeVisible();

  for (const name of [
    'Rise for Fajr',
    'The Quran, as it is printed',
    'Remember Allah, anywhere',
    'Your sky, not a score',
    'Your evenings stay yours',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }

  const tasbih = page.getByRole('button', { name: /^Count / });
  await tasbih.click();
  await tasbih.click();
  await expect(tasbih).toHaveAccessibleName('Count 2');

  await expect(page.getByRole('link', { name: 'Open Al-Murshid' }).first()).toHaveAttribute(
    'href',
    '/en',
  );
  await expect(page.getByRole('link', { name: 'Prayer times near you' })).toHaveAttribute(
    'href',
    '/en/prayer-times',
  );
});

// The test above runs before the table written at dev start (from yesterday on), so the page
// calculates the day itself; today reads the table.
test('today the sky reads the times computed ahead', async ({ page }) => {
  const table = page.waitForResponse((res) => res.url().endsWith('/zones/Africa/Tunis.json'));
  await page.goto('/en/about');
  expect((await table).ok()).toBe(true);
  await expect(page.locator('p[aria-live="polite"]')).toHaveText(
    /^(Now: .+ left|.+ in .+)· Tunis$/,
  );
  await expect(page.getByText('The sky in Tunis right now')).toBeVisible();
});

test('the landing page is in the sitemap', async ({ request }) => {
  const xml = await (await request.get('/sitemaps/places-1.xml')).text();
  expect(xml).toContain('/ar/about');
});

for (const locale of ['ar', 'en', 'fr']) {
  for (const theme of ['light', 'dark']) {
    test(`Landing ${locale} ${theme}`, async ({ page }, info) => {
      await visit(page, `/${locale}/about`, theme);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('p[aria-live="polite"]')).not.toBeEmpty();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-about.png`,
        fullPage: true,
      });
    });
  }
}
