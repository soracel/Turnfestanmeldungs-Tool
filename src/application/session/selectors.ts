import type { Registration } from '../../domain/registration/model';
import { categoryOf, disciplinesFor } from '../../domain/planning/categories';
import { conflictCount, conflictsFor } from '../../domain/planning/conflicts';
import {
  categories,
  parts,
  type CompetitionCategory,
  type Plans,
  type CategoryOverrides,
} from '../../domain/planning/model';
import { groupByLabels } from '../../domain/registration/grouping';
import type { ReadySession } from './model';
export function selectedRegistrations(session: ReadySession) {
  return session.registrations.filter((registration) => !session.excluded.has(registration.id));
}
export function planningBoard(
  registrations: readonly Registration[],
  category: CompetitionCategory,
  plans: Plans,
  overrides: CategoryOverrides,
) {
  const disciplines = disciplinesFor(registrations, category, overrides);
  const plan = plans.get(category);
  if (!plan) throw new Error('Ready session is missing a category plan');
  const conflicts = conflictsFor(disciplines, plan.assignments);
  return {
    category,
    plan,
    disciplines,
    conflicts,
    participantCount: new Set(
      disciplines.flatMap((discipline) => discipline.members.map((member) => member.id)),
    ).size,
    conflictCount: conflictCount(conflicts),
    affectedCount: new Set(conflicts.map((conflict) => conflict.member.id)).size,
    parts: parts.map((part) => {
      const assigned = disciplines.filter(
        (discipline) => plan.assignments.get(discipline.name) === part,
      );
      return {
        part,
        disciplines: assigned,
        participantCount: new Set(
          assigned.flatMap((discipline) => discipline.members.map((member) => member.id)),
        ).size,
        conflicts: conflicts.filter((conflict) => conflict.part === part),
      };
    }),
  };
}
export type PlanningBoardModel = ReturnType<typeof planningBoard>;
export function exportModel(session: ReadySession) {
  const registrations = selectedRegistrations(session);
  return {
    registrations,
    boards: categories.map((category) =>
      planningBoard(registrations, category, session.plans, session.overrides),
    ),
    unplanned: registrations.filter(
      (registration) =>
        registration.club === 'yes' &&
        (!categoryOf(registration, session.overrides) || !registration.clubDisciplines.length),
    ),
  };
}
export type ExportModel = ReturnType<typeof exportModel>;
export function overviewModel(session: ReadySession) {
  const selected = selectedRegistrations(session);
  const club = selected.filter((registration) => registration.club === 'yes');
  const individual = selected.filter((registration) => registration.individual === 'yes');
  return {
    selected,
    club,
    individual,
    issues: selected.filter((registration) => registration.issues.length),
    overnight: selected.filter((registration) => registration.overnight === 'yes'),
    judges: selected.filter((registration) => registration.judge === 'yes'),
    disciplines: groupByLabels(club, (registration) => registration.clubDisciplines),
    categories: groupByLabels(club, (registration) => [registration.category]),
    individualGroups: groupByLabels(individual, (registration) => [
      ...registration.individualDisciplines,
      ...(registration.apparatus ? [registration.apparatus] : []),
    ]),
  };
}
export type RegistrationFilter = 'all' | 'issues' | 'club' | 'individual' | 'excluded';
export function filteredRegistrations(
  session: ReadySession,
  query: string,
  filter: RegistrationFilter,
) {
  return session.registrations.filter((registration) => {
    const text = `${registration.name} ${registration.email} ${registration.category} ${registration.clubDisciplines.join(' ')}`;
    if (!text.toLowerCase().includes(query.toLowerCase())) return false;
    switch (filter) {
      case 'issues':
        return registration.issues.length > 0;
      case 'club':
        return registration.club === 'yes';
      case 'individual':
        return registration.individual === 'yes';
      case 'excluded':
        return session.excluded.has(registration.id);
      default:
        return true;
    }
  });
}
export function unknownCategories(session: ReadySession) {
  return [
    ...new Set(
      selectedRegistrations(session)
        .filter(
          (registration) =>
            registration.club === 'yes' && !categoryOf(registration, session.overrides),
        )
        .map((registration) => registration.category),
    ),
  ];
}
