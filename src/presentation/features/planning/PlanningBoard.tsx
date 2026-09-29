import { useLayoutEffect, useRef } from 'react';
import type { PlanningBoardModel } from '../../../application/session/selectors';
import { parts } from '../../../domain/planning/model';
import { categoryLabels, registrationName } from '../../messages/de-CH';
import { Badge } from '../../components/Primitives';
import styles from './planning.module.css';
export interface MoveDiscipline {
  (category: string, discipline: string, part: number): void;
}
export function PlanningBoard({
  board,
  onMove,
}: {
  board: PlanningBoardModel;
  onMove?: MoveDiscipline;
}) {
  const category = categoryLabels[board.category];
  const container = useRef<HTMLElement>(null);
  const movedName = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (movedName.current) {
      const controls =
        container.current?.querySelectorAll<HTMLSelectElement>('select[data-discipline]');
      const control = [...(controls ?? [])].find(
        (element) => element.dataset.discipline === movedName.current,
      );
      control?.focus();
      movedName.current = null;
    }
  }, [board.plan]);
  let method = 'Verteilungsvorschlag · Ein besseres Ergebnis kann möglich sein.';
  if (board.plan.manual) method = 'Manuell angepasst.';
  else if (board.plan.search.primaryOptimality === 'proven')
    method = 'Automatisch verteilt · Konfliktminimum erreicht.';
  return (
    <section
      ref={container}
      className={styles['category-plan']}
      aria-label={`Einteilung ${category}`}
    >
      <div className={styles['plan-heading']}>
        <div>
          <h2>{category}</h2>
          <p className="muted">
            {board.disciplines.length} Disziplinen · {board.participantCount} ausgewählte
            Anmeldungen
          </p>
        </div>
        <span role="status">
          <Badge tone={board.conflicts.length ? 'amber' : 'green'}>
            {board.conflictCount} Überschneidungen · {board.affectedCount} Personen betroffen
          </Badge>
        </span>
      </div>
      {!board.disciplines.length && (
        <p className="muted">Für diese Kategorie sind noch keine Vereinsdisziplinen vorhanden.</p>
      )}
      {board.disciplines.length > 0 && board.disciplines.length < 3 && (
        <p className="inline-warning">
          Weniger als drei Disziplinen vorhanden: Es bleiben Wettkampfteile leer.
        </p>
      )}
      <div className={styles['parts-board']}>
        {board.parts.map((part) => (
          <section
            className={styles['part-column']}
            key={part.part}
            aria-label={`${category} Teil ${part.part + 1}`}
          >
            <header>
              <span className={styles['part-number']}>0{part.part + 1}</span>
              <div>
                <h3>Teil {part.part + 1}</h3>
                <span>
                  {part.disciplines.length} Disziplinen · {part.participantCount} Anmeldungen
                </span>
              </div>
            </header>
            {part.disciplines.map((discipline) => (
              <article
                key={discipline.name}
                className={`${styles['discipline-card']} ${part.conflicts.some((conflict) => conflict.disciplines.includes(discipline.name)) ? styles['has-conflict'] : ''}`}
              >
                <h4>{discipline.name}</h4>
                <details>
                  <summary>{discipline.members.length} Anmeldungen ansehen</summary>
                  <ul>
                    {discipline.members.map((member) => (
                      <li key={member.id}>
                        {registrationName(member)}{' '}
                        <span className="muted">#{member.rowNumber}</span>
                        {part.conflicts.some((conflict) => conflict.member.id === member.id) && (
                          <span className={styles['conflict-label']}> Überschneidung</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
                {onMove && (
                  <label>
                    Verschieben nach
                    <select
                      data-discipline={discipline.name}
                      aria-label={`${discipline.name} · ${category} · Wettkampfteil`}
                      value={part.part}
                      onChange={(event) => {
                        movedName.current = discipline.name;
                        onMove(board.category, discipline.name, Number(event.target.value));
                      }}
                    >
                      {parts.map((value) => (
                        <option key={value} value={value}>
                          Teil {value + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </article>
            ))}
            {!part.disciplines.length && (
              <div className={styles['empty-part']}>
                Noch keine Disziplin.
                {onMove && (
                  <>
                    <br />
                    Du kannst eine Disziplin hierhin verschieben.
                  </>
                )}
              </div>
            )}
            {!!part.conflicts.length && (
              <div className={styles['part-conflicts']}>
                <strong>Mehrfach im selben Teil</strong>
                <ul>
                  {part.conflicts.map((conflict) => (
                    <li key={conflict.member.id}>
                      <strong>
                        {registrationName(conflict.member)} #{conflict.member.rowNumber}
                      </strong>
                      <br />
                      {conflict.disciplines.join(' + ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
      {onMove && (
        <p className={`muted small ${styles['plan-method']}`}>
          {method}{' '}
          {board.disciplines.length >= 3 &&
            board.parts.some((part) => !part.disciplines.length) &&
            'Achtung: Mindestens ein Wettkampfteil ist leer.'}
        </p>
      )}
    </section>
  );
}
