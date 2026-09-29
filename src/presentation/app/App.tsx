import { useState, type ReactNode } from 'react';
import type { ReadySession } from '../../application/session/model';
import { useServices, useSession } from './context';
import { sessionMessage } from '../messages/de-CH';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Primitives';
import { ImportStart } from '../features/import/ImportStart';
import { MappingView } from '../features/import/MappingView';
import { OverviewView } from '../features/overview/OverviewView';
import { RegistrationsView } from '../features/registrations/RegistrationsView';
import { ReviewView } from '../features/registrations/ReviewView';
import { PlannerView } from '../features/planning/PlannerView';
import { ContestView } from '../features/contest/ContestView';
export type View = 'overview' | 'members' | 'review' | 'planner' | 'contest';
const navigation: [View, string][] = [
  ['overview', 'Übersicht'],
  ['members', 'Anmeldungen'],
  ['review', 'Daten prüfen'],
  ['planner', 'Vereinswettkampf'],
  ['contest', 'Contest vorbereiten'],
];
function Shell({
  view = 'overview',
  navigate,
  children,
}: {
  view?: View;
  navigate?: (view: View) => void;
  children: ReactNode;
}) {
  const { controller } = useServices();
  const { session, message, busy } = useSession();
  const affected =
    session.stage === 'ready'
      ? session.registrations.filter(
          (registration) => !session.excluded.has(registration.id) && registration.issues.length,
        ).length
      : 0;
  return (
    <>
      <a className="skip" href="#main">
        Zum Inhalt
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-symbol">
            t<span>.</span>
          </span>
          <div>
            turnfest<span>PLANER</span>
          </div>
        </div>
        <div className="event-label">DEIN TURNFEST</div>
        <div className="event">
          <span className="event-symbol">27</span>
          <div>
            <strong>Biel 2027</strong>
            <span>Gemeinsam an den Start.</span>
          </div>
        </div>
        <nav aria-label="Hauptnavigation">
          {navigation.map(([id, label]) => (
            <button
              key={id}
              disabled={!navigate}
              onClick={() => navigate?.(id)}
              className={`nav-item ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon name={id} />
              <span>{label}</span>
              {id === 'review' && affected > 0 && <span className="nav-count">{affected}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Icon name="shield" />
          <strong>Lokal. Privat. Übersichtlich.</strong>
          <p>
            Deine Mitgliederdaten bleiben
            <br />
            in deinem Browser.
          </p>
          <span className="version">OPEN-SOURCE-PROJEKT · V0.1</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            Vereinsorganisation <span className="slash">/</span> <strong>Biel 2027</strong>
          </span>
          <div>
            <Badge tone={session.stage !== 'empty' && session.demo ? 'amber' : 'green'}>
              {session.stage !== 'empty' && session.demo ? 'Demodaten' : 'Nur auf deinem Gerät'}
            </Badge>
            {(session.stage !== 'empty' || busy) && (
              <button className="link clear-button" onClick={controller.reset}>
                Daten verwerfen
              </button>
            )}
          </div>
        </header>
        <main id="main">
          <div id="messages" aria-live="polite">
            {busy && <div className="callout">Datei wird eingelesen …</div>}
            {message && (
              <div className="callout" role="status">
                {sessionMessage(message)}
              </div>
            )}
          </div>
          {session.stage === 'ready' && session.demo && (
            <div className="demo-banner">
              Demomodus · Alle Personen und Angaben sind frei erfunden.
            </div>
          )}
          {children}
        </main>
        <footer className="footer">
          <span>Mit Übersicht ans Turnfest.</span>
          <span>Unabhängiges Vereinsprojekt · Kein offizielles STV-Angebot</span>
        </footer>
      </div>
    </>
  );
}
function Workspace({ session }: { session: ReadySession }) {
  const { controller } = useServices();
  const [view, setView] = useState<View>('overview');
  function navigate(next: View) {
    setView(next);
    window.scrollTo(0, 0);
  }
  const views: Record<View, ReactNode> = {
    overview: <OverviewView session={session} navigate={navigate} />,
    members: <RegistrationsView session={session} />,
    review: <ReviewView session={session} />,
    planner: <PlannerView session={session} />,
    contest: <ContestView session={session} />,
  };
  return (
    <Shell view={view} navigate={navigate}>
      {views[view]}
      <footer className="data-footer">
        <span>
          {session.filename} · {session.registrations.length} Datensätze · {session.excluded.size}{' '}
          ausgeschlossen
        </span>
        <button className="link" onClick={controller.remap}>
          Zuordnung ändern
        </button>
      </footer>
    </Shell>
  );
}
export function App() {
  const { session } = useSession();
  if (session.stage === 'ready') return <Workspace key={session.importId} session={session} />;
  return (
    <Shell>
      {session.stage === 'mapping' ? (
        <MappingView key={session.importId} session={session} />
      ) : (
        <ImportStart />
      )}
    </Shell>
  );
}
