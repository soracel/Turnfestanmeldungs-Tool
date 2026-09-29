import { expect, test } from '@playwright/test';
import { fixtureCsv } from '../fixture';
test('runs demo planning, manual changes, current export, print, and reset under a subpath', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.clipboard = text;
        },
      },
    });
    window.print = () => {
      document.documentElement.dataset.printed = 'true';
    };
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Demodaten ausprobieren/ }).click();
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await expect(page.getByText(/50 Datensätze/)).toBeVisible();
  await page.getByRole('button', { name: 'Vereinswettkampf', exact: true }).click();
  const controls = page
    .getByRole('region', { name: 'Einteilung Aktive', exact: true })
    .getByRole('combobox');
  const moved = controls.first();
  const name = await moved.getAttribute('aria-label');
  await moved.selectOption('2');
  await expect(page.getByRole('combobox', { name: name! })).toBeFocused();
  await page.getByRole('button', { name: '35+', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Einteilung 35+', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Aktive', exact: true }).click();
  await expect(page.getByRole('combobox', { name: name! })).toHaveValue('2');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/planning-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/planning-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole('button', { name: 'Contest vorbereiten', exact: true }).click();
  await page.getByRole('button', { name: /kopieren/i }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-clipboard',
    /50 ausgewählte Anmeldungen/,
  );
  const copied = await page.locator('html').getAttribute('data-clipboard');
  const activePartThree = copied?.split('\nAktive\n')[1].split('\n35+\n')[0].split('Teil 3:')[1];
  expect(activePartThree).toContain(name?.split(' · ')[0]);
  await page.getByRole('button', { name: /drucken/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('region', { name: 'Einteilung Aktive', exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Einteilung Aktive', exact: true })
      .locator('details li')
      .first(),
  ).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Daten verwerfen' }).click();
  await expect(page.getByRole('button', { name: /Demodaten ausprobieren/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('imports a fictional CSV and requires explicit discipline mapping', async ({ page }) => {
  await page.goto('./');
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'fixture.csv', mimeType: 'text/csv', buffer: Buffer.from(fixtureCsv) });
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await expect(page.getByRole('status')).toContainText(/Disziplin/);
});
