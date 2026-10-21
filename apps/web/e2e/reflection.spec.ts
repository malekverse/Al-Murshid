import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Night reflection and privacy (SPEC 5.7): Today's invitation after Isha, three fields kept in
// this browser and sealed with AES-GCM, earlier nights read again or deleted, export as JSON,
// and delete everything in one confirmed action. The clock is set to evenings in Tunis.

// Sunday 18 October 2026 in Tunis: Isha 19:47, so 21:30 is well inside the night.
const SUNDAY_NIGHT = '2026-10-18T20:30:00Z';
// 00:30 on Monday: still Sunday's night.
const AFTER_MIDNIGHT = '2026-10-18T23:30:00Z';
const MONDAY_NIGHT = '2026-10-19T20:30:00Z';

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
    lastOpenedOn: date,
    previousOpenedOn: date,
    ...extra,
  };
}

/** Seeds settings once per tab, so "Delete everything" is not undone by the next load. */
async function at(page: Page, instant: string, theme = 'light', extra = {}) {
  await page.clock.setSystemTime(new Date(instant));
  await page.addInitScript(
    ({ s, t }) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      sessionStorage.setItem('e2e-seeded', '1');
      localStorage.setItem('murshid-settings', s);
      localStorage.setItem('murshid-theme', t);
    },
    { s: JSON.stringify(settingsOn(instant.slice(0, 10), extra)), t: theme },
  );
}

async function write(page: Page, gratitude: string, intention = '', note = '') {
  await page.getByLabel('Something you’re grateful for').fill(gratitude);
  await page.getByLabel('An intention for tomorrow').fill(intention);
  await page.getByLabel('A note, if you like').fill(note);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();
}

/** The stored rows, as IndexedDB holds them. */
function storedReflections(page: Page) {
  return page.evaluate(
    () =>
      new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open('murshid');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result
            .transaction('reflections')
            .objectStore('reflections')
            .getAll();
          request.onsuccess = () => {
            open.result.close();
            resolve(
              (request.result as { date: string; iv: Uint8Array; sealed: ArrayBuffer }[]).map(
                (row) => ({
                  keys: Object.keys(row).sort(),
                  date: row.date,
                  ivLength: row.iv.length,
                  sealed: new TextDecoder('utf-8', { fatal: false }).decode(row.sealed),
                }),
              ),
            );
          };
          request.onerror = () => reject(request.error);
        };
      }),
  );
}

test('after Isha Today invites a reflection, kept sealed in this browser', async ({ page }) => {
  await at(page, SUNDAY_NIGHT);
  await page.goto('/en');
  const card = page.getByRole('region', { name: 'Before you sleep' });
  await card.getByRole('link', { name: 'Reflect' }).click();
  await expect(page).toHaveURL(/\/en\/you#reflection$/);
  await expect(page.getByLabel('Something you’re grateful for')).toBeFocused();

  await write(page, 'My family', 'Fajr on time', 'A quiet day');
  const rows = await storedReflections(page);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    keys: ['date', 'iv', 'sealed', 'updatedAt'],
    date: '2026-10-18',
    ivLength: 12,
  });
  // Nothing written is readable at rest.
  const sealed = (rows[0] as { sealed: string }).sealed;
  for (const plain of ['My family', 'Fajr on time', 'A quiet day', 'gratitude']) {
    expect(sealed).not.toContain(plain);
  }

  // Opened again on the next visit, and Today's invitation has done its work.
  await page.reload();
  await expect(page.getByLabel('Something you’re grateful for')).toHaveValue('My family');
  await expect(page.getByLabel('A note, if you like')).toHaveValue('A quiet day');
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Before you sleep' })).toHaveCount(0);
});

test('“Not tonight” sets the evening aside, past midnight too', async ({ page }) => {
  await at(page, SUNDAY_NIGHT);
  await page.goto('/en');
  const card = page.getByRole('region', { name: 'Before you sleep' });
  await card.getByRole('button', { name: 'Not tonight' }).click();
  await expect(card).toHaveCount(0);

  await page.clock.setSystemTime(new Date(AFTER_MIDNIGHT));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Before you sleep' })).toHaveCount(0);

  // The next evening invites again.
  await page.clock.setSystemTime(new Date(MONDAY_NIGHT));
  await page.reload();
  await expect(page.getByRole('region', { name: 'Before you sleep' })).toBeVisible();
});

