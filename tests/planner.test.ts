import { describe, expect, it } from 'vitest';
import { analyse, parseCsv, transferText } from './helpers';
import { initialConfig } from '../src/application/imports/prepare';
import type { Registration as Member } from '../src/domain/registration/model';
import { fixtureCsv as demoCsv } from './fixture';
import { categoryOf, disciplinesFor } from '../src/domain/planning/categories';
import { conflictCount, conflictsFor } from '../src/domain/planning/conflicts';
import { optimise } from '../src/domain/planning/optimise';
import { reconcilePlan } from '../src/application/planning/reconcile';
import type { CompetitionPart as Part } from '../src/domain/planning/model';

function member(id: number, disciplines: string[], category = 'Aktive (Alter offen)'): Member {
  const csv = parseCsv(demoCsv),
    config = initialConfig(csv);
  return {
    ...analyse(csv, config)[0],
    id: String(id),
    rowNumber: id,
    name: `Person ${id}`,
    category,
    clubDisciplines: disciplines,
    issues: [],
  };
}

describe('Three-part club competition', () => {
  it('separates categories by registration rather than age, including identical disciplines', () => {
    const people = [member(1, ['A', 'B']), member(2, ['A', 'B'], '35+ (Senioren)')];
    expect(categoryOf(people[0])).toBe('active');
    expect(categoryOf(people[1])).toBe('masters35');
    expect(disciplinesFor(people, 'active')[0].members.map((m) => m.id)).toEqual(['1']);
    expect(disciplinesFor(people, 'masters35')[0].members.map((m) => m.id)).toEqual(['2']);
    expect(categoryOf(member(3, ['A'], ''))).toBeNull();
    expect(categoryOf(member(3, ['A'], 'Senioren'), new Map([['Senioren', 'masters35']]))).toBe(
      'masters35',
    );
  });
  it('places a triangle in three different parts with no overlap', () => {
    const disciplines = disciplinesFor(
      [member(1, ['A', 'B']), member(2, ['B', 'C']), member(3, ['A', 'C'])],
      'active',
    );
    const plan = optimise(disciplines);
    expect(new Set(plan.assignments.values()).size).toBe(3);
    expect(conflictsFor(disciplines, plan.assignments)).toEqual([]);
    expect(plan.search.primaryOptimality).toBe('proven');
  });
  it('minimises unavoidable conflicts and exposes the affected person', () => {
    const disciplines = disciplinesFor([member(1, ['A', 'B', 'C', 'D'])], 'active');
    const plan = optimise(disciplines),
      conflicts = conflictsFor(disciplines, plan.assignments);
    expect(conflictCount(conflicts)).toBe(1);
    expect(conflicts[0].member.id).toBe('1');
    expect(conflicts[0].disciplines).toHaveLength(2);
    expect(plan.search.primaryOptimality).toBe('proven');
  });
  it('balances independent disciplines and gracefully handles empty and small categories', () => {
    expect(optimise([]).assignments.size).toBe(0);
    const two = disciplinesFor([member(1, ['A']), member(2, ['B'])], 'active');
    expect(new Set(optimise(two).assignments.values()).size).toBe(2);
    const six = disciplinesFor(
      Array.from({ length: 6 }, (_, i) => member(i, [String(i)])),
      'active',
    );
    const plan = optimise(six);
    expect(
      [0, 1, 2].map((p) => [...plan.assignments.values()].filter((v) => v === p).length),
    ).toEqual([2, 2, 2]);
  });
  it('manual moves expose conflicts and survive roster changes without moving other disciplines', () => {
    const people = [member(1, ['A', 'B', 'C']), member(2, ['A'])];
    const disciplines = disciplinesFor(people, 'active'),
      automatic = optimise(disciplines);
    const plan = { ...automatic, assignments: new Map(automatic.assignments), manual: true };
    plan.assignments.set('B', plan.assignments.get('A')!);
    expect(conflictCount(conflictsFor(disciplines, plan.assignments))).toBe(1);
    const reconciled = reconcilePlan(disciplinesFor(people.slice(0, 1), 'active'), plan);
    expect(reconciled.assignments).toEqual(plan.assignments);
    expect(reconciled.manual).toBe(true);
    const added = reconcilePlan(disciplinesFor([...people, member(3, ['D'])], 'active'), plan);
    expect(added.assignments.size).toBe(4);
    for (const [name, part] of plan.assignments) expect(added.assignments.get(name)).toBe(part);
  });
  it('does not include declined registrations and reports unplannable records in the export', () => {
    const people = [
      member(1, ['A']),
      { ...member(2, ['B']), club: 'no' as const },
      member(3, ['C'], ''),
    ];
    const disciplines = disciplinesFor(people, 'active');
    expect(disciplines.map((d) => d.name)).toEqual(['A']);
    const plan = { ...optimise(disciplines), assignments: new Map<string, Part>([['A', 2]]) };
    const text = transferText(
      people,
      new Map([
        ['active', plan],
        ['masters35', optimise([])],
      ]),
      true,
    );
    expect(text).toContain('Teil 3:\n  A (1): Person 1');
    expect(text).toContain('Unvollständig eingeplant: Person 3');
    expect(text).not.toContain('Person 2');
  });
  it('matches an independent exhaustive oracle on several weighted graphs', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const people: Member[] = [];
      for (let a = 0; a < 5; a++)
        for (let b = a + 1; b < 5; b++) {
          const weight = (seed * (a + 3) + b * 7) % 4;
          for (let w = 0; w < weight; w++) people.push(member(people.length, [`D${a}`, `D${b}`]));
        }
      const disciplines = disciplinesFor(people, 'active');
      let minimum = Infinity;
      for (let code = 0; code < 3 ** disciplines.length; code++) {
        const assignment = new Map(
          disciplines.map((d, i) => [d.name, (Math.floor(code / 3 ** i) % 3) as Part]),
        );
        const score = people.reduce(
          (sum, m) =>
            sum +
            (assignment.get(m.clubDisciplines[0]) === assignment.get(m.clubDisciplines[1]) ? 1 : 0),
          0,
        );
        minimum = Math.min(minimum, score);
      }
      const result = optimise(disciplines);
      expect(conflictCount(conflictsFor(disciplines, result.assignments))).toBe(minimum);
    }
  });
  it('uses a bounded deterministic proposal for larger graphs', () => {
    const disciplines = disciplinesFor(
      [
        member(
          1,
          Array.from({ length: 15 }, (_, i) => `D${i}`),
        ),
      ],
      'active',
    );
    const a = optimise(disciplines),
      b = optimise(disciplines);
    expect(a.assignments).toEqual(b.assignments);
    expect(a.assignments.size).toBe(15);
    expect(a.search.primaryOptimality).toBe('unproven');
    expect(conflictCount(conflictsFor(disciplines, a.assignments))).toBe(30);
  });
});
