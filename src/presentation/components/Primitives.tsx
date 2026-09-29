import type { ReactNode } from 'react';
import type { PlanningParticipant } from '../../domain/planning/model';
import { registrationName } from '../messages/de-CH';
export function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function PageTitle({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {actions}
    </div>
  );
}
export function NameList({
  members,
}: {
  members: readonly Pick<PlanningParticipant, 'id' | 'name' | 'rowNumber'>[];
}) {
  return (
    <ul className="name-list">
      {members.map((member) => (
        <li key={member.id}>
          {registrationName(member)} <span className="muted">· #{member.rowNumber}</span>
        </li>
      ))}
    </ul>
  );
}
export function GroupPanel({
  title,
  entries,
}: {
  title: string;
  entries: readonly [string, readonly PlanningParticipant[]][];
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span className="muted">Anmeldungen</span>
      </div>
      {entries.length ? (
        entries.map(([name, members]) => (
          <details className="group" key={name}>
            <summary>
              <span>{name || 'Noch offen'}</span>
              <span className="count">{members.length}</span>
            </summary>
            <NameList members={members} />
          </details>
        ))
      ) : (
        <p className="muted">Keine Angaben vorhanden.</p>
      )}
    </section>
  );
}
