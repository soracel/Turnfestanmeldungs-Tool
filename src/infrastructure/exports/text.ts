import type { ExportModel } from '../../application/session/selectors';
import type {
  Registration,
  RegistrationIssue,
  ParticipationAnswer,
} from '../../domain/registration/model';
import type { CompetitionCategory } from '../../domain/planning/model';
export interface ExportMessages {
  name(registration: Pick<Registration, 'name' | 'rowNumber'>): string;
  issue(issue: RegistrationIssue): string;
  readonly categories: Record<CompetitionCategory, string>;
  readonly answers: Record<ParticipationAnswer, string>;
}
export function formatExport(
  model: ExportModel,
  plansOnly: boolean,
  messages: ExportMessages,
): string {
  const lines = [
    '3-teiliger Vereinswettkampf',
    'Aktive und 35+ starten getrennt. Einteilung ohne Prüfung weiterer Wettkampfregeln.',
  ];
  for (const board of model.boards) {
    lines.push('', messages.categories[board.category]);
    for (const part of board.parts) {
      lines.push(`Teil ${part.part + 1}:`);
      if (!part.disciplines.length) lines.push('  Keine Disziplin zugeteilt.');
      for (const discipline of part.disciplines)
        lines.push(
          `  ${discipline.name} (${discipline.members.length}): ${discipline.members.map((member) => `${messages.name(member)} #${member.rowNumber}`).join(', ')}`,
        );
    }
    for (const conflict of board.conflicts)
      lines.push(
        `Konflikt in Teil ${conflict.part + 1}: ${messages.name(conflict.member)} #${conflict.member.rowNumber} – ${conflict.disciplines.join(', ')}`,
      );
  }
  if (model.unplanned.length)
    lines.push(
      '',
      `Unvollständig eingeplant: ${model.unplanned.map((registration) => `${messages.name(registration)} #${registration.rowNumber}`).join(', ')}`,
    );
  if (plansOnly) return lines.join('\n');
  const registrations = model.registrations;
  const count = (field: 'club' | 'individual' | 'overnight' | 'judge') =>
    registrations.filter((registration) => registration[field] === 'yes').length;
  lines.push(
    '',
    'Turnfest Biel 2027 · Vorbereitung für Contest',
    'Ungeprüfte Arbeitshilfe – keine Bestätigung durch das STV-System.',
    `${registrations.length} ausgewählte Anmeldungen`,
    `Vereinswettkampf: ${count('club')} | Einzelwettkampf: ${count('individual')}`,
    `Übernachtung: ${count('overnight')} | Kampfrichter: ${count('judge')}`,
    '',
  );
  for (const registration of registrations) {
    lines.push(
      `${messages.name(registration)} · ${registration.birth} · ${registration.email}`,
      `Verein: ${messages.answers[registration.club]} · ${registration.category || '–'} · ${registration.clubDisciplines.join(', ') || '–'}`,
      `Einzel: ${messages.answers[registration.individual]} · ${[registration.apparatus, ...registration.individualDisciplines].filter(Boolean).join(', ') || '–'}`,
      `Übernachtung: ${messages.answers[registration.overnight]} · Kampfrichter: ${messages.answers[registration.judge]} · Brevet: ${registration.brevet || '–'}`,
      ...(registration.issues.length
        ? [`Prüfen: ${registration.issues.map(messages.issue).join(' ')}`]
        : []),
      '',
    );
  }
  return lines.join('\n');
}
