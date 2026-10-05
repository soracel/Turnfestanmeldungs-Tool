import type {
  ParticipationAnswer,
  RegistrationIssue,
  Registration,
} from '../../domain/registration/model';
import type { ImportField, ImportIssue, ParseResult } from '../../application/imports/model';
import type { SessionMessage } from '../../application/session/model';
export const categoryLabels = { active: 'Aktive', masters35: '35+' } as const;
export const answerLabels: Record<ParticipationAnswer, string> = {
  yes: 'Ja',
  no: 'Nein',
  open: 'Offen',
};
export const fieldLabels: Record<ImportField, string> = {
  first: 'Vorname',
  last: 'Nachname',
  birth: 'Geburtstag',
  email: 'E-Mail',
  individual: 'Einzelwettkampf',
  apparatus: 'Geräteturnen',
  club: 'Vereinswettkampf',
  category: 'Kategorie',
  overnight: 'Übernachtung',
  judge: 'Kampfrichter',
  brevet: 'Brevet',
};
export function registrationName(registration: Pick<Registration, 'name' | 'rowNumber'>): string {
  return registration.name || `Datensatz ${registration.rowNumber}`;
}
export function issueText(issue: RegistrationIssue): string {
  switch (issue.code) {
    case 'missing-name':
      return 'Vor- oder Nachname fehlt.';
    case 'invalid-birthday':
      return 'Geburtstag fehlt, liegt in der Zukunft oder ist ungültig.';
    case 'invalid-email':
      return 'E-Mail-Adresse fehlt oder ist ungültig.';
    case 'unknown-answer':
      return `${issue.field ? fieldLabels[issue.field] : 'Antwort'}: Antwort fehlt oder ist unbekannt.`;
    case 'missing-category':
      return 'Kategorie für den Vereinswettkampf fehlt.';
    case 'missing-club-discipline':
      return 'Keine Vereinsdisziplin zugeordnet.';
    case 'missing-individual-details':
      return 'Angaben zum Einzelwettkampf fehlen.';
    case 'club-without-consent':
      return 'Vereinsdisziplin trotz fehlender Zusage zum Vereinswettkampf.';
    case 'individual-without-consent':
      return 'Einzelangaben trotz fehlender Zusage zum Einzelwettkampf.';
    case 'missing-brevet':
      return 'Kampfrichtereinsatz: Brevet bitte klären.';
    case 'possible-duplicate':
      return 'Mögliche Mehrfachanmeldung: Name oder E-Mail kommt mehrfach vor. Datensätze vergleichen.';
  }
}
function mappingText(issue: ImportIssue) {
  switch (issue.code) {
    case 'missing-column':
      return `${fieldLabels[issue.field]}: Spalte fehlt.`;
    case 'duplicate-mapping':
      return 'Eine Spalte ist mehreren Feldern zugeordnet. Bitte Zuordnung korrigieren.';
    case 'unassigned-discipline':
      return 'Bitte die Bedeutung jeder Disziplin-Spalte festlegen oder sie ausdrücklich nicht auswerten.';
    case 'invalid-column':
      return 'Die zugeordnete Spalte ist ungültig.';
  }
}
export function parseErrorText(error: Extract<ParseResult, { ok: false }>): string {
  switch (error.code) {
    case 'malformed':
      return 'Die CSV-Datei ist fehlerhaft. Bitte erneut aus Google Sheets exportieren.';
    case 'not-table':
      return 'Keine gültige CSV-Tabelle mit mehreren Spalten gefunden.';
    case 'empty':
      return 'Die Datei enthält keine Anmeldungen.';
    case 'row-width':
      return `Datensatz ${error.row} hat ${error.actual} statt ${error.expected} Spalten.`;
  }
}
export function sessionMessage(message: SessionMessage): string {
  if (message.kind === 'parse') return parseErrorText(message.error);
  if (message.kind === 'mapping') return message.issues.map(mappingText).join(' ');
  const labels = {
    'registration-changed':
      'Anmeldung gespeichert. Hinweise und Planung aktualisiert; Übertragungsstatus zurückgesetzt.',
    downloaded:
      'CSV-Download gestartet. Die bereinigte Datei kann später wieder importiert werden.',
    'download-failed': 'Die CSV-Datei konnte nicht heruntergeladen werden.',

    'selection-changed':
      'Auswahl aktualisiert. Bestehende Disziplinzuordnungen bleiben erhalten; Übertragungsstatus zurückgesetzt.',
    'plan-changed': 'Einteilung aktualisiert. Übertragungsstatus zurückgesetzt.',
    'category-changed': 'Kategoriezuordnung aktualisiert. Übertragungsstatus zurückgesetzt.',
    copied: 'Liste kopiert. Du kannst sie jetzt einfügen.',
    'file-too-large':
      'Die Datei ist grösser als 10 MB. Bitte exportiere nur die benötigte Antworttabelle.',
    'read-failed': 'Die Datei konnte nicht gelesen werden.',
    'copy-failed':
      'Kopieren wurde vom Browser nicht erlaubt. Verwende die Druckansicht oder kopiere die Angaben direkt.',
    'print-failed': 'Die Druckansicht konnte nicht geöffnet werden.',
    'invalid-command': 'Diese Änderung ist nicht mehr gültig. Bitte prüfe die aktuelle Auswahl.',
  };
  return labels[message.code];
}
