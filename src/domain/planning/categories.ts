import { groupByLabels } from '../registration/grouping';
import type {
  CategoryOverrides,
  CompetitionCategory,
  Discipline,
  PlanningParticipant,
} from './model';
export function categoryOf(
  registration: PlanningParticipant,
  overrides: CategoryOverrides = new Map(),
): CompetitionCategory | null {
  const override = overrides.get(registration.category);
  if (override) return override;
  const label = registration.category.trim();
  if (/^aktive(?:\s|\(|$)/i.test(label)) return 'active';
  if (/^35\s*\+(?:\s|\(|$)/.test(label)) return 'masters35';
  return null;
}
export function disciplinesFor(
  registrations: readonly PlanningParticipant[],
  category: CompetitionCategory,
  overrides: CategoryOverrides = new Map(),
): Discipline[] {
  // Project only scheduling data; raw answers and contact data stay outside the planner.
  const participants = registrations
    .filter(
      (registration) =>
        registration.club === 'yes' && categoryOf(registration, overrides) === category,
    )
    .map(({ id, rowNumber, name, club, category, clubDisciplines }) => ({
      id,
      rowNumber,
      name,
      club,
      category,
      clubDisciplines,
    }));
  return groupByLabels(participants, (registration) => registration.clubDisciplines).map(
    ([name, members]) => ({ name, members }),
  );
}
