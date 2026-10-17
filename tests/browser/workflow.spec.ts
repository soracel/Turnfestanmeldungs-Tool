import { expect, test } from '@playwright/test';
import ExcelJS from 'exceljs';
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
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel herunterladen' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^turnfest-auswertung-.*\.xlsx$/);
  await download.saveAs(test.info().outputPath('review.xlsx'));
  const path = await download.path();
  if (!path) throw new Error('Missing workbook download');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
    'Alle Anmeldungen',
    'Einzelwettkampf',
    'Vereinswettkampf Aktive',
    'Vereinswettkampf 35+',
    'Richter',
    'Festkarten',
  ]);
  expect(workbook.worksheets[0].getCell('B9').value).toBe('Ausgewählt');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Excel herunterladen' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1280, height: 720 });
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

test('reviews festival card quantities, manual choices, exclusion and print on a narrow screen', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.print = () => {
      document.documentElement.dataset.printed = 'true';
    };
  });
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
  await page.getByRole('button', { name: 'Festkarten', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Bestellübersicht', exact: true });
  await expect(summary.getByRole('row', { name: /Typ A/ })).toContainText('490.00');
  await expect(summary).toContainText('1 noch offen');
  const mia = page.getByRole('combobox', { name: 'Festkarte für Mia Muster · #1', exact: true });
  await mia.focus();
  await mia.selectOption('B');
  await expect(mia).toBeFocused();
  await page
    .getByRole('combobox', { name: 'Festkarte für Jan Test · #4', exact: true })
    .selectOption('C');
  await expect(summary.getByRole('row', { name: /Total zugeordnet/ })).toContainText('485.00');
  await page.getByRole('button', { name: 'Anmeldungen', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Mia Muster Datensatz 5 auswerten' }).uncheck();
  await page.getByRole('button', { name: 'Festkarten', exact: true }).click();
  await expect(mia).toHaveValue('B');
  await expect(summary.getByRole('row', { name: /Total zugeordnet/ })).toContainText('387.00');
  await expect(
    page.getByRole('combobox', { name: 'Festkarte für Mia Muster · #5', exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const totalBounds = await summary
    .getByRole('row', { name: /Total zugeordnet/ })
    .getByRole('cell')
    .last()
    .boundingBox();
  if (!totalBounds) throw new Error('Missing visible order total');
  expect(totalBounds.x + totalBounds.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/festival-cards-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Bestellübersicht drucken', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(summary).toBeVisible();
  await expect(mia).not.toBeVisible();
  await expect(page.getByText('Typ B · Jugend · manuell', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: 'test-results/festival-cards-print.png', fullPage: true });
});

test('automatically assigns youth festival cards from the confirmed birth-year boundary', async ({
  page,
}) => {
  const youthCsv = fixtureCsv.replaceAll('1998-04-12', '2010-04-12');
  await page.goto('./');
  await page.locator('input[type=file]').setInputFiles({
    name: 'youth-fixture.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(youthCsv),
  });
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(0).selectOption('club');
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(1).selectOption('club');
  await page
    .getByRole('combobox', { name: 'Mehrfachauswahl trennen bei', exact: true })
    .selectOption(',');
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await page.getByRole('button', { name: 'Festkarten', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Bestellübersicht', exact: true });
  await expect(summary.getByRole('row', { name: /Typ B/ })).toContainText('90.00');
  await expect(page.getByText('Typ B · Jugend · Vorschlag', { exact: true })).toHaveCount(2);
  const card = page.getByRole('combobox', { name: 'Festkarte für Mia Muster · #1', exact: true });
  await card.selectOption('A');
  await expect(summary.getByRole('row', { name: /Typ B/ })).toContainText('45.00');
  await card.selectOption('auto');
  await expect(summary.getByRole('row', { name: /Typ B/ })).toContainText('90.00');
});

test('filters card assignments without changing totals, printed assignments or Excel exports', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Demodaten ausprobieren/ }).click();
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await page.getByRole('button', { name: 'Festkarten', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Bestellübersicht', exact: true });
  const total = await summary.innerText();
  const assignments = page.getByRole('region', { name: 'Festkarten zuordnen' });
  const firstCard = assignments.locator('article').first().getByRole('combobox');
  await firstCard.selectOption('C');
  const updatedTotal = await summary.innerText();
  expect(updatedTotal).not.toBe(total);
  const filter = page.getByRole('combobox', { name: 'Festkarten filtern', exact: true });
  await filter.selectOption('C');
  await expect(firstCard).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Name oder Datensatz suchen' });
  await search.fill('No matching fictional name');
  await expect(search).toBeFocused();
  await expect(page.getByText('Keine Anmeldungen entsprechen diesem Filter.')).toBeVisible();
  expect(await summary.innerText()).toBe(updatedTotal);
  await expect(assignments.locator('article:visible')).toHaveCount(0);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel herunterladen' }).click();
  const download = await downloading;
  const path = await download.path();
  if (!path) throw new Error('Missing workbook');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.getWorksheet('Festkarten');
  if (!sheet) throw new Error('Missing card worksheet');
  expect(sheet.getCell('D9').value).toBe('Typ C');
  expect(sheet.getCell('A58').value).toBe(50);
  await page.emulateMedia({ media: 'print' });
  await expect(assignments.locator('article:visible')).toHaveCount(50);
  await expect(search).not.toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
  await expect(assignments.locator('article:visible')).toHaveCount(50);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('flags a current-year birthday and clears the warning after correction', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
  const csv = fixtureCsv.replace('1998-04-12', '2026-01-01');
  await page.goto('./');
  await page.locator('input[type=file]').setInputFiles({
    name: 'birthday-fixture.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(0).selectOption('club');
  await page.getByRole('combobox', { name: 'Verwendung', exact: true }).nth(1).selectOption('club');
  await page
    .getByRole('combobox', { name: 'Mehrfachauswahl trennen bei', exact: true })
    .selectOption(',');
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await page.getByRole('button', { name: /^Daten prüfen/ }).click();
  await expect(page.getByText(/Geburtstag unplausibel/)).toBeVisible();
  await page.getByRole('button', { name: 'Festkarten', exact: true }).click();
  const card = page.getByRole('combobox', { name: 'Festkarte für Mia Muster · #1', exact: true });
  await expect(card.locator('option:checked')).toContainText('Noch offen');
  await page
    .getByRole('combobox', { name: 'Festkarten filtern', exact: true })
    .selectOption('review');
  await expect(card).toBeVisible();
  await page.getByRole('button', { name: 'Anmeldungen', exact: true }).click();
  await page.getByRole('button', { name: 'Mia Muster Datensatz 1 bearbeiten' }).click();
  await page.getByRole('dialog').getByLabel('4. Geburtstag', { exact: true }).fill('2010-01-01');
  await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
  await page.getByRole('button', { name: 'Festkarten', exact: true }).click();
  await expect(card.locator('option:checked')).toContainText('Typ B');
  await expect(page.getByText(/Geburtstag unplausibel:/)).toHaveCount(0);
});

test('excludes and restores disciplines independently with keyboard controls on a narrow screen', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Demodaten ausprobieren/ }).click();
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await page.getByRole('button', { name: 'Vereinswettkampf', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const selection = page.getByRole('region', { name: 'Disziplinenauswahl Aktive', exact: true });
  const checkbox = selection.getByRole('checkbox').first();
  const label = await checkbox.locator('..').innerText();
  const discipline = label.split(' (')[0].trim();
  await checkbox.focus();
  await checkbox.press('Space');
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toBeFocused();
  await expect(
    page.getByRole('combobox', { name: discipline + ' · Aktive · Wettkampfteil', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Aktive automatisch verteilen', exact: true }).click();
  await expect(checkbox).not.toBeChecked();
  await page.getByRole('button', { name: '35+', exact: true }).click();
  await page.getByRole('button', { name: 'Aktive', exact: true }).click();
  await expect(checkbox).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await checkbox.check();
  await expect(
    page.getByRole('combobox', { name: discipline + ' · Aktive · Wettkampfteil', exact: true }),
  ).toBeVisible();
});

test('resumes a downloaded planning CSV directly with its manual allocation', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Demodaten ausprobieren/ }).click();
  await page.getByRole('button', { name: /Zuordnung bestätigen/ }).click();
  await page.getByRole('button', { name: 'Vereinswettkampf', exact: true }).click();
  const moved = page
    .getByRole('region', { name: 'Einteilung Aktive', exact: true })
    .getByRole('combobox')
    .first();
  const label = await moved.getAttribute('aria-label');
  if (!label) throw new Error('Missing allocation label');
  await moved.selectOption('2');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Planung speichern (CSV)' }).click();
  const download = await pending;
  const saved = await download.path();
  if (!saved) throw new Error('Missing planning download');
  await page.getByRole('button', { name: 'Daten verwerfen' }).click();
  await page.locator('#csv-file').setInputFiles(saved);
  await expect(
    page.getByText('Deine gespeicherte Planung wurde vollständig geladen.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Vereinswettkampf', exact: true }).click();
  await expect(page.getByRole('combobox', { name: label, exact: true })).toHaveValue('2');
});
