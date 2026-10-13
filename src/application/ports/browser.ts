import type { ParseResult } from '../imports/model';
import type { ExportModel } from '../session/selectors';
import type { WorkbookModel } from '../session/workbook';
export interface ImportInput {
  readonly name: string;
  readonly size: number;
  readonly demo?: boolean;
  read(): Promise<string>;
}
export interface ApplicationPorts {
  parseCsv(text: string): ParseResult;
  today(): Date;
  writeClipboard(text: string): Promise<void>;
  print(): void;
  downloadWorkbook(model: WorkbookModel, exportedAt: Date): Promise<void>;
  formatExport(model: ExportModel, plansOnly: boolean): string;
}
