import type { CsvTable } from '../../application/imports/model';
import { formatCsv } from '../exports/csv';
import type { ImportInput } from '../../application/ports/browser';
export function fileInput(file: File): ImportInput {
  return { name: file.name, size: file.size, read: () => file.text() };
}
export const browserEffects = {
  downloadCsv: (table: CsvTable, filename: string) => {
    const blob = new Blob([formatCsv(table)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    try {
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  },
  today: () => new Date(),
  writeClipboard: (text: string) => navigator.clipboard.writeText(text),
  print: () => window.print(),
};
