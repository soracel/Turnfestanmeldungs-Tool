import type { Registration } from '../registration/model';
export const categories = ['active', 'masters35'] as const;
export type CompetitionCategory = (typeof categories)[number];
export const parts = [0, 1, 2] as const;
export type CompetitionPart = (typeof parts)[number];
export type PlanningParticipant = Pick<
  Registration,
  'id' | 'rowNumber' | 'name' | 'category' | 'club' | 'clubDisciplines'
>;
export interface Discipline {
  readonly name: string;
  readonly members: readonly PlanningParticipant[];
}
export interface SearchResult {
  readonly primaryOptimality: 'proven' | 'unproven';
  readonly completion: 'complete' | 'budget-exhausted' | 'heuristic' | 'edited';
  readonly score: number;
}
export interface CategoryPlan {
  readonly assignments: ReadonlyMap<string, CompetitionPart>;
  readonly search: SearchResult;
  readonly manual: boolean;
}
export interface PlanningConflict {
  readonly member: PlanningParticipant;
  readonly disciplines: readonly string[];
  readonly part: CompetitionPart;
}
export type CategoryOverrides = ReadonlyMap<string, CompetitionCategory>;
export type Plans = ReadonlyMap<CompetitionCategory, CategoryPlan>;
export function isCategory(value: string): value is CompetitionCategory {
  return value === 'active' || value === 'masters35';
}
export function isPart(value: number): value is CompetitionPart {
  return value === 0 || value === 1 || value === 2;
}
