import { expect, test, type Page } from '@playwright/test';

// Today's greeting and the Tools hub (SPEC 5.11): a greeting for the time of day, the pinned
// tools on Today with the way to all of them, pinning and unpinning, and four at most. The clock is
// a Wednesday morning in Tunis.

const NOW = '2026-10-21T08:00:00Z';

async function seed(page: Page, theme = 'light', pinnedTools?: string[]) {
  await page.clock.setSystemTime(new Date(NOW));
  await page.addInitScript(
    ({ s, t }) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      sessionStorage.setItem('e2e-seeded', '1');
      localStorage.setItem('murshid-settings', s);
      localStorage.setItem('murshid-theme', t);
    },
    {
      s: JSON.stringify({
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
        lastOpenedOn: '2026-10-21',
        previousOpenedOn: '2026-10-21',
        ...(pinnedTools && { pinnedTools }),
      }),
      t: theme,
    },
  );
}

test('the morning greeting, and Qibla and the calendar pinned by default', async ({ page }) => {
  await seed(page);
  await page.goto('/en');
  await expect(page.getByText('Good morning', { exact: true })).toBeVisible();
  const tools = page.getByRole('navigation', { name: 'Tools' });
  await expect(tools.getByRole('link', { name: 'Qibla' })).toBeVisible();
  await expect(tools.getByRole('link', { name: 'Hijri calendar' })).toBeVisible();
  await expect(tools.getByRole('link', { name: 'Tasbih' })).toHaveCount(0);
  await tools.getByRole('link', { name: 'All tools' }).click();
  await expect(page).toHaveURL(/\/en\/tools$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tools' })).toBeVisible();
});

test('pin the tasbih to Today, then unpin Qibla', async ({ page }) => {
  await seed(page);
  await page.goto('/en/tools');
  await page.getByRole('button', { name: 'Pin to Today' }).click();
  await expect(page.getByRole('button', { name: 'Remove from Today' })).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove from Today' }).first().click();

  await page.goto('/en');
  const tools = page.getByRole('navigation', { name: 'Tools' });
  await expect(tools.getByRole('link', { name: 'Tasbih' })).toBeVisible();
  await expect(tools.getByRole('link', { name: 'Qibla' })).toHaveCount(0);
});

test('a phone-only pin stays, and four is the most', async ({ page }) => {
  // Fajr Rise was pinned on the phone: the web keeps it, and with it Today is full.
  await seed(page, 'light', ['rise', 'qibla', 'calendar', 'tasbih']);
  await page.goto('/en/tools');
  await expect(page.getByRole('button', { name: 'Remove from Today' })).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove from Today' }).nth(2).click();
  await page.getByRole('button', { name: 'Pin to Today' }).click();
  await expect(page.getByRole('button', { name: 'Remove from Today' })).toHaveCount(3);
});

for (const locale of ['ar', 'en', 'fr']) {
  for (const theme of ['light', 'dark']) {
    test(`Tools ${locale} ${theme}`, async ({ page }, info) => {
      await seed(page, theme, ['qibla', 'calendar', 'tasbih']);
      await page.goto(`/${locale}/tools`);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-tools.png`,
      });
    });
  }
}