test('the invitation can be turned off', async ({ page }) => {
  await at(page, SUNDAY_NIGHT, 'light', { reflectionPrompt: false });
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Before you sleep' })).toHaveCount(0);
  await page.goto('/en/you');
  await expect(page.getByRole('switch', { name: 'Invite me after Isha' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('earlier nights can be read again and deleted', async ({ page }) => {
  await at(page, SUNDAY_NIGHT);
  await page.goto('/en/you#reflection');
  await write(page, 'A walk after Asr');

  await page.clock.setSystemTime(new Date(MONDAY_NIGHT));
  await page.reload();
  await expect(page.getByLabel('Something you’re grateful for')).toHaveValue('');
  const earlier = page.getByRole('group', { name: 'Earlier nights' });
  await earlier.getByRole('button', { name: /Sunday, October 18/ }).click();

  const sheet = page.getByRole('dialog', { name: 'Sunday, October 18' });
  await expect(sheet).toContainText('A walk after Asr');
  await sheet.getByRole('button', { name: 'Delete this reflection' }).click();
  await expect(sheet).toContainText('It can’t be brought back.');
  await sheet.getByRole('button', { name: 'Delete this reflection' }).click();
  await expect(page.getByText('Deleted.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Earlier nights' })).toHaveCount(0);
  expect(await storedReflections(page)).toEqual([]);
});

test('export everything as one JSON file', async ({ page }) => {
  await at(page, SUNDAY_NIGHT);
  await page.goto('/en/you#reflection');
  await write(page, 'My family', 'Fajr on time');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Export my data/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('al-murshid-2026-10-18.json');
  const data = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(data).toMatchObject({
    format: 'al-murshid-export',
    version: 1,
    platform: 'web',
    settings: { method: 'tunisia', location: { label: 'Tunis' } },
    reflections: [{ date: '2026-10-18', gratitude: 'My family', intention: 'Fajr on time' }],
  });
  expect(data.prayerLogs).toEqual([]);
});

test('delete everything on this device, after one confirmation', async ({ page }) => {
  await at(page, SUNDAY_NIGHT);
  await page.goto('/en/you#reflection');
  await write(page, 'My family');

  await page.getByRole('button', { name: /^Delete everything on this device/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Delete everything?' });
  await sheet.getByRole('button', { name: 'Cancel' }).click();
  await expect(sheet).toHaveCount(0);

  await page.getByRole('button', { name: /^Delete everything on this device/ }).click();
  await page
    .getByRole('dialog', { name: 'Delete everything?' })
    .getByRole('button', { name: 'Delete everything' })
    .click();
  await expect(page).toHaveURL(/\/en\/welcome/);
  const left = await page.evaluate(async () => ({
    settings: localStorage.getItem('murshid-settings'),
    databases: (await indexedDB.databases()).map((d) => d.name),
  }));
  expect(left.settings).toBeNull();
  // The app may open a fresh, empty database on the way to onboarding.
  if (left.databases.includes('murshid')) expect(await storedReflections(page)).toEqual([]);
});

for (const locale of ['ar', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`Night reflection ${locale} ${theme}`, async ({ page }, info) => {
      await at(page, SUNDAY_NIGHT, theme);
      await page.goto(`/${locale}`);
      await expect(page.locator('main#main').first()).toHaveCSS('opacity', '1');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-reflection-card.png`,
      });
      await page.goto(`/${locale}/you#reflection`);
      const section = page.locator('#reflection');
      await expect(section.locator('textarea').first()).toBeVisible();
      await section
        .locator('textarea')
        .first()
        .fill(locale === 'ar' ? 'صحبة طيبة' : 'Good company');
      await page.evaluate(() => document.fonts.ready);
      await section.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-reflection.png`,
      });
    });
  }
}
