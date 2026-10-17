import type { Registration } from '../registration/model';

export const cardTypes = ['A', 'B', 'C'] as const;
export type CardType = (typeof cardTypes)[number];
export type CardChoice = CardType | 'none' | 'pending';
export const cardPrices: Readonly<Record<CardType, number>> = { A: 98, B: 45, C: 48 };
export type CardReason =
  | 'competing-judge'
  | 'youth'
  | 'adult-club'
  | 'adult-egt'
  | 'no-competition'
  | 'participation-open'
  | 'judge-open'
  | 'age-review'
  | 'egt-review';
export type CardWarning =
  'birthday-review' | 'duplicate' | 'judge-needs-a' | 'club-needs-ab' | 'participant-without-card';

export function isCardChoice(value: string): value is CardChoice {
  return value === 'A' || value === 'B' || value === 'C' || value === 'none' || value === 'pending';
}

export function suggestCard(registration: Registration): {
  choice: CardChoice;
  reason: CardReason;
} {
  const competing = registration.club === 'yes' || registration.individual === 'yes';
  if (competing && registration.issues.some((issue) => issue.code === 'implausible-birthday'))
    return { choice: 'pending', reason: 'age-review' };
  if (competing && registration.judge === 'yes') return { choice: 'A', reason: 'competing-judge' };
  if (registration.club === 'open' || registration.individual === 'open')
    return { choice: 'pending', reason: 'participation-open' };
  if (!competing) return { choice: 'none', reason: 'no-competition' };
  if (registration.judge === 'open') return { choice: 'pending', reason: 'judge-open' };

  const birthYear = Number(
    /^\d{4}-/.test(registration.birth)
      ? registration.birth.slice(0, 4)
      : registration.birth.split('.')[2],
  );
  if (
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    registration.issues.some((issue) => issue.code === 'invalid-birthday')
  )
    return { choice: 'pending', reason: 'age-review' };
  if (birthYear >= 2010) return { choice: 'B', reason: 'youth' };
  if (registration.club === 'yes') return { choice: 'A', reason: 'adult-club' };
  if (registration.apparatus.trim() && !registration.individualDisciplines.length)
    return { choice: 'C', reason: 'adult-egt' };
  return { choice: 'pending', reason: 'egt-review' };
}

export function cardWarnings(registration: Registration, choice: CardChoice): CardWarning[] {
  const warnings: CardWarning[] = [];
  if (registration.issues.some((issue) => issue.code === 'implausible-birthday'))
    warnings.push('birthday-review');
  if (registration.issues.some((issue) => issue.code === 'possible-duplicate'))
    warnings.push('duplicate');
  const competing = registration.club === 'yes' || registration.individual === 'yes';
  if (choice !== 'pending') {
    if (competing && registration.judge === 'yes' && choice !== 'A') warnings.push('judge-needs-a');
    if (registration.club === 'yes' && choice === 'C') warnings.push('club-needs-ab');
    if (competing && choice === 'none') warnings.push('participant-without-card');
  }
  return warnings;
}

export function buildCardOrder(
  registrations: readonly Registration[],
  overrides: ReadonlyMap<string, CardChoice>,
) {
  const rows = registrations.map((registration) => {
    const suggestion = suggestCard(registration);
    const choice = overrides.get(registration.id) ?? suggestion.choice;
    return {
      registration,
      choice,
      suggestion,
      manual: overrides.has(registration.id),
      warnings: cardWarnings(registration, choice),
    };
  });
  const totals = cardTypes.map((type) => {
    const quantity = rows.filter((row) => row.choice === type).length;
    return { type, quantity, unitPrice: cardPrices[type], amount: quantity * cardPrices[type] };
  });
  return {
    rows,
    totals,
    quantity: totals.reduce((sum, total) => sum + total.quantity, 0),
    amount: totals.reduce((sum, total) => sum + total.amount, 0),
    pending: rows.filter((row) => row.choice === 'pending').length,
    withoutCard: rows.filter((row) => row.choice === 'none').length,
    review: rows.filter((row) => row.warnings.length > 0).length,
  };
}
