import Papa from 'papaparse';
import type { ParseResult } from '../../application/imports/model';
export function parseCsv(text: string): ParseResult {
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { skipEmptyLines: true });
  if (result.errors.some((error) => error.code !== 'UndetectableDelimiter'))
    return { ok: false, code: 'malformed' };
  const [headers, ...rows] = result.data;
  if (!headers || headers.length < 2) return { ok: false, code: 'not-table' };
  if (!rows.length) return { ok: false, code: 'empty' };
  const badRow = rows.findIndex((row) => row.length !== headers.length);
  if (badRow !== -1)
    return {
      ok: false,
      code: 'row-width',
      row: badRow + 1,
      actual: rows[badRow].length,
      expected: headers.length,
    };
  return { ok: true, table: { headers, rows } };
}
