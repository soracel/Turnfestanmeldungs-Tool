import Papa from 'papaparse';
import type { CsvTable } from '../../application/imports/model';

export function formatCsv(table: CsvTable): string {
  return '\uFEFF' + Papa.unparse([table.headers, ...table.rows], { quotes: true, newline: '\r\n' });
}
