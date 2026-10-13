import ExcelJS from 'exceljs';
import { addClubWorksheet } from './club-workbook';
import type { WorkbookModel } from '../../application/session/workbook';
import type { Registration } from '../../domain/registration/model';
import type { ExportMessages } from './text';

type Value = string | number | Date;
interface Section {
  title: string;
  headers: string[];
  rows: Value[][];
  filter?: boolean;
}

function birthday(registration: Registration): Value {
  if (registration.issues.some((issue) => issue.code === 'invalid-birthday'))
    return registration.birth || 'Fehlt';
  const value = registration.birth;
  const local = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (local) return new Date(Date.UTC(+local[3], +local[2] - 1, +local[1]));
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  return value || 'Fehlt';
}

export function createWorkbook(model: WorkbookModel, exportedAt: Date, messages: ExportMessages) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Turnfest Planer';
  workbook.created = exportedAt;
  const missing = (value: string) => value || 'Keine Angabe';
  const hints = (item: Registration) => item.issues.map(messages.issue).join('\n');
  const category = (value: WorkbookModel['all'][number]['category']) =>
    value ? messages.categories[value] : 'Nicht zugeordnet';

  function sheet(name: string, scope: string, sections: Section[]) {
    const detail = sections.find((section) => section.filter);
    if (!detail) throw new Error('Workbook sheet requires a detail section');
    const sideWidth = Math.max(
      0,
      ...sections.filter((section) => !section.filter).map((section) => section.headers.length),
    );
    const width = detail.headers.length + (sideWidth ? sideWidth + 1 : 0);
    const worksheet = workbook.addWorksheet(name, {
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });
    worksheet.addRow([name]);
    worksheet.mergeCells(1, 1, 1, width);
    worksheet.getRow(1).height = 30;
    worksheet.getCell('A1').font = {
      name: 'Calibri',
      size: 20,
      bold: true,
      color: { argb: 'FF173B36' },
    };
    worksheet.addRow(['Exportdatum (UTC)', exportedAt]);
    worksheet.getCell('B2').numFmt = 'dd.mm.yyyy hh:mm';
    worksheet.addRow([`Quelle: ${model.filename}`]);
    worksheet.mergeCells(3, 1, 3, width);
    worksheet.addRow([scope]);
    worksheet.mergeCells(4, 1, 4, width);
    worksheet.addRow([
      'Momentaufnahme. Änderungen in Excel werden nicht in den Planer übernommen.',
    ]);
    worksheet.mergeCells(5, 1, 5, width);
    let sideRow = 7;
    for (const section of [detail, ...sections.filter((section) => !section.filter)]) {
      const startColumn = section.filter ? 1 : detail.headers.length + 2;
      let nextRow = section.filter ? 7 : sideRow;
      function addRow(values: Value[]) {
        const row = worksheet.getRow(nextRow++);
        values.forEach((value, index) => {
          row.getCell(startColumn + index).value = value;
        });
        return row;
      }
      const title = addRow([section.title]);
      worksheet.mergeCells(
        title.number,
        startColumn,
        title.number,
        startColumn + section.headers.length - 1,
      );
      title.getCell(startColumn).font = { bold: true, color: { argb: 'FF173B36' } };
      const header = addRow(section.headers);
      header.height = Math.max(header.height ?? 0, 32);
      section.headers.forEach((_, index) => {
        const cell = header.getCell(startColumn + index);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173B36' } };
        cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      section.rows.forEach((values, rowIndex) => {
        const row = addRow(values);
        let lines = 1;
        values.forEach((value, index) => {
          const column = index + 1;
          const cell = row.getCell(startColumn + index);
          cell.font = { name: 'Calibri', size: 11 };
          cell.alignment = { vertical: 'top', wrapText: true };
          if (cell.value instanceof Date) cell.numFmt = 'dd.mm.yyyy';
          if (typeof cell.value === 'number') cell.numFmt = '0';
          const text = value instanceof Date ? 'dd.mm.yyyy' : String(value);
          lines = Math.max(lines, ...text.split('\n').map((line) => Math.ceil(line.length / 28)));
          const warning =
            /Hinweis|Konflikt|Grund/i.test(section.headers[column - 1]) && !!cell.value;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: warning ? 'FFFFE7B8' : rowIndex % 2 ? 'FFF0F5F3' : 'FFFFFFFF' },
          };
        });
        row.height = Math.max(row.height ?? 0, 30, Math.min(409, lines * 16 + 8));
      });
      if (!section.rows.length) addRow(['Keine Anmeldungen in diesem Bereich.']);
      if (!section.filter) sideRow = nextRow + 1;
      if (section.filter) {
        worksheet.autoFilter = {
          from: { row: header.number, column: 1 },
          to: { row: header.number + section.rows.length, column: section.headers.length },
        };
        worksheet.views = [{ state: 'frozen', ySplit: header.number, xSplit: 1 }];
        worksheet.pageSetup.printTitlesRow = `${header.number}:${header.number}`;
      }
      section.headers.forEach((label, index) => {
        const column = worksheet.getColumn(startColumn + index);
        const desired = /Disziplin|Hinweis|Konflikt|Grund|E-Mail/.test(label) ? 38 : 23;
        column.width = Math.max(column.width ?? 0, desired);
      });
    }
    worksheet.headerFooter.oddFooter = '&LTurnfest Biel 2027&RSeite &P von &N';
    return worksheet;
  }

  sheet(
    'Alle Anmeldungen',
    `${model.all.length} importierte Anmeldungen, davon ${model.registrations.length} ausgewählt. Ausgeschlossene sind nur auf diesem Blatt enthalten.`,
    [
      {
        title: 'Anmeldungen mit Auswahlstatus',
        filter: true,
        headers: [
          'Quellzeile',
          'Auswahlstatus',
          'Vorname',
          'Nachname',
          'Geburtsdatum',
          'E-Mail',
          'Einzelwettkampf',
          'Geräteturnen',
          'Einzeldisziplinen',
          'Vereinswettkampf',
          'Gemeldete Kategorie',
          'Zugeordnete Kategorie',
          'Vereinsdisziplinen',
          'Übernachtung',
          'Richterbereitschaft',
          'Brevet',
          'Prüfhinweise',
        ],
        rows: model.all.map(({ registration: item, selected, category: assigned }) => [
          item.rowNumber,
          selected ? 'Ausgewählt' : 'Ausgeschlossen',
          item.first,
          item.last,
          birthday(item),
          item.email,
          messages.answers[item.individual],
          missing(item.apparatus),
          missing(item.individualDisciplines.join('\n')),
          messages.answers[item.club],
          missing(item.category),
          category(assigned),
          missing(item.clubDisciplines.join('\n')),
          messages.answers[item.overnight],
          messages.answers[item.judge],
          missing(item.brevet),
          [
            hints(item),
            item.club === 'yes' && !assigned
              ? 'Kategorie nicht zugeordnet – nicht in den Vereinsblättern enthalten.'
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ]),
      },
    ],
  );
  sheet(
    'Einzelwettkampf',
    `${model.individual.length} ausgewählte Anmeldungen mit Teilnahme «Ja». Mehrfachstarts zählen in jeder Disziplin.`,
    [
      {
        title: 'Zusammenfassung',
        headers: ['Disziplin / Geräteturnen', 'Anmeldungen'],
        rows: model.individualGroups.map(([label, members]) => [label, members.length]),
      },
      {
        title: 'Anmeldungen',
        filter: true,
        headers: [
          'Quellzeile',
          'Vorname',
          'Nachname',
          'Geburtsdatum',
          'Geräteturnen',
          'Einzeldisziplinen',
          'Prüfhinweise',
        ],
        rows: model.individual.map((item) => [
          item.rowNumber,
          item.first,
          item.last,
          birthday(item),
          missing(item.apparatus),
          missing(item.individualDisciplines.join('\n')),
          hints(item),
        ]),
      },
    ],
  );
  for (const club of model.clubSheets) {
    addClubWorksheet(workbook, club, model, exportedAt, messages);
  }
  const judgeRow = (item: Registration): Value[] => [
    item.rowNumber,
    item.first,
    item.last,
    item.email,
    messages.answers[item.judge],
    missing(item.brevet),
    hints(item),
  ];
  const judgeHeaders = [
    'Quellzeile',
    'Vorname',
    'Nachname',
    'E-Mail',
    'Richterbereitschaft',
    'Brevet (Originalangabe)',
    'Prüfhinweise',
  ];
  sheet(
    'Richter',
    `${model.judges.length} ausgewählte Zusagen, ${model.unclearJudges.length} zu klären. Brevets sind nicht auf ihre Gültigkeit geprüft.`,
    [
      { title: 'Zu klären', headers: judgeHeaders, rows: model.unclearJudges.map(judgeRow) },
      {
        title: 'Richter mit Zusage',
        filter: true,
        headers: judgeHeaders,
        rows: model.judges.map(judgeRow),
      },
    ],
  );
  return workbook;
}
