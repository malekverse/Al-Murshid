import { expect, test } from '@playwright/test';

// Screenshots of every Phase 4 screen in ar, en and fr, light and dark (SPEC 11 polish checklist).
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

const screens = ['', '/you', '/qibla', '/calendar'];

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
        await expect(page.locator('main h1').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        // Today fades in; shoot once it has.
        await expect(page.locator('main#main').first()).toHaveCSS('opacity', '1');
        const name = path.slice(1) || 'today';
        await page.screenshot({
          path: `e2e/.screens/${info.project.name}/${locale}-${theme}-${name}.png`,
          fullPage: true,
        });
      }
    });
  }
}
