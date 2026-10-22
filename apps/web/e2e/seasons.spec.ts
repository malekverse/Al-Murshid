import { expect, test, type Page } from '@playwright/test';

// Seasonal modes on Today (SPEC 5.8; Phase 7 gate: "Ramadan mode verified with a simulated date").
// The clock is set to moments of Ramadan 1448 and Dhul Hijjah 1448 in Tunis (time keeps flowing,
// so countdowns tick). Settings are seeded so onboarding is skipped.

function settingsOn(date: string, extra: Record<string, unknown> = {}) {
  return {
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
    // Opened yesterday too, so no "Welcome back" takes the card's place.
    lastOpenedOn: date,
    previousOpenedOn: date,
    ...extra,
  };
}

async function at(page: Page, instant: string, theme = 'light', extra = {}) {
  await page.clock.setSystemTime(new Date(instant));
  const date = instant.slice(0, 10);
  await page.addInitScript(
    ({ s, t }) => {
      localStorage.setItem('murshid-settings', s);
      localStorage.setItem('murshid-theme', t);
    },
    { s: JSON.stringify(settingsOn(date, extra)), t: theme },
  );
}

// 1 Ramadan 1448 is Monday 8 February 2027 in Tunis: Fajr 05:48, Maghrib 17:52, Isha 19:20.
const FIRST_DAY_NOON = '2027-02-08T12:00:00Z';
const FIRST_NIGHT = '2027-02-08T19:00:00Z';
// Maghrib on the 20th (27 February 2027) begins the last ten nights.
const NIGHT_21 = '2027-02-27T18:30:00Z';

test('Ramadan by day: iftar countdown, the day’s juz and today’s fast', async ({ page }) => {
  await at(page, FIRST_DAY_NOON);
  await page.goto('/en');
  await expect(page.getByText(/^Iftar in /)).toBeVisible();
  const card = page.getByRole('region', { name: 'Ramadan, day 1' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: 'Read juz 1' })).toBeVisible();
  // No Taraweeh by day.
  await expect(card.getByRole('switch', { name: 'Taraweeh tonight' })).toHaveCount(0);

  // "Fasted" or "not today", and nothing asked either way.
  const fasted = card.getByRole('button', { name: 'Fasted' });
  await fasted.click();
  await expect(fasted).toHaveAttribute('aria-pressed', 'true');
  await card.getByRole('button', { name: 'Not today' }).click();
  await expect(card.getByRole('button', { name: 'Not today' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(fasted).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Ramadan, day 1' }).getByRole('button', { name: 'Not today' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('Ramadan by night: suhoor countdown, tomorrow’s fast and tonight’s Taraweeh', async ({
  page,
}) => {
  await at(page, FIRST_NIGHT);
  await page.goto('/en');
  await expect(page.getByText(/^Suhoor ends in /)).toBeVisible();
  const card = page.getByRole('region', { name: 'Ramadan, day 2' });
  await expect(card.getByRole('link', { name: 'Read juz 2' })).toBeVisible();
  const taraweeh = card.getByRole('switch', { name: 'Taraweeh tonight' });
  await taraweeh.click();
  await expect(taraweeh).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Ramadan, day 2' })
      .getByRole('switch', { name: 'Taraweeh tonight' }),
  ).toHaveAttribute('aria-checked', 'true');
});

test('the last ten nights begin at Maghrib on the 20th', async ({ page }) => {
  await at(page, NIGHT_21);
  await page.goto('/en');
  const card = page.getByRole('region', { name: 'Ramadan, day 21' });
  await expect(card).toContainText('The last ten nights');
  await expect(card.getByRole('link', { name: 'Read juz 21' })).toBeVisible();
});

test('Ramadan mode can be turned off', async ({ page }) => {
  await at(page, FIRST_DAY_NOON, 'light', { ramadanMode: false });
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/^Iftar in /)).toHaveCount(0);
  await expect(page.getByRole('region', { name: /^Ramadan/ })).toHaveCount(0);
  await page.goto('/en/you');
  await expect(page.getByRole('switch', { name: 'Ramadan mode' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('Jumu’ah from Thursday’s Maghrib: Surah Al-Kahf', async ({ page }) => {
  await at(page, '2026-10-22T18:00:00Z');
  await page.goto('/en');
  const card = page.getByRole('region', { name: 'Jumu’ah' });
  await expect(card).toContainText('Surah Al-Kahf');
  await expect(card.getByRole('link', { name: 'Read Al-Kahf' })).toHaveAttribute(
    'href',
    '/en/quran/18',
  );
  await card.getByRole('button', { name: 'Hide for today' }).click();
  await expect(card).toHaveCount(0);
});

test('Dhul Hijjah: the eve of Arafah', async ({ page }) => {
  // Friday 14 May 2027 is 8 Dhul Hijjah 1448; after Maghrib Jumu'ah's card has ended.
  await at(page, '2027-05-14T19:00:00Z');
  await page.goto('/en');
  const card = page.getByRole('region', { name: 'The first ten days of Dhul Hijjah' });
  await expect(card).toContainText('Tomorrow is the Day of Arafah');
});

for (const locale of ['ar', 'en', 'fr']) {
  for (const theme of ['light', 'dark']) {
    test(`Ramadan night ${locale} ${theme}`, async ({ page }, info) => {
      await at(page, NIGHT_21, theme);
      await page.goto(`/${locale}`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('main#main').first()).toHaveCSS('opacity', '1');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-ramadan-night.png`,
        fullPage: true,
      });
    });
  }
}
