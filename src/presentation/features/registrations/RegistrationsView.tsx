import { useState } from 'react';
import type { ReadySession } from '../../../application/session/model';
import {
  filteredRegistrations,
  type RegistrationFilter,
} from '../../../application/session/selectors';
import { useServices } from '../../app/context';
import { answerLabels, registrationName } from '../../messages/de-CH';
import { Badge, PageTitle } from '../../components/Primitives';
import { RegistrationDetails } from './RegistrationDetails';
const filters: [RegistrationFilter, string][] = [
  ['all', 'Alle Anmeldungen'],
  ['issues', 'Mit Hinweisen'],
  ['club', 'Vereinswettkampf'],
  ['individual', 'Einzelwettkampf'],
  ['excluded', 'Ausgeschlossen'],
];
export function RegistrationsView({ session }: { session: ReadySession }) {
  const { controller } = useServices();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RegistrationFilter>('all');
  const registrations = filteredRegistrations(session, query, filter);
  return (
    <>
      <PageTitle eyebrow="ANMELDUNGEN" title="Wer ist dabei?">
        Vergleiche Angaben und wähle aus, welche Datensätze in die Auswertung einfliessen.
      </PageTitle>
      <section className="panel">
        <div className="toolbar">
          <label className="search-label">
            Suche
            <input
              placeholder="Name, E-Mail oder Disziplin suchen …"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Filter
            <select
              value={filter}
              onChange={(event) => {
                const option = filters.find(([value]) => value === event.target.value);
                if (option) setFilter(option[0]);
              }}
            >
              {filters.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span className="muted">
            {registrations.length} von {session.registrations.length}
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  'Auswerten',
                  'Mitglied',
                  'Wettkampf',
                  'Kategorie & Disziplinen',
                  'Organisation',
                  'Prüfung',
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr
                  key={registration.id}
                  className={session.excluded.has(registration.id) ? 'excluded' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${registrationName(registration)} Datensatz ${registration.rowNumber} auswerten`}
                      checked={!session.excluded.has(registration.id)}
                      onChange={(event) =>
                        controller.selectRegistration(registration.id, event.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <strong>{registrationName(registration)}</strong>
                    <small>
                      #{registration.rowNumber} · {registration.birth || 'Geburtstag offen'}
                    </small>
                    <small>{registration.email || 'E-Mail offen'}</small>
                  </td>
                  <td>
                    <span className="nowrap">Verein: {answerLabels[registration.club]}</span>
                    <br />
                    <span className="nowrap">Einzel: {answerLabels[registration.individual]}</span>
                  </td>
                  <td>
                    {registration.category || '—'}
                    <small>
                      {registration.clubDisciplines.join(', ') || 'Keine Vereinsdisziplin'}
                    </small>
                    <small>
                      {[registration.apparatus, ...registration.individualDisciplines]
                        .filter(Boolean)
                        .join(', ')}
                    </small>
                  </td>
                  <td>
                    Übernachtung: {answerLabels[registration.overnight]}
                    <small>Kampfrichter: {answerLabels[registration.judge]}</small>
                    <small>{registration.brevet}</small>
                  </td>
                  <td>
                    <Badge tone={registration.issues.length ? 'amber' : 'green'}>
                      {registration.issues.length
                        ? `${registration.issues.length} Hinweise`
                        : 'Keine Hinweise'}
                    </Badge>
                    <RegistrationDetails registration={registration} table={session.table} />
                  </td>
                </tr>
              ))}
              {!registrations.length && (
                <tr>
                  <td colSpan={6}>Keine Anmeldungen für diese Suche.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
