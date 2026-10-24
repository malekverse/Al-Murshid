import { expect, test, type Page } from '@playwright/test';

// Travel times (docs/PHASE-7D.md): the city was chosen by hand in Tunis, and the browser is now on
// Istanbul time. Today offers Istanbul's prayer times; "Not now" is remembered for that time zone.

test.use({ timezoneId: 'Europe/Istanbul' });

const NOW = '2026-10-21T08:00:00Z';

async function seed(page: Page, simpleView = false) {
  await page.clock.setSystemTime(new Date(NOW));
  await page.addInitScript(
    (s) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      sessionStorage.setItem('e2e-seeded', '1');
      localStorage.setItem('murshid-settings', s);
    },
    JSON.stringify({
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
      simpleView,
      lastOpenedOn: '2026-10-21',
      previousOpenedOn: '2026-10-21',
    }),
  );
}

const offer = 'Your phone is on Istanbul time. Use the prayer times for Istanbul?';

test('a new time zone offers its main city, in one tap', async ({ page }) => {
  await seed(page);
  await page.goto('/en');
  await expect(page.getByText(offer)).toBeVisible();
  await page.getByRole('button', { name: 'Use Istanbul' }).click();
  await expect(page.getByText(offer)).toHaveCount(0);
  await expect(page.getByText('Istanbul', { exact: false }).first()).toBeVisible();
  const location = await page.evaluate(
    () =>
      (JSON.parse(localStorage.getItem('murshid-settings')!) as { location: { timeZone: string } })
        .location,
  );
  expect(location.timeZone).toBe('Europe/Istanbul');
});

test('"Not now" is remembered for that time zone, and simple view shows the offer too', async ({
  page,
}) => {
  await seed(page, true);
  await page.goto('/en');
  await expect(page.getByText(offer)).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByText(offer)).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Dhuhr').first()).toBeVisible();
  await expect(page.getByText(offer)).toHaveCount(0);
});
