import {
  parts,
  type CompetitionPart,
  type CategoryPlan,
  type Discipline,
} from '../../domain/planning/model';
import { optimise } from '../../domain/planning/optimise';
import { conflictsFor, conflictCount } from '../../domain/planning/conflicts';
// A selection change updates rosters without moving existing disciplines.
export function reconcilePlan(
  disciplines: readonly Discipline[],
  previous?: CategoryPlan,
): CategoryPlan {
  if (!previous) return optimise(disciplines);
  const assignments = new Map<string, CompetitionPart>();
  for (const discipline of disciplines) {
    const previousPart = previous.assignments.get(discipline.name);
    if (previousPart !== undefined) assignments.set(discipline.name, previousPart);
  }
  for (const discipline of disciplines)
    if (!assignments.has(discipline.name)) {
      let bestPart: CompetitionPart = 0,
        bestCost = Infinity,
        bestSize = Infinity;
      for (const part of parts) {
        assignments.set(discipline.name, part);
        const cost = conflictCount(conflictsFor(disciplines, assignments));
        const size = [...assignments.values()].filter((p) => p === part).length;
        if (cost < bestCost || (cost === bestCost && size < bestSize)) {
          bestPart = part;
          bestCost = cost;
          bestSize = size;
        }
      }
      assignments.set(discipline.name, bestPart);
    }
  return {
    assignments,
    manual: previous.manual,
    search: {
      primaryOptimality: 'unproven',
      completion: 'edited',
      score: conflictCount(conflictsFor(disciplines, assignments)),
    },
  };
}
