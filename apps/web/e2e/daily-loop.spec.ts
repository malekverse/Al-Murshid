import { expect, test } from '@playwright/test';

// The daily loop (SPEC 12, Phase 4 gate): first visit, onboarding by city, Today, "I prayed",
// then an earlier prayer from the sheet. The clock is fixed inside Asr in Tunis.
const ASR_IN_TUNIS = new Date('2026-10-18T14:30:00Z'); // 15:30 local; Asr comes in at 15:11

test('onboard, see Today and log prayers', async ({ page }) => {
  await page.clock.setFixedTime(ASR_IN_TUNIS);

  await page.goto('/en');
  await expect(page).toHaveURL(/\/en\/welcome/);
  await expect(page.getByRole('heading', { name: 'App language' })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();

  await expect(page.getByRole('heading', { name: 'Where are you?' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose a city' }).click();
  await page.getByRole('searchbox').fill('Tunis');
  await page
    .getByRole('button', { name: /^Tunis/ })
    .first()
    .click();
  await expect(page.getByText('Calculation: Tunisia')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Where are you today?' })).toBeVisible();
  await page.getByRole('button', { name: 'I pray sometimes' }).click();

  // Today: inside Asr, one large "I prayed".
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { name: 'Now: Asr' })).toBeVisible();
  await expect(page.getByText('Your focus: Two prayers a day')).toBeVisible();
  await page.getByRole('button', { name: 'I prayed' }).click();
  await expect(page.getByText('Prayed. May Allah accept it.')).toBeVisible();
  await expect(page.getByRole('group', { name: /^Asr, .*, prayed$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Next: Maghrib' })).toBeVisible();

  // An earlier prayer, from the sheet: no questions asked.
  await page.getByRole('button', { name: 'Earlier prayers' }).click();
  const sheet = page.getByRole('dialog', { name: 'Earlier prayers' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('switch', { name: 'Dhuhr' }).first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('group', { name: /^Dhuhr, .*, prayed$/ })).toBeVisible();

  // It all stays after a reload: settings in localStorage, logs in IndexedDB.
  await page.reload();
  await expect(page.getByRole('group', { name: /^Asr, .*, prayed$/ })).toBeVisible();
});
