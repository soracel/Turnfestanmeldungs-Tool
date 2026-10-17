import { describe, expect, it } from 'vitest';
import { buildCardOrder, cardWarnings, suggestCard } from '../src/domain/festival-cards/order';
import type { Registration } from '../src/domain/registration/model';
const adult: Registration = {
  id: 'one',
  rowNumber: 1,
  first: 'Ada',
  last: 'Beispiel',
  name: 'Ada Beispiel',
  birth: '1998-01-01',
  email: 'ada@example.com',
  individual: 'no',
  club: 'yes',
  category: 'Aktive',
  apparatus: '',
  overnight: 'no',
  judge: 'no',
  brevet: '',
  clubDisciplines: ['Sprint'],
  individualDisciplines: [],
  issues: [],
};
describe('Festival card order', () => {
  it('counts combined club and individual participation once and keeps separate registrations', () => {
    const combined = { ...adult, individual: 'yes' as const, apparatus: 'K5' };
    const order = buildCardOrder([combined, { ...combined, id: 'two' }], new Map());
    expect(order.quantity).toBe(2);
    expect(order.amount).toBe(196);
    expect(order.totals.map((total) => total.quantity)).toEqual([2, 0, 0]);
  });
  it('suggests C only for clear adult EGT-only participation', () => {
    const egt = { ...adult, club: 'no' as const, individual: 'yes' as const, apparatus: 'K6' };
    expect(suggestCard(egt).choice).toBe('C');
    expect(suggestCard({ ...egt, individualDisciplines: ['Unconfirmed event'] }).choice).toBe(
      'pending',
    );
    expect(suggestCard({ ...egt, club: 'open' }).choice).toBe('pending');
    expect(suggestCard({ ...egt, apparatus: '' }).choice).toBe('pending');
  });
  it('prioritises competing judges, while non-competing registrations need no card', () => {
    expect(suggestCard({ ...adult, birth: '2011-01-01', judge: 'yes' }).choice).toBe('A');
    expect(suggestCard({ ...adult, club: 'no', judge: 'yes' }).choice).toBe('none');
    expect(suggestCard({ ...adult, judge: 'open' }).choice).toBe('pending');
  });
  it('leaves missing and invalid birthdays for manual review', () => {
    for (const birth of ['', 'unknown']) {
      expect(suggestCard({ ...adult, birth }).choice).toBe('pending');
    }
    expect(suggestCard({ ...adult, birth: '12.04.1998' }).choice).toBe('A');
    expect(
      suggestCard({
        ...adult,
        issues: [{ code: 'invalid-birthday', registrationId: adult.id, severity: 'warning' }],
      }).choice,
    ).toBe('pending');
  });
  it('includes the 2010 boundary and younger cohorts in B for club and EGT participation', () => {
    for (const birth of ['2010-01-01', '2010-12-31', '2011-01-01', '31.12.2010']) {
      expect(suggestCard({ ...adult, birth }).choice).toBe('B');
      expect(
        suggestCard({ ...adult, birth, club: 'no', individual: 'yes', apparatus: 'K5' }).choice,
      ).toBe('B');
    }
    expect(suggestCard({ ...adult, birth: '2009-12-31' }).choice).toBe('A');
    expect(
      suggestCard({ ...adult, birth: '2009-12-31', club: 'no', individual: 'yes', apparatus: 'K5' })
        .choice,
    ).toBe('C');
    const youth = { ...adult, birth: '2010-01-01' };
    expect(buildCardOrder([youth], new Map()).amount).toBe(45);
    expect(buildCardOrder([youth], new Map([[youth.id, 'A']])).amount).toBe(98);
  });
  it('totals manual choices and separately reports pending and non-ordering rows', () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({ ...adult, id: String(index) }));
    const order = buildCardOrder(
      rows,
      new Map([
        ['0', 'A'],
        ['1', 'B'],
        ['2', 'C'],
        ['3', 'pending'],
        ['4', 'none'],
      ]),
    );
    expect(order.quantity).toBe(3);
    expect(order.amount).toBe(191);
    expect(order.pending).toBe(1);
    expect(order.withoutCard).toBe(1);
    expect(order.review).toBe(2);
    expect(buildCardOrder([], new Map()).amount).toBe(0);
  });
  it('retains duplicate and incompatible-choice warnings after overrides', () => {
    const judge = {
      ...adult,
      judge: 'yes' as const,
      issues: [
        {
          code: 'possible-duplicate' as const,
          registrationId: adult.id,
          severity: 'warning' as const,
        },
      ],
    };
    expect(cardWarnings(judge, 'C')).toEqual(['duplicate', 'judge-needs-a', 'club-needs-ab']);
  });
});

it('keeps implausible birthdays pending even for judges, and warns after manual assignment', () => {
  const registration: Registration = {
    ...adult,
    birth: '2026-01-01',
    judge: 'yes',
    issues: [{ code: 'implausible-birthday', severity: 'warning', registrationId: adult.id }],
  };
  const pending = buildCardOrder([registration], new Map());
  expect(pending.pending).toBe(1);
  expect(pending.amount).toBe(0);
  expect(pending.review).toBe(1);
  const manual = buildCardOrder([registration], new Map([[registration.id, 'A']]));
  expect(manual.amount).toBe(98);
  expect(manual.rows[0].warnings).toContain('birthday-review');
});
