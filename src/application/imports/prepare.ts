import {
  flagPossibleDuplicates,
  normaliseRegistration,
} from '../../domain/registration/validation';
import {
  importFields,
  sourceFields,
  type CsvTable,
  type ImportConfig,
  type ImportIssue,
} from './model';
export function initialConfig(table: CsvTable): ImportConfig {
  const mapping = Object.fromEntries(
    importFields.map((field) => [
      field,
      table.headers.findIndex((header) => header.trim() === sourceFields[field]),
    ]),
  ) as Record<keyof typeof sourceFields, number>;
  return {
    mapping,
    disciplines: Object.fromEntries(
      table.headers.flatMap((header, index) =>
        /disziplin/i.test(header) ? [[index, 'unassigned']] : [],
      ),
    ),
    separator: '',
  };
}
export function mappingErrors(config: ImportConfig, columnCount: number): ImportIssue[] {
  const errors: ImportIssue[] = importFields
    .filter((field) => config.mapping[field] < 0)
    .map((field) => ({ code: 'missing-column', field }));
  const fields = Object.values(config.mapping).filter((index) => index >= 0);
  const disciplines = Object.entries(config.disciplines)
    .filter(([, role]) => role !== 'ignore')
    .map(([index]) => Number(index));
  const columns = [...fields, ...disciplines];
  if (columns.some((index) => !Number.isInteger(index) || index >= columnCount || index < 0))
    errors.push({ code: 'invalid-column' });
  if (new Set(columns).size !== columns.length) errors.push({ code: 'duplicate-mapping' });
  if (Object.values(config.disciplines).includes('unassigned'))
    errors.push({ code: 'unassigned-discipline' });
  return errors;
}
export function analyse(table: CsvTable, config: ImportConfig, importId: string, today: Date) {
  const registrations = table.rows.map((row, index) => {
    const values = Object.fromEntries(
      importFields.map((field) => [field, (row[config.mapping[field]] ?? '').trim()]),
    ) as Record<keyof typeof sourceFields, string>;
    const disciplines = (role: 'club' | 'individual') => [
      ...new Set(
        Object.entries(config.disciplines)
          .filter(([, mapped]) => mapped === role)
          .flatMap(([column]) => {
            const value = row[Number(column)] ?? '';
            return (config.separator ? value.split(config.separator) : [value])
              .map((label) => label.trim())
              .filter(Boolean);
          }),
      ),
    ];
    return normaliseRegistration(
      {
        ...values,
        id: `${importId}:${index + 1}`,
        rowNumber: index + 1,
        clubDisciplines: disciplines('club'),
        individualDisciplines: disciplines('individual'),
      },
      today,
    );
  });
  return flagPossibleDuplicates(registrations);
}
