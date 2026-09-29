import type { ReadySession } from '../../../application/session/model';
import { overviewModel } from '../../../application/session/selectors';
import type { Registration } from '../../../domain/registration/model';
import { PageTitle, NameList, GroupPanel } from '../../components/Primitives';
import { Icon } from '../../components/Icon';
import styles from '../planning/planning.module.css';
export function OverviewView({
  session,
  navigate,
}: {
  session: ReadySession;
  navigate: (view: 'contest' | 'review' | 'planner') => void;
}) {
  const model = overviewModel(session);
  const stats: [string, readonly Registration[], string][] = [
    ['Ausgewählt', model.selected, 'Anmeldungen für die Auswertung'],
    ['Vereinswettkampf', model.club, 'Zusage zur Teilnahme'],
    ['Einzelwettkampf', model.individual, 'Zusage zur Teilnahme'],
    ['Zu prüfen', model.issues, 'Anmeldungen mit Hinweisen'],
  ];
  return (
    <>
      <PageTitle
        eyebrow="DEIN VEREIN · DEIN TURNFEST"
        title="Alles im Blick."
        actions={
          <button className="button primary" onClick={() => navigate('contest')}>
            Contest vorbereiten →
          </button>
        }
      >
        Die Grundlage für eure Anmeldung in Biel 2027.
      </PageTitle>
      <div className="stats">
        {stats.map(([label, members, help], index) => (
          <details className={`stat ${index === 0 ? 'featured' : ''}`} key={label}>
            <summary>
              <span>{label}</span>
              <strong>{members.length.toLocaleString('de-CH')}</strong>
              <small>{help}</small>
            </summary>
            <NameList members={members} />
          </details>
        ))}
      </div>
      {!!model.issues.length && (
        <div className="callout warning">
          <div>
            <Icon name="review" />
            <span>
              <strong>{model.issues.length} Anmeldungen brauchen einen zweiten Blick.</strong>
              <br />
              Prüfe fehlende Angaben und mögliche Mehrfachanmeldungen.
            </span>
          </div>
          <button className="link" onClick={() => navigate('review')}>
            Hinweise ansehen →
          </button>
        </div>
      )}
      <p className="muted small">
        Gezählt werden ausgewählte Datensätze. Mögliche Mehrfachanmeldungen sind bis zu deiner
        Auswahl enthalten. Klicke auf eine Zahl oder Gruppe, um die Namen zu sehen.
      </p>
      <section className={`panel ${styles['planner-entry']}`}>
        <div>
          <h2>3-teiligen Vereinswettkampf planen</h2>
          <p className="muted">
            Separate Einteilungen für Aktive und 35+ · automatisch verteilen und manuell anpassen.
          </p>
        </div>
        <button className="button primary" onClick={() => navigate('planner')}>
          Disziplinen einteilen →
        </button>
      </section>
      <div className="two-col">
        <GroupPanel title="Vereinsdisziplinen" entries={model.disciplines} />
        <GroupPanel title="Kategorien im Verein" entries={model.categories} />
        <GroupPanel
          title="Einzelwettkampf"
          entries={model.individualGroups.map(([label, members]) => [
            members.some((member) => member.apparatus === label)
              ? `Geräteturnen · ${label}`
              : label,
            members,
          ])}
        />
        <GroupPanel
          title="Rund ums Turnfest"
          entries={[
            ['Übernachtung · Ja', model.overnight],
            ['Kampfrichter · Ja', model.judges],
          ]}
        />
      </div>
      <div className="note">
        <Icon name="shield" />
        <p>
          Deine Daten bleiben auf diesem Gerät. Beim Neuladen werden der Import und dein
          Bearbeitungsstand verworfen.
        </p>
      </div>
    </>
  );
}
