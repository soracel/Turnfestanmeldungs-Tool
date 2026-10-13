import { describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { createSessionController } from '../src/application/session/controller';
import { workbookModel } from '../src/application/session/workbook';
import { parseCsv } from '../src/infrastructure/csv/papa-parser';
import { createWorkbook } from '../src/infrastructure/exports/workbook';
import {
  answerLabels,
  categoryLabels,
  issueText,
  registrationName,
} from '../src/presentation/messages/de-CH';
import { fixtureCsv } from './fixture';
import { referenceDate } from './helpers';

const messages = {
  answers: answerLabels,
  categories: categoryLabels,
  issue: issueText,
  name: registrationName,
};
async function setup() {
  const downloadWorkbook = vi.fn(async () => {});
  const controller = createSessionController({
    parseCsv,
    today: () => referenceDate,
    writeClipboard: vi.fn(),
    print: vi.fn(),
    formatExport: () => '',
    downloadWorkbook,
    downloadCsv: vi.fn(),
  });
  await controller.importSource({
    name: 'fixture.csv',
    size: fixtureCsv.length,
    demo: true,
    read: async () => fixtureCsv,
  });
  controller.confirmMapping();
  const ready = () => {
    const session = controller.getSnapshot().session;
    if (session.stage !== 'ready') throw new Error('Expected ready session');
    return session;
  };
  return { controller, ready, downloadWorkbook };
}
function values(sheet: ExcelJS.Worksheet) {
  const result: ExcelJS.CellValue[][] = [];
  sheet.eachRow((row) => {
    result.push(
      Array.from({ length: sheet.columnCount }, (_, index) => row.getCell(index + 1).value),
    );
  });
  return result;
}
function requiredSheet(workbook: ExcelJS.Workbook, name: string) {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Missing ${name}`);
  return sheet;
}
describe('Excel review export', () => {
  it('round trips five sheets with exclusions, current manual plans, typed dates and safe text', async () => {
    const { controller, ready } = await setup();
    const excluded = ready().registrations[1];
    controller.selectRegistration(excluded.id, false);
    controller.moveDiscipline('active', 'Fachtest Allround', 2);
    controller.moveDiscipline('active', 'Pendelstafette', 2);
    const session = ready();
    const registrations = session.registrations.map((item, index) =>
      index === 0 ? { ...item, first: '=1+1' } : item,
    );
    const model = workbookModel({ ...session, registrations });
    const output = createWorkbook(model, referenceDate, messages);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await output.xlsx.writeBuffer());
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Alle Anmeldungen',
      'Einzelwettkampf',
      'Vereinswettkampf Aktive',
      'Vereinswettkampf 35+',
      'Richter',
    ]);
    const all = requiredSheet(workbook, 'Alle Anmeldungen');
    expect(all.getCell('C9').value).toBe('=1+1');
    expect(all.getCell('C9').type).toBe(ExcelJS.ValueType.String);
    expect(all.getCell('E9').value).toBeInstanceOf(Date);
    expect(all.getCell('E12').value).toBe('2000-02-30');
    expect(values(all).find((row) => row[0] === excluded.rowNumber)?.[1]).toBe('Ausgeschlossen');
    for (const name of [
      'Einzelwettkampf',
      'Vereinswettkampf Aktive',
      'Vereinswettkampf 35+',
      'Richter',
    ]) {
      expect(
        values(requiredSheet(workbook, name))
          .filter((row) => typeof row[0] === 'number')
          .map((row) => row[0]),
      ).not.toContain(excluded.rowNumber);
    }
    const active = requiredSheet(workbook, 'Vereinswettkampf Aktive');
    expect(active.getCell('F1').value).toBe('Teil 3');
    expect(active.getCell('F2').value).toBe('Fachtest Allround');
    expect(active.getCell('F3').value).toBe('=1+1');
    expect(active.getCell('G3').value).toBe('Muster');
    expect(active.getCell('F4').value).toBe('Mia');
    expect(active.getCell('F16').value).toBe(2);
    expect(active.getCell('F3').fill).toMatchObject({ fgColor: { argb: 'FFFFDADA' } });
    expect(active.getCell('F18').value).toBe('Verantwortlich');
    expect(active.getCell('F19').value).toBeNull();
    expect(JSON.stringify(values(active))).not.toContain('Noah');
    const masters = requiredSheet(workbook, 'Vereinswettkampf 35+');
    expect(masters.getCell('B3').value).toBe('Lea');
    expect(masters.getCell('C3').value).toBe('Demo');
    for (const sheet of workbook.worksheets) {
      const club = sheet.name.startsWith('Vereinswettkampf');
      if (!club) expect(sheet.autoFilter).toBeTruthy();
      else expect(sheet.autoFilter).toBeUndefined();
      expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: club ? 2 : 8 });
      expect(sheet.pageSetup).toMatchObject({ fitToWidth: 1, fitToHeight: 0 });
    }
    expect(ready()).toBe(session);
  });
  it('keeps uncertain judges and unplanned registrations visible and applies category overrides', async () => {
    const { ready } = await setup();
    const session = ready();
    const registrations = session.registrations.map((item, index) =>
      index === 0
        ? { ...item, category: 'Unbekannt', judge: 'open' as const, brevet: 'LA' }
        : index === 1
          ? { ...item, judge: 'no' as const, brevet: 'LA' }
          : item,
    );
    const model = workbookModel({ ...session, registrations });
    expect(model.unclearJudges.map((item) => item.id)).toEqual(
      registrations.slice(0, 2).map((item) => item.id),
    );
    expect(model.unplannedDetails[0].category).toBeNull();
    const output = createWorkbook(model, referenceDate, messages);
    expect(
      values(requiredSheet(output, 'Alle Anmeldungen')).some((row) =>
        row.some((cell) => String(cell).includes('Kategorie nicht zugeordnet')),
      ),
    ).toBe(true);
    const mapped = workbookModel({
      ...session,
      registrations,
      overrides: new Map([['Unbekannt', 'masters35']]),
    });
    expect(mapped.all[0].category).toBe('masters35');
    expect(mapped.unplanned).toHaveLength(0);
  });
  it('exports all records on sheet one even when nothing is selected', async () => {
    const { controller, ready } = await setup();
    for (const item of ready().registrations) controller.selectRegistration(item.id, false);
    const model = workbookModel(ready());
    expect(model.all).toHaveLength(6);
    expect(model.individual).toHaveLength(0);
    expect(model.judges).toHaveLength(0);
    const workbook = createWorkbook(model, referenceDate, messages);
    await expect(workbook.xlsx.writeBuffer()).resolves.toBeTruthy();
  });
  it('retains separate duplicate rows and assigned registrations without disciplines', async () => {
    const { ready } = await setup();
    const session = ready();
    const registrations = session.registrations.map((item, index) =>
      index === 5 ? { ...item, clubDisciplines: [] } : item,
    );
    const model = workbookModel({ ...session, registrations });
    const workbook = createWorkbook(model, referenceDate, messages);
    const active = requiredSheet(workbook, 'Vereinswettkampf Aktive');
    const names = values(active).flat();
    expect(names.filter((value) => value === 'Muster').length).toBeGreaterThanOrEqual(2);
    expect(names.some((cell) => String(cell).includes('Disziplinen fehlen'))).toBe(true);
    expect(model.clubSheets[0].registrations.map((item) => item.last)).toEqual([
      'Beispiel',
      'Fiktiv',
      'Muster',
      'Muster',
    ]);
  });
  it('exports edited registration data while retaining the original source', async () => {
    const { controller, ready } = await setup();
    const before = ready();
    const registration = before.registrations[0];
    const row = [...before.table.rows[registration.rowNumber - 1]];
    row[1] = 'Mira';
    controller.editRegistration(registration.id, row);
    const workbook = createWorkbook(workbookModel(ready()), referenceDate, messages);
    expect(requiredSheet(workbook, 'Alle Anmeldungen').getCell('C9').value).toBe('Mira');
    const active = requiredSheet(workbook, 'Vereinswettkampf Aktive');
    expect(values(active).flat()).toContain('Mira');
    expect(ready().originalTable.rows[registration.rowNumber - 1][1]).toBe('Mia');
  });
  it('downloads on explicit command and reports failure without altering session state', async () => {
    const { controller, ready, downloadWorkbook } = await setup();
    expect(downloadWorkbook).not.toHaveBeenCalled();
    const session = ready();
    await controller.downloadWorkbook();
    expect(downloadWorkbook).toHaveBeenCalledWith(workbookModel(session), referenceDate);
    downloadWorkbook.mockRejectedValueOnce(new Error('Failed'));
    await controller.downloadWorkbook();
    expect(controller.getSnapshot().message).toEqual({ kind: 'status', code: 'workbook-failed' });
    expect(ready()).toBe(session);
    controller.reset();
    await controller.downloadWorkbook();
    expect(downloadWorkbook).toHaveBeenCalledTimes(2);
  });
});
