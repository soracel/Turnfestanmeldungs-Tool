import type { CsvTable, ParseResult } from '../imports/model';
import type { ExportModel } from '../session/selectors';
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
  downloadCsv(table: CsvTable, filename: string): void;
  formatExport(model: ExportModel, plansOnly: boolean): string;
}
