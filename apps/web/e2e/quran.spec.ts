import { expect, test, type Page } from '@playwright/test';

// The Quran on web (SPEC 5.5, Phase 5): search to an ayah, a word's meaning, a bookmark, the
// mushaf page view and a khatmah plan. Settings are seeded so onboarding is skipped.
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
};

async function seed(page: Page) {
  await page.addInitScript((s) => {
    localStorage.setItem('murshid-settings', s);
  }, JSON.stringify(settings));
}

test('search, read, look up a word and bookmark an ayah', async ({ page }) => {
  await seed(page);
  await page.goto('/en/quran');
  await expect(page.getByRole('heading', { name: 'Quran', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Surah 2, Al-Baqarah/ })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search the Quran' }).fill('kursi');
  const result = page.getByRole('link', { name: /Al-Baqarah 255/ });
  await expect(result).toBeVisible();
  await result.click();

  await expect(page).toHaveURL(/\/en\/quran\/2\/255$/);
  const ayah = page.getByRole('article', { name: 'Al-Baqarah, verse 255' });
  await expect(ayah).toBeVisible();
  await expect(ayah).toContainText('the Ever-Living');

  // A word's meaning, in a popover beside it.
  await ayah.locator('p[lang="ar"] span.cursor-pointer').nth(5).click();
  await expect(page.getByRole('dialog', { name: 'Meaning' })).toContainText('the Ever-Living');
  await page.keyboard.press('Escape');

  // Bookmark it in green; it shows on the ayah and in the bookmarks list.
  await ayah.getByRole('button', { name: 'Ayah 2:255' }).click();
  await page.getByRole('button', { name: 'Bookmark: Green' }).click();
  await expect(ayah.getByRole('img', { name: 'Green' })).toBeVisible();
  await page.goto('/en/quran');
  await page.getByRole('radio', { name: 'Bookmarks' }).click();
  await expect(page.getByRole('link', { name: /Al-Baqarah 255/ })).toBeVisible();
});

test('read the mushaf and plan a khatmah', async ({ page }) => {
  await seed(page);
  await page.goto('/en/quran/page/2');
  await expect(page.getByRole('heading', { name: 'Page 2', exact: true })).toBeVisible();
  // The page's ayahs are there for screen readers as published text.
  await expect(page.getByLabel('Al-Baqarah, verse 5').first()).toBeAttached();

  await page.goto('/en/quran');
  await page.getByRole('button', { name: 'Plan a khatmah' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Plan a khatmah' });
  await expect(sheet).toContainText('About 21 pages a day');
  await sheet.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByText('Today: pages 1 to 21')).toBeVisible();
});
