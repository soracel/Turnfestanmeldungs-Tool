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

test('edits, cancels, exports selected rows and reimports corrections on a narrow screen', async ({
  page,
}) => {
  await page.goto('./');
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'fixture.csv', mimeType: 'text/csv', buffer: Buffer.from(fixtureCsv) });
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(0).selectOption('club');
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(1).selectOption('club');
  await page
    .getByRole('combobox', { name: 'Mehrfachauswahl trennen bei', exact: true })
    .selectOption(',');
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await page.getByRole('button', { name: 'Anmeldungen', exact: true }).click();
  await page.getByRole('button', { name: 'Noah Beispiel Datensatz 2 bearbeiten' }).click();
  await page.getByRole('dialog').getByLabel('2. Vorname', { exact: true }).fill('Abgebrochen');
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Noah Beispiel Datensatz 2 bearbeiten' }),
  ).toBeFocused();
  await page.getByRole('checkbox', { name: 'Mia Muster Datensatz 5 auswerten' }).uncheck();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Noah Beispiel Datensatz 2 bearbeiten' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('2. Vorname', { exact: true }).fill('Nico');
  await dialog.getByLabel('5. E-Mail-Adresse', { exact: true }).fill('nico@example.com');
  await dialog.getByLabel('4. Geburtstag', { exact: true }).fill('1995-11-04');
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/registration-editor-mobile.png' });
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Nico Beispiel', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Suche', exact: true }).fill('Nico');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Bereinigte CSV exportieren (5)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('anmeldungen-bereinigt.csv');
  const saved = await download.path();
  if (!saved) throw new Error('Missing CSV download');
  await page.getByRole('button', { name: 'Daten verwerfen' }).click();
  await page.locator('input[type=file]').setInputFiles(saved);
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(0).selectOption('club');
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(1).selectOption('club');
  await page
    .getByRole('combobox', { name: 'Mehrfachauswahl trennen bei', exact: true })
    .selectOption(',');
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await expect(page.getByText(/5 Datensätze/)).toBeVisible();
  await page.getByRole('button', { name: 'Anmeldungen', exact: true }).click();
  await expect(page.getByText('Nico Beispiel', { exact: true })).toBeVisible();
  await expect(page.locator('small').filter({ hasText: /^nico@example\.com$/ })).toBeVisible();
  await expect(page.getByText('Mia Muster', { exact: true })).toHaveCount(1);
});
