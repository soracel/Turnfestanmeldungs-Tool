import {
  parts,
  type CompetitionPart,
  type Discipline,
  type PlanningConflict,
  type PlanningParticipant,
} from './model';
export function conflictsFor(
  disciplines: readonly Discipline[],
  assignments: ReadonlyMap<string, CompetitionPart>,
): PlanningConflict[] {
  const conflicts: PlanningConflict[] = [];
  for (const part of parts) {
    const byMember = new Map<string, { member: PlanningParticipant; disciplines: string[] }>();
    for (const discipline of disciplines.filter((d) => assignments.get(d.name) === part)) {
      for (const member of discipline.members) {
        const entry = byMember.get(member.id) ?? { member, disciplines: [] };
        entry.disciplines.push(discipline.name);
        byMember.set(member.id, entry);
      }
    }
    for (const entry of byMember.values())
      if (entry.disciplines.length > 1) conflicts.push({ ...entry, part });
  }
  return conflicts;
}
export function conflictCount(conflicts: readonly PlanningConflict[]): number {
  return conflicts.reduce(
    (sum, c) => sum + (c.disciplines.length * (c.disciplines.length - 1)) / 2,
    0,
  );
}
