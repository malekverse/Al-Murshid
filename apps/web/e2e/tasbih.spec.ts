import { expect, test, type Page } from '@playwright/test';

// Tasbih (SPEC 5.6): Remember lists it, the whole area counts (pointer and keyboard), a target
// completes a round, the count and the day's total survive a reload, reset can be undone, and
// the target can be none or a custom one. The clock is set to a Wednesday morning in Tunis.

const NOW = '2026-10-21T08:00:00Z';

async function seed(page: Page, theme = 'light') {
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
      }),
      t: theme,
    },
  );
}

const counter = (page: Page) => page.getByRole('button', { name: /^Count/ });

async function tap(page: Page, times: number) {
  for (let i = 0; i < times; i++) await counter(page).click();
}

test('count toward a target, keep the day’s total, and start a new round', async ({ page }) => {
  await seed(page);
  await page.goto('/en/remember');
  await expect(page.getByText(/once their texts are reviewed/)).toBeVisible();
  await page.getByRole('link', { name: /Tasbih/ }).click();
  await expect(page).toHaveURL(/\/en\/remember\/tasbih$/);
  await expect(page.getByRole('heading', { name: 'Tasbih' })).toBeVisible();

  await tap(page, 3);
  await expect(counter(page)).toHaveAccessibleName('Count 3 of 33');
  // The keyboard counts too.
  await counter(page).press('Space');
  await counter(page).press('Enter');
  await expect(counter(page)).toHaveAccessibleName('Count 5 of 33');

  await tap(page, 28);
  await expect(counter(page)).toHaveAccessibleName('Count 33 of 33');
  await expect(page.getByRole('status').filter({ hasText: 'Target reached' })).toBeAttached();
  await tap(page, 1);
  await expect(counter(page)).toHaveAccessibleName('Count 1 of 33');
  await expect(page.getByText('Today: 34')).toBeVisible();

  await page.reload();
  await expect(counter(page)).toHaveAccessibleName('Count 1 of 33');
  await expect(page.getByText('Today: 34')).toBeVisible();
  await page.goto('/en/remember');
  await expect(page.getByText('Today: 34')).toBeVisible();
});

test('reset can be undone', async ({ page }) => {
  await seed(page);
  await page.goto('/en/remember/tasbih');
  await tap(page, 4);
  await page.getByRole('button', { name: 'Reset the count' }).click();
  await expect(counter(page)).toHaveAccessibleName('Count 0 of 33');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(counter(page)).toHaveAccessibleName('Count 4 of 33');
  // The day's total is what was said, whatever the count on screen.
  await expect(page.getByText('Today: 4')).toBeVisible();
});

test('no target, or a custom one', async ({ page }) => {
  await seed(page);
  await page.goto('/en/remember/tasbih');
  await page.getByRole('button', { name: 'Target: 33' }).click();
  const sheet = page.getByRole('dialog', { name: 'Target' });
  await sheet.getByRole('radio', { name: 'None' }).click();
  await expect(sheet).toHaveCount(0);
  await tap(page, 2);
  await expect(counter(page)).toHaveAccessibleName('Count 2');

  await page.getByRole('button', { name: 'None' }).click();
  await page.getByLabel('Custom target').fill('3');
  await page.getByRole('button', { name: 'Set' }).click();
  await expect(page.getByRole('button', { name: 'Target: 3' })).toBeVisible();
  await tap(page, 1);
  await expect(counter(page)).toHaveAccessibleName('Count 3 of 3');
  await expect(page.getByText('Target reached', { exact: true }).first()).toBeVisible();
});

for (const locale of ['ar', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`Tasbih ${locale} ${theme}`, async ({ page }, info) => {
      await seed(page, theme);
      await page.goto(`/${locale}/remember`);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-remember.png`,
      });
      await page.goto(`/${locale}/remember/tasbih`);
      const count = page.getByRole('button', { name: /^(Count|العدّ)/ });
      for (let i = 0; i < 12; i++) await count.click();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-tasbih.png`,
      });
    });
  }
}
