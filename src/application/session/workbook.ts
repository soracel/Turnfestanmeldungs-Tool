import { categoryOf } from '../../domain/planning/categories';
import { groupByLabels } from '../../domain/registration/grouping';
import type { ReadySession } from './model';
import { exportModel, festivalCardOrder } from './selectors';

export function workbookModel(session: ReadySession) {
  const current = exportModel(session);
  const individual = current.registrations.filter((item) => item.individual === 'yes');
  return {
    ...current,
    filename: session.filename,
    festivalCards: festivalCardOrder(session),
    clubSheets: current.boards.map((board) => ({
      board,
      registrations: current.registrations
        .filter(
          (item) => item.club === 'yes' && categoryOf(item, session.overrides) === board.category,
        )
        .sort(
          (a, b) =>
            a.last.localeCompare(b.last, 'de-CH') ||
            a.first.localeCompare(b.first, 'de-CH') ||
            a.rowNumber - b.rowNumber,
        ),
    })),
    all: session.registrations.map((registration) => ({
      registration,
      selected: !session.excluded.has(registration.id),
      category: categoryOf(registration, session.overrides),
    })),
    individual,
    individualGroups: groupByLabels(individual, (item) => [
      ...item.individualDisciplines,
      ...(item.apparatus ? [`Geräteturnen · ${item.apparatus}`] : []),
    ]),
    judges: current.registrations.filter((item) => item.judge === 'yes'),
    unclearJudges: current.registrations.filter(
      (item) => item.judge === 'open' || (item.judge === 'no' && !!item.brevet),
    ),
    unplannedDetails: current.unplanned.map((registration) => ({
      registration,
      category: categoryOf(registration, session.overrides),
    })),
  };
}
export type WorkbookModel = ReturnType<typeof workbookModel>;
