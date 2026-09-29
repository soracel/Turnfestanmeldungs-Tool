import type { ReadySession } from '../../../application/session/model';
import { exportModel } from '../../../application/session/selectors';
import { useServices } from '../../app/context';
import { answerLabels, issueText, registrationName } from '../../messages/de-CH';
import { PageTitle } from '../../components/Primitives';
import { PlanningBoard } from '../planning/PlanningBoard';
export function ContestView({ session }: { session: ReadySession }) {
  const { controller } = useServices();
  const model = exportModel(session);
  return (
    <>
      <PageTitle
        eyebrow="ÜBERTRAGUNGSHILFE"
        title="Bereit für den nächsten Schritt."
        actions={
          <div className="actions">
            <button
              className="button secondary"
              disabled={!model.registrations.length}
              onClick={() => void controller.copy()}
            >
              Liste kopieren
            </button>
            <button
              className="button primary"
              disabled={!model.registrations.length}
              onClick={controller.print}
            >
              Drucken
            </button>
          </div>
        }
      >
        {session.transferred.size} von {model.registrations.length} ausgewählten Anmeldungen als
        übertragen markiert.
      </PageTitle>
      <div className="callout warning">
        <strong>Vorläufige Arbeitshilfe</strong>
        <p>
          Die genauen Contest-Eingabefelder und Wettkampfregeln sind noch nicht abgeglichen. Prüfe
          offene Hinweise vor der Erfassung. Die Häkchen bestätigen nur deine manuelle Übertragung.
        </p>
      </div>
      <p className="muted small">
        Die Kopierliste enthält alle ausgewählten Anmeldungen. Häkchen werden nur für diese Sitzung
        gespeichert.
      </p>
      {model.boards.map((board) => (
        <PlanningBoard key={board.category} board={board} />
      ))}
      <div className="transfer-list">
        {model.registrations.map((registration) => (
          <section className="panel transfer-card" key={registration.id}>
            <div className="transfer-top">
              <h2>
                {registrationName(registration)}{' '}
                <span className="muted">#{registration.rowNumber}</span>
              </h2>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={session.transferred.has(registration.id)}
                  onChange={(event) =>
                    controller.markTransferred(registration.id, event.target.checked)
                  }
                />
                Übertragen
              </label>
            </div>
            <p className="muted">
              {registration.birth} · {registration.email}
            </p>
            <div className="transfer-grid">
              <div>
                <span>Vereinswettkampf · {answerLabels[registration.club]}</span>
                <strong>{registration.category || '—'}</strong>
                <p>{registration.clubDisciplines.join(', ') || 'Keine Disziplinangabe'}</p>
              </div>
              <div>
                <span>Einzelwettkampf · {answerLabels[registration.individual]}</span>
                <strong>
                  {[registration.apparatus, ...registration.individualDisciplines]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </strong>
              </div>
              <div>
                <span>Organisation</span>
                <p>
                  Übernachtung: {answerLabels[registration.overnight]}
                  <br />
                  Kampfrichter: {answerLabels[registration.judge]}
                  <br />
                  Brevet: {registration.brevet || '—'}
                </p>
              </div>
            </div>
            {!!registration.issues.length && (
              <div className="inline-warning">
                {registration.issues.map((issue, index) => (
                  <div key={index}>{issueText(issue)}</div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      {!model.registrations.length && (
        <section className="panel">Keine Anmeldungen ausgewählt.</section>
      )}
    </>
  );
}
