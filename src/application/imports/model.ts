export interface CsvTable {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}
export const sourceFields = {
  first: 'Vorname',
  last: 'Nachname',
  birth: 'Geburtstag',
  email: 'E-Mail-Adresse',
  individual: 'Ich nehme am Einzelwettkampf teil',
  apparatus: 'Geräteturnen',
  club: 'Ich nehme am Vereinswettkampf teil',
  category: 'Kategorie',
  overnight: 'Ich übernachte am Turnfest:',
  judge: 'Ich stelle mich als Kampfrichter zur Verfügung:',
  brevet: 'Brevet (z.B. LA etc.):',
} as const;
export type ImportField = keyof typeof sourceFields;
export const importFields = Object.keys(sourceFields) as ImportField[];
export type DisciplineRole = 'unassigned' | 'club' | 'individual' | 'ignore';
export interface ImportConfig {
  readonly mapping: Readonly<Record<ImportField, number>>;
  readonly disciplines: Readonly<Record<number, DisciplineRole>>;
  readonly separator: string;
}
export type ImportIssue =
  | { readonly code: 'missing-column'; readonly field: ImportField }
  | { readonly code: 'duplicate-mapping' | 'unassigned-discipline' | 'invalid-column' };
export type ParseResult =
  | { readonly ok: true; readonly table: CsvTable }
  | {
      readonly ok: false;
      readonly code: 'malformed' | 'not-table' | 'empty' | 'row-width';
      readonly row?: number;
      readonly actual?: number;
      readonly expected?: number;
    };
