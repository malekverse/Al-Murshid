import { expect, test, type Page } from '@playwright/test';

// You (SPEC 3, 5.7; Phase 7): Your Sky, a Hijri month of small skies that glow with the prayers
// logged on each day, and the Journey, each track's step with "Change focus" and "Step back".
// Settings are seeded so onboarding is skipped; prayer logs go into the app's own database.

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
  lastOpenedOn: '2026-10-21',
  previousOpenedOn: '2026-10-20',
};

// Wednesday 21 October 2026, 10 Jumada al-Ula 1448, around noon in Tunis.
const NOW = new Date('2026-10-21T11:00:00Z');

/** How many prayers were logged on each day before today: [days back, count]. */
const history: [number, number][] = [
  [1, 5],
  [2, 3],
  [3, 0],
  [4, 1],
  [5, 4],
  [6, 2],
  [7, 5],
  [12, 5],
];

async function seed(page: Page, theme = 'light') {
  await page.clock.setSystemTime(NOW);
  await page.addInitScript(
    ({ s, t }) => {
      localStorage.setItem('murshid-settings', s);
      localStorage.setItem('murshid-theme', t);
    },
    { s: JSON.stringify(settings), t: theme },
  );
  // Open the app once so it creates its database (Dexie's version n is n × 10 in IndexedDB), then
  // add the logs. Opening it any earlier would create an empty one.
  await page.goto('/en');
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await indexedDB.databases()).some((d) => d.name === 'murshid' && (d.version ?? 0) >= 10),
      ),
    )
    .toBe(true);
  await page.evaluate(async (history) => {
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const rows = history.flatMap(([back, count]) => {
      const day = new Date(Date.UTC(2026, 9, 21 - back, 12));
      const date = day.toISOString().slice(0, 10);
      return prayers.slice(0, count).map((prayer) => ({
        key: `${date}:${prayer}`,
        date,
        prayer,
        loggedAt: day.toISOString(),
        source: 'app',
        deleted: false,
      }));
    });
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('murshid');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        let tx: IDBTransaction;
        try {
          tx = db.transaction('prayerLogs', 'readwrite');
        } catch (e) {
          db.close();
          reject(e);
          return;
        }
        rows.forEach((r) => tx.objectStore('prayerLogs').put(r));
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, history);
}

test('Your Sky glows with logged prayers and shows counts only when asked', async ({ page }) => {
  await seed(page);
  await page.goto('/en/you');
  await expect(page.getByRole('heading', { name: 'Your Sky' })).toBeVisible();
  await expect(page.getByText('Jumada al-Ula 1448')).toBeVisible();

  const full = page.getByRole('button', { name: 'Tuesday, October 20, 5 lights' });
  await expect(full).toBeVisible();
  await expect(page.getByRole('button', { name: 'Monday, October 19, 3 lights' })).toBeVisible();
  // A day without prayers is plain night: its name is just the date.
  await expect(page.getByRole('button', { name: 'Sunday, October 18', exact: true })).toBeVisible();
  // No sky for the month still to come.
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();

  // A day's own sky and the prayers its lights are for.
  await page.getByRole('button', { name: 'Monday, October 19, 3 lights' }).click();
  const sheet = page.getByRole('dialog', { name: 'Monday, October 19' });
  await expect(sheet).toContainText('Fajr');
  await expect(sheet).toContainText('Asr');
  await expect(sheet).not.toContainText('Isha');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();

  // Numbers only with "Show details".
  await expect(full).not.toContainText('5');
  await page.getByRole('switch', { name: 'Show details' }).click();
  await expect(full).toContainText('5');

  // The month before holds the older days.
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.getByText('Rabi‘ al-Thani 1448')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Friday, October 9, 5 lights' })).toBeVisible();
});

test('the Journey: change focus, step back, start and pause a track', async ({ page }) => {
  await seed(page);
  await page.goto('/en/you');
  const prayer = page.getByRole('region', { name: 'Prayer', exact: true });
  await expect(prayer).toContainText('Maghrib, every day');

  await prayer.getByRole('button', { name: 'Change focus' }).click();
  await page.getByRole('radio', { name: 'Two prayers a day' }).click();
  await expect(prayer).toContainText('Two prayers a day');
  await prayer.getByRole('button', { name: 'Step back' }).click();
  await expect(prayer).toContainText('Maghrib, every day');
  await expect(prayer.getByRole('button', { name: 'Step back' })).toHaveCount(0);

  // The first step asks which prayer.
  await prayer.getByRole('button', { name: 'Change focus' }).click();
  await page.getByRole('radio', { name: 'Maghrib, every day' }).click();
  await page.getByRole('radio', { name: 'Fajr' }).click();
  await expect(prayer).toContainText('Fajr, every day');

  const quran = page.getByRole('region', { name: 'Quran', exact: true });
  await expect(quran).toContainText('Not following this for now');
  await quran.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('radio', { name: 'One page a day' }).click();
  await expect(quran).toContainText('One page a day');
  await quran.getByRole('button', { name: 'Not now' }).click();
  await expect(quran).toContainText('Not following this for now');
});

for (const locale of ['ar', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`You ${locale} ${theme}`, async ({ page }, info) => {
      await seed(page, theme);
      await page.goto(`/${locale}/you`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="grid"] button').first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `e2e/.screens/${info.project.name}/${locale}-${theme}-you-sky.png`,
        fullPage: true,
      });
    });
  }
}
