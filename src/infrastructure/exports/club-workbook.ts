import type ExcelJS from 'exceljs';
import type { CompetitionPart, Discipline } from '../../domain/planning/model';
import type { WorkbookModel } from '../../application/session/workbook';
import type { ExportMessages } from './text';

export function addClubWorksheet(
  workbook: ExcelJS.Workbook,
  club: WorkbookModel['clubSheets'][number],
  model: WorkbookModel,
  exportedAt: Date,
  messages: ExportMessages,
) {
  const { board, registrations } = club;
  const label = messages.categories[board.category];
  const blocks = board.parts.flatMap<{ part: CompetitionPart; discipline: Discipline | null }>(
    (part) =>
      part.disciplines.length
        ? part.disciplines.map((discipline) => ({ part: part.part, discipline }))
        : [{ part: part.part, discipline: null }],
  );
  const lastColumn = 1 + blocks.length * 2;
  const rosterHeight = Math.max(
    12,
    ...blocks.map(({ discipline }) => discipline?.members.length ?? 0),
  );
  const totalRow = 3 + rosterHeight;
  const responsibleRow = totalRow + 3;
  const sheet = workbook.addWorksheet(`Vereinswettkampf ${label}`, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2, showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '1:2',
    },
  });
  sheet.getColumn(1).width = 7;
  for (let column = 2; column <= lastColumn; column++) sheet.getColumn(column).width = 19;
  for (let row = 1; row <= responsibleRow + 1; row++) {
    sheet.getRow(row).height = 22;
    for (let column = 1; column <= lastColumn; column++) {
      const cell = sheet.getCell(row, column);
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        left: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        right: { style: 'hair', color: { argb: 'FFD0D0D0' } },
      };
    }
  }
  sheet.mergeCells(1, 1, totalRow - 1, 1);
  sheet.getCell('A1').value = 'Teilnehmer';
  sheet.getCell('A1').alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells(totalRow, 1, responsibleRow + 1, 1);
  sheet.getCell(totalRow, 1).value = 'Anzahl';
  sheet.getCell(totalRow, 1).alignment = {
    textRotation: 90,
    horizontal: 'center',
    vertical: 'middle',
  };
  for (const part of board.parts) {
    const first = 2 + blocks.findIndex((block) => block.part === part.part) * 2;
    const last = first + blocks.filter((block) => block.part === part.part).length * 2 - 1;
    sheet.mergeCells(1, first, 1, last);
    sheet.getCell(1, first).value = `Teil ${part.part + 1}`;
    sheet.getCell(1, first).alignment = { horizontal: 'center', vertical: 'middle' };
    for (let row = 1; row <= responsibleRow + 1; row++) {
      sheet.getCell(row, first).border = {
        ...sheet.getCell(row, first).border,
        left: { style: 'thin', color: { argb: 'FF000000' } },
      };
      sheet.getCell(row, last).border = {
        ...sheet.getCell(row, last).border,
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    }
  }
  blocks.forEach(({ part, discipline }, index) => {
    const column = 2 + index * 2;
    sheet.mergeCells(2, column, 2, column + 1);
    sheet.getCell(2, column).value = discipline?.name ?? 'Keine Disziplin';
    sheet.getCell(2, column).alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    const ids = new Set(discipline?.members.map((member) => member.id) ?? []);
    const members = registrations.filter((registration) => ids.has(registration.id));
    members.forEach((member, memberIndex) => {
      const row = memberIndex + 3;
      sheet.getCell(row, column).value = member.first;
      sheet.getCell(row, column + 1).value = member.last;
      const conflicts = board.conflicts.filter(
        (conflict) => conflict.member.id === member.id && conflict.part === part,
      );
      const note = [
        `Quellzeile ${member.rowNumber}`,
        ...member.issues.map(messages.issue),
        ...conflicts.map(
          (conflict) => `Konflikt Teil ${part + 1}: ${conflict.disciplines.join(', ')}`,
        ),
      ].join('\n');
      sheet.getCell(row, column).note = note;
      sheet.getCell(row, column + 1).note = note;
      for (const current of [column, column + 1]) {
        if (conflicts.length)
          sheet.getCell(row, current).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFDADA' },
          };
      }
      sheet.getRow(row).height = Math.max(
        sheet.getRow(row).height ?? 22,
        Math.ceil(Math.max(member.first.length, member.last.length) / 17) * 15 + 6,
      );
    });
    sheet.getCell(totalRow, column).value = 'Total';
    sheet.getCell(totalRow + 1, column).value = members.length;
    sheet.getCell(totalRow + 1, column).font = { name: 'Calibri', size: 11, bold: true };
    sheet.mergeCells(responsibleRow, column, responsibleRow, column + 1);
    sheet.getCell(responsibleRow, column).value = 'Verantwortlich';
    sheet.getCell(responsibleRow, column).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    sheet.mergeCells(responsibleRow + 1, column, responsibleRow + 1, column + 1);
  });
  sheet.getRow(2).height = Math.max(
    30,
    ...blocks.map(({ discipline }) => Math.ceil((discipline?.name.length ?? 0) / 34) * 15 + 6),
  );
  let nextRow = responsibleRow + 3;
  function note(text: string) {
    sheet.mergeCells(nextRow, 2, nextRow, lastColumn);
    const cell = sheet.getCell(nextRow, 2);
    cell.value = text;
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = { wrapText: true, vertical: 'middle' };
    sheet.getRow(nextRow).height = Math.max(
      20,
      Math.ceil(text.length / (blocks.length * 32)) * 15 + 6,
    );
    nextRow++;
  }
  note(
    `${label} · ${registrations.length} Anmeldungen · ${board.conflictCount} Konfliktpaare · ${board.affectedCount} betroffene Anmeldungen. Rot = Konflikt im gleichen Teil. Gelbes Feld = verantwortlich, manuell ausfüllen.`,
  );
  for (const item of registrations.filter((registration) => !registration.clubDisciplines.length))
    note(
      `${messages.name(item)} (#${item.rowNumber}): Disziplinen fehlen – noch nicht eingeplant.`,
    );
  const unmapped = model.unplannedDetails.filter((item) => !item.category).length;
  if (unmapped) note(`${unmapped} Anmeldungen ohne Kategorie: siehe «Alle Anmeldungen».`);
  note(
    'Zeiten und Tu/Ti sind nicht im Import enthalten. Quellzeilen und Prüfhinweise stehen in den Zellnotizen. Einteilung ohne Prüfung weiterer Wettkampfregeln.',
  );
  note(
    `Quelle: ${model.filename} · Export: ${exportedAt.toISOString()} · Änderungen in Excel werden nicht in den Planer übernommen.`,
  );
  sheet.pageSetup.printArea = `A1:${sheet.getColumn(lastColumn).letter}${nextRow - 1}`;
  sheet.headerFooter.oddHeader = `&C${label} – Vereinswettkampf`;
  sheet.headerFooter.oddFooter = '&LTurnfest Biel 2027&RSeite &P von &N';
}
