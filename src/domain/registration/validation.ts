import type {
  AnswerField,
  ParticipationAnswer,
  Registration,
  RegistrationInput,
  RegistrationIssue,
} from './model';

export function validDate(value: string, today: Date): boolean {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const local = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (!iso && !local) return false;
  const year = Number(iso ? iso[1] : local?.[3]);
  const month = Number(iso ? iso[2] : local?.[2]);
  const day = Number(iso ? iso[3] : local?.[1]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= today.getTime()
  );
}
export function participation(value: string): ParticipationAnswer {
  const answer = value.trim().toLowerCase();
  if (answer === 'ja') return 'yes';
  if (answer === 'nein') return 'no';
  return 'open';
}
export function normaliseRegistration(input: RegistrationInput, today: Date): Registration {
  const issues: RegistrationIssue[] = [];
  const add = (code: RegistrationIssue['code'], field?: AnswerField) =>
    issues.push({ code, field, registrationId: input.id, severity: 'warning' });
  const individual = participation(input.individual);
  const club = participation(input.club);
  const overnight = participation(input.overnight);
  const judge = participation(input.judge);
  if (!input.first || !input.last) add('missing-name');
  if (!validDate(input.birth, today)) add('invalid-birthday');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) add('invalid-email');
  const answers = { individual, club, overnight, judge };
  for (const field of ['individual', 'club', 'overnight', 'judge'] as const)
    if (answers[field] === 'open') add('unknown-answer', field);
  if (club === 'yes' && !input.category) add('missing-category');
  if (club === 'yes' && !input.clubDisciplines.length) add('missing-club-discipline');
  if (individual === 'yes' && !input.apparatus && !input.individualDisciplines.length)
    add('missing-individual-details');
  if (club !== 'yes' && input.clubDisciplines.length) add('club-without-consent');
  if (individual !== 'yes' && (input.apparatus || input.individualDisciplines.length))
    add('individual-without-consent');
  if (judge === 'yes' && !input.brevet) add('missing-brevet');
  return {
    ...input,
    ...answers,
    name: [input.first, input.last].filter(Boolean).join(' '),
    issues,
  };
}
export function flagPossibleDuplicates(registrations: readonly Registration[]): Registration[] {
  const emails = new Map<string, number>();
  const names = new Map<string, number>();
  const nameKey = (registration: Registration) =>
    registration.first && registration.last ? registration.name.toLocaleLowerCase('de-CH') : '';
  for (const registration of registrations) {
    for (const [map, key] of [
      [emails, registration.email.toLowerCase()],
      [names, nameKey(registration)],
    ] as const) {
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return registrations.map((registration) => {
    const duplicate =
      (emails.get(registration.email.toLowerCase()) ?? 0) > 1 ||
      (names.get(nameKey(registration)) ?? 0) > 1;
    if (!duplicate) return registration;
    return {
      ...registration,
      issues: [
        ...registration.issues,
        { code: 'possible-duplicate', registrationId: registration.id, severity: 'warning' },
      ],
    };
  });
}
