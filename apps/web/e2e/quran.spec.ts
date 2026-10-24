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

  // The reader opens at the ayah (its own page, /quran/2/255, is for studying and sharing it).
  await expect(page).toHaveURL(/\/en\/quran\/2#ayah-255$/);
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

test('share an ayah as an image, downloaded where files cannot be shared', async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => false });
  });
  await page.goto('/en/quran/112');
  const ayah = page.getByRole('article', { name: 'Al-Ikhlas, verse 1' });
  await ayah.getByRole('button', { name: 'Ayah 112:1' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share as an image' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('al-murshid-112-1.png');
  const bytes = await (await file.createReadStream()).toArray();
  // The ayah's share image, a PNG by its signature.
  expect(Buffer.concat(bytes).subarray(1, 4).toString()).toBe('PNG');
});

test('read the Arabic text and memorize it', async ({ page }) => {
  await seed(page);
  await page.goto('/en/quran/112');
  await page.getByRole('button', { name: 'Reading settings' }).click();
  await page.getByRole('radio', { name: 'Arabic text' }).click();
  // The surah flows as one text, with the mushaf page it is on.
  await expect(page.getByText('Page 604', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ayah 112:4' })).toBeVisible();

  await page.getByRole('button', { name: 'Memorize' }).click();
  await page.getByRole('radio', { name: 'Hide the words' }).click();
  const hidden = page.getByRole('button', { name: 'Hidden word, tap to reveal' });
  // Al-Ikhlas has 15 words; the ayah numbers stay.
  await expect(hidden).toHaveCount(15);
  await hidden.first().click();
  await expect(hidden).toHaveCount(14);
  await expect(page.getByRole('dialog', { name: 'Meaning' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Memorize' }).click();
  await page.getByRole('radio', { name: 'Show everything' }).click();
  await expect(hidden).toHaveCount(0);
});

test('mark a passage and repeat one', async ({ page }) => {
  await seed(page);
  await page.goto('/en/quran/18');
  await page.getByRole('button', { name: 'Ayah 18:1', exact: true }).click();
  await page.getByRole('button', { name: 'Mark a passage' }).click();
  const sheet = page.getByRole('dialog', { name: 'Mark a passage' });
  await expect(sheet).toContainText('From ayah 1');
  await sheet.getByRole('slider', { name: 'To ayah' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(sheet).toContainText('To ayah 3');
  await sheet.getByRole('radio', { name: 'Blue' }).click();
  await sheet.getByRole('button', { name: 'Save' }).click();

  // Ayah 2 is part of the passage.
  await page.getByRole('button', { name: 'Ayah 18:2', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Al-Kahf 2' })).toContainText(
    'Marked as part of Al-Kahf 1–3',
  );
  await page.keyboard.press('Escape');
  await page.goto('/en/quran');
  await page.getByRole('radio', { name: 'Bookmarks' }).click();
  await expect(page.getByRole('link', { name: /Al-Kahf 1–3/ })).toBeVisible();

  await page.goto('/en/quran/18');
  await page.getByRole('button', { name: 'Ayah 18:1', exact: true }).click();
  await page.getByRole('button', { name: 'Repeat a passage' }).click();
  const repeat = page.getByRole('dialog', { name: 'Repeat a passage' });
  // The passage marked here is offered for repeating.
  await expect(repeat).toContainText('To ayah 3');
  await repeat.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: /Al-Kahf/ })).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
});

test('choose a mushaf, color its tajweed, read a tafsir and pick a reciter', async ({ page }) => {
  await seed(page);
  await page.goto('/en/quran/page/2');
  await expect(page.getByRole('heading', { name: 'Page 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reading settings' }).click();
  await page.getByRole('switch', { name: 'Tajweed colors' }).click();
  // The colors are the 1441H mushaf's own: choosing them chooses it.
  await expect(page.getByRole('radio', { name: 'Madani mushaf · 1441H' })).toBeChecked();
  await page.getByRole('searchbox', { name: 'Search reciters' }).fill('basfar');
  await expect(page.getByRole('radio', { name: /Mishary/ })).toHaveCount(0);
  await page.getByRole('radio', { name: /Abdullah Basfar/ }).click();
  await expect(page.getByRole('radio', { name: /Abdullah Basfar/ })).toBeChecked();
  await page.keyboard.press('Escape');
  // The page is drawn in its 1441H font.
  await expect(page.locator('[style*="qcf-v4-p2"]').first()).toBeVisible();

  // The verse view keeps the colors: each word in its glyph, the published text for screen readers.
  await page.getByRole('button', { name: 'Verse view' }).click();
  const ayah = page.getByRole('article', { name: 'Al-Baqarah, verse 2' });
  await expect(ayah.locator('[style*="qcf-v4-p2"]').first()).toBeVisible();
  await expect(ayah.locator('p.sr-only')).toBeAttached();

  // An ayah's tafsir.
  await ayah.getByRole('button', { name: 'Ayah 2:2', exact: true }).click();
  await page.getByRole('button', { name: 'Tafsir' }).click();
  await expect(page.getByRole('dialog', { name: /Tafsir · Al-Baqarah 2/ })).toContainText(
    'Al-Mukhtasar',
  );
});

test('a visitor reads a surah as sent; the reader takes over on a touch, nothing moving', async ({
  page,
}) => {
  // No settings: a first visit, as from a search engine. Nothing sends it to onboarding.
  await page.goto('/en/quran/112');
  const ayah = page.getByRole('article', { name: 'Al-Ikhlas, verse 1' });
  await expect(ayah).toContainText('Allāh');
  const sent = ayah.locator('[data-intent="words"] > span');
  await expect(sent).toHaveCount(5);
  const before = await sent.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width)];
    }),
  );

  // A word's meaning: the full reader takes over and shows it.
  await sent.nth(1).click();
  await expect(page.getByRole('dialog', { name: 'Meaning' })).toBeVisible();
  const words = ayah.locator('p[lang="ar"] > span');
  const after = await words.evaluateAll((els) =>
    els.map((e) => {
      const r = (e.firstElementChild ?? e).getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width)];
    }),
  );
  expect(after).toEqual(before);
});

test("an ayah's own page, and reading on from it", async ({ page }) => {
  await page.goto('/en/quran/2/255');
  await expect(page.getByRole('heading', { name: 'Al-Baqarah 255', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Word by word' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tafsir' })).toBeVisible();
  await expect(page.getByText('Al-Mukhtasar in interpreting the Noble Quran')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Next ayah: Al-Baqarah 256' })).toBeVisible();

  await page.getByRole('link', { name: 'Read the surah from here' }).click();
  await expect(page).toHaveURL(/\/en\/quran\/2#ayah-255$/);
  await expect(page.getByRole('article', { name: 'Al-Baqarah, verse 255' })).toBeInViewport();
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
