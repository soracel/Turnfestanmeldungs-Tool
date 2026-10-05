import { analyse as analyseRegistrations } from '../src/application/imports/prepare';
import type { CsvTable, ImportConfig } from '../src/application/imports/model';
import { parseCsv as parseResult } from '../src/infrastructure/csv/papa-parser';
import { validDate as validateDate } from '../src/domain/registration/validation';
import type { Registration } from '../src/domain/registration/model';
import { categories, type Plans } from '../src/domain/planning/model';
import { disciplinesFor } from '../src/domain/planning/categories';
import { optimise } from '../src/domain/planning/optimise';
import { exportModel } from '../src/application/session/selectors';
import { formatExport } from '../src/infrastructure/exports/text';
import {
  answerLabels,
  categoryLabels,
  issueText,
  registrationName,
} from '../src/presentation/messages/de-CH';
import { initialConfig } from '../src/application/imports/prepare';
export const referenceDate = new Date(2026, 8, 29);
export function parseCsv(text: string) {
  const result = parseResult(text);
  if (!result.ok) throw new Error(result.code);
  return { headers: [...result.table.headers], rows: result.table.rows.map((row) => [...row]) };
}
export const analyse = (table: CsvTable, config: ImportConfig) =>
  analyseRegistrations(table, config, 'test', referenceDate);
export const validDate = (value: string) => validateDate(value, referenceDate);
export function transferText(
  registrations: readonly Registration[],
  plans: Plans = new Map(
    categories.map((category) => [category, optimise(disciplinesFor(registrations, category))]),
  ),
  plansOnly = false,
) {
  const table = { headers: [], rows: [] };
  return formatExport(
    exportModel({
      stage: 'ready',
      importId: 'test',
      filename: 'fixture.csv',
      demo: true,
      table,
      originalTable: table,
      config: initialConfig(table),
      registrations,
      excluded: new Set(),
      transferred: new Set(),
      overrides: new Map(),
      plans,
    }),
    plansOnly,
    { name: registrationName, issue: issueText, categories: categoryLabels, answers: answerLabels },
  );
}
