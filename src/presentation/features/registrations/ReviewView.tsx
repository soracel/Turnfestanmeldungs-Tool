import type { ReadySession } from '../../../application/session/model';
import { useServices } from '../../app/context';
import { registrationName } from '../../messages/de-CH';
import { PageTitle } from '../../components/Primitives';
import { IssueList } from './RegistrationDetails';
export function ReviewView({ session }: { session: ReadySession }) {
  const { controller } = useServices();
  const affected = session.registrations.filter((registration) => registration.issues.length);
  return (
    <>
      <PageTitle eyebrow="DATENQUALITÄT" title="Offene Punkte klären.">
        Hinweise beziehen sich auf den Import. Wettkampfregeln sind noch nicht geprüft.
      </PageTitle>
      <div className="callout">
        Korrigiere Angaben in der Antworttabelle und importiere die CSV erneut. Mögliche
        Mehrfachanmeldungen kannst du hier einzeln aus der Auswertung ausschliessen.
      </div>
      {affected.map((registration) => (
        <section className="panel issue-card" key={registration.id}>
          <div>
            <h2>
              {registrationName(registration)}{' '}
              <span className="muted">#{registration.rowNumber}</span>
            </h2>
            <p className="muted">
              {registration.email} · {registration.birth}
            </p>
            <IssueList registration={registration} />
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={!session.excluded.has(registration.id)}
              onChange={(event) =>
                controller.selectRegistration(registration.id, event.target.checked)
              }
            />
            In Auswertung aufnehmen
          </label>
        </section>
      ))}
      {!affected.length && (
        <section className="panel">
          <h2>Keine Datenhinweise gefunden</h2>
          <p>
            Der Import enthält keine erkannten Datenprobleme. Die Wettkampfregeln und
            Contest-Pflichtfelder müssen weiterhin separat geprüft werden.
          </p>
        </section>
      )}
    </>
  );
}
