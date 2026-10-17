import { isCardChoice } from '../../domain/festival-cards/order';
import {
  importFields,
  type CsvTable,
  type ImportConfig,
  type DisciplineRole,
} from '../imports/model';
import { analyse, mappingErrors } from '../imports/prepare';
import {
  categories,
  isCategory,
  isPart,
  type CompetitionPart,
  type CategoryPlan,
} from '../../domain/planning/model';
import type { ReadySession } from './model';
import { plannedDisciplines } from './selectors';
import { reconcilePlan } from '../planning/reconcile';

const marker = 'Turnfest-Planung';

export function snapshotTable(session: ReadySession): CsvTable {
  const rowNumbers = (ids: ReadonlySet<string>) =>
    session.registrations.filter((item) => ids.has(item.id)).map((item) => item.rowNumber);
  return {
    headers: [marker, 'Version', 'Daten'],
    rows: [
      [
        'session',
        '1',
        JSON.stringify({
          filename: session.filename,
          demo: session.demo,
          table: session.table,
          originalTable: session.originalTable,
          config: session.config,
          excluded: rowNumbers(session.excluded),
          transferred: rowNumbers(session.transferred),
          overrides: [...session.overrides],
          cardOverrides: session.registrations.flatMap((registration) => {
            const choice = session.cardOverrides.get(registration.id);
            return choice === undefined ? [] : [[String(registration.rowNumber), choice]];
          }),
          excludedDisciplines: [...session.excludedDisciplines].map(([category, names]) => [
            category,
            [...names],
          ]),
          plans: categories.map((category) => {
            const plan = session.plans.get(category);
            return [
              category,
              { assignments: [...(plan?.assignments ?? [])], manual: plan?.manual ?? false },
            ];
          }),
        }),
      ],
    ],
  };
}
function requireValue(condition: unknown): asserts condition {
  if (!condition) throw new Error('Invalid planning snapshot');
}
function object(value: unknown): Record<string, unknown> {
  requireValue(typeof value === 'object' && value !== null && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function strings(value: unknown): string[] {
  requireValue(Array.isArray(value) && value.every((item) => typeof item === 'string'));
  return value;
}
function table(value: unknown): CsvTable {
  const data = object(value);
  const headers = strings(data.headers);
  requireValue(headers.length >= 2 && Array.isArray(data.rows) && data.rows.length > 0);
  const rows = data.rows.map(strings);
  requireValue(rows.every((row) => row.length === headers.length));
  return { headers, rows };
}
function entries(value: unknown): [string, unknown][] {
  requireValue(Array.isArray(value));
  const result: [string, unknown][] = value.map((entry) => {
    requireValue(Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string');
    return [entry[0], entry[1]];
  });
  requireValue(new Set(result.map(([key]) => key)).size === result.length);
  return result;
}
function config(value: unknown, width: number): ImportConfig {
  const data = object(value);
  const rawMapping = object(data.mapping);
  const mapping = {} as Record<(typeof importFields)[number], number>;
  for (const field of importFields) {
    const column = rawMapping[field];
    requireValue(typeof column === 'number' && Number.isInteger(column));
    mapping[field] = column;
  }
  const disciplines: Record<number, DisciplineRole> = {};
  for (const [key, role] of Object.entries(object(data.disciplines))) {
    const column = Number(key);
    requireValue(Number.isInteger(column) && column >= 0 && column < width);
    requireValue(role === 'club' || role === 'individual' || role === 'ignore');
    disciplines[column] = role;
  }
  requireValue(typeof data.separator === 'string');
  const result = { mapping, disciplines, separator: data.separator };
  requireValue(mappingErrors(result, width).length === 0);
  return result;
}

// A recognised but invalid snapshot must never fall back to a normal registration import.
export function restoreSnapshot(
  source: CsvTable,
  importId: string,
  today: Date,
): ReadySession | null {
  if (source.headers[0] !== marker) return null;
  requireValue(source.headers.join('|') === [marker, 'Version', 'Daten'].join('|'));
  requireValue(
    source.rows.length === 1 && source.rows[0][0] === 'session' && source.rows[0][1] === '1',
  );
  const data = object(JSON.parse(source.rows[0][2]));
  const currentTable = table(data.table);
  const originalTable = table(data.originalTable);
  requireValue(JSON.stringify(currentTable.headers) === JSON.stringify(originalTable.headers));
  requireValue(currentTable.rows.length === originalTable.rows.length);
  const configuration = config(data.config, currentTable.headers.length);
  requireValue(typeof data.filename === 'string' && typeof data.demo === 'boolean');
  const registrations = analyse(currentTable, configuration, importId, today);
  const ids = (value: unknown) => {
    requireValue(Array.isArray(value));
    return new Set(
      value.map((row: unknown) => {
        requireValue(
          typeof row === 'number' &&
            Number.isInteger(row) &&
            row > 0 &&
            row <= registrations.length,
        );
        return registrations[row - 1].id;
      }),
    );
  };
  const overrides = new Map(
    entries(data.overrides).map(([key, category]) => {
      requireValue(typeof category === 'string' && isCategory(category));
      return [key, category] as const;
    }),
  );
  const excludedDisciplines = new Map(
    entries(data.excludedDisciplines).map(([category, names]) => {
      requireValue(isCategory(category));
      return [category, new Set(strings(names))] as const;
    }),
  );
  const plans = new Map(
    entries(data.plans).map(([category, value]) => {
      requireValue(isCategory(category));
      const plan = object(value);
      requireValue(typeof plan.manual === 'boolean');
      const assignments = new Map<string, CompetitionPart>(
        entries(plan.assignments).map(([name, part]) => {
          requireValue(typeof part === 'number' && isPart(part));
          return [name, part];
        }),
      );
      const restored: CategoryPlan = {
        assignments,
        manual: plan.manual,
        search: { primaryOptimality: 'unproven', completion: 'edited', score: 0 },
      };
      return [category, restored] as const;
    }),
  );
  requireValue(categories.every((category) => plans.has(category)));
  const cardOverrides = new Map(
    entries(data.cardOverrides ?? []).map(([row, choice]) => {
      const rowNumber = Number(row);
      requireValue(
        Number.isInteger(rowNumber) && rowNumber > 0 && rowNumber <= registrations.length,
      );
      requireValue(typeof choice === 'string' && isCardChoice(choice));
      return [registrations[rowNumber - 1].id, choice] as const;
    }),
  );
  const session: ReadySession = {
    stage: 'ready',
    importId,
    filename: data.filename,
    demo: data.demo,
    table: currentTable,
    originalTable,
    config: configuration,
    registrations,
    cardOverrides,
    excluded: ids(data.excluded),
    transferred: ids(data.transferred),
    overrides,
    excludedDisciplines,
    plans,
  };
  requireValue([...session.transferred].every((id) => !session.excluded.has(id)));
  for (const category of categories) {
    const disciplines = plannedDisciplines(session, category);
    const plan = plans.get(category);
    requireValue(
      plan &&
        plan.assignments.size === disciplines.length &&
        disciplines.every((item) => plan.assignments.has(item.name)),
    );
    plans.set(category, reconcilePlan(disciplines, plan));
  }
  return session;
}
