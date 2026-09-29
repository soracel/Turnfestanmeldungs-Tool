import { useState } from 'react';
import type { ReadySession } from '../../../application/session/model';
import { exportModel, unknownCategories } from '../../../application/session/selectors';
import { categories, type CompetitionCategory } from '../../../domain/planning/model';
import { useServices } from '../../app/context';
import { categoryLabels, registrationName } from '../../messages/de-CH';
import { PageTitle } from '../../components/Primitives';
import { PlanningBoard } from './PlanningBoard';
import styles from './planning.module.css';
function CategoryMapping({
  raw,
  value,
  onChange,
}: {
  raw: string;
  value: string;
  onChange: (raw: string, value: string) => void;
}) {
  return (
    <label>
      {raw || 'Kategorie fehlt'}
      <select value={value} onChange={(event) => onChange(raw, event.target.value)}>
        <option value="">Noch nicht zugeordnet</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {categoryLabels[category]}
          </option>
        ))}
      </select>
    </label>
  );
}
export function PlannerView({ session }: { session: ReadySession }) {
  const { controller } = useServices();
  const [category, setCategory] = useState<CompetitionCategory>('active');
  const model = exportModel(session);
  const unknown = unknownCategories(session);
  const missing = model.registrations.filter(
    (registration) => registration.club === 'yes' && !registration.clubDisciplines.length,
  );
  const board = model.boards.find((item) => item.category === category);
  return (
    <>
      <PageTitle
        eyebrow="3-TEILIGER VEREINSWETTKAMPF"
        title="Drei Teile. Dein Team im Blick."
        actions={
          <button className="button secondary" onClick={() => void controller.copy(true)}>
            Einteilungen kopieren
          </button>
        }
      >
        Disziplinen verteilen und Überschneidungen direkt erkennen.
      </PageTitle>
      <div className="callout">
        <strong>Aktive und 35+ starten getrennt.</strong>
        <p>
          Jede Kategorie hat ihre eigene Einteilung. Überschneidungen zwischen den Kategorien werden
          nicht als Konflikte gezählt.
        </p>
      </div>
      {!!unknown.length && (
        <section className="panel">
          <h2>Kategorien noch zuordnen</h2>
          <p className="muted">
            Diese Angaben werden noch nicht eingeplant. Ordne sie ausdrücklich einer Einteilung zu.
          </p>
          <div className="mapping-grid">
            {unknown.map((raw) => (
              <CategoryMapping key={raw} raw={raw} value="" onChange={controller.mapCategory} />
            ))}
          </div>
        </section>
      )}
      {!!session.overrides.size && (
        <details className="panel">
          <summary>Manuelle Kategoriezuordnung ändern</summary>
          <div className="mapping-grid">
            {[...session.overrides].map(([raw, value]) => (
              <CategoryMapping
                key={raw}
                raw={raw}
                value={value}
                onChange={controller.mapCategory}
              />
            ))}
          </div>
        </details>
      )}
      {!!missing.length && (
        <div className="callout warning">
          Ohne Vereinsdisziplin noch nicht eingeplant:{' '}
          {missing
            .map((registration) => `${registrationName(registration)} #${registration.rowNumber}`)
            .join(', ')}
          .
        </div>
      )}
      <div className={styles['planner-toolbar']}>
        <div className={styles['category-switch']} role="group" aria-label="Kategorie auswählen">
          {categories.map((value) => (
            <button
              key={value}
              aria-pressed={category === value}
              className={category === value ? styles.selected : ''}
              onClick={() => setCategory(value)}
            >
              {categoryLabels[value]}
            </button>
          ))}
        </div>
        <button className="button primary" onClick={() => controller.optimiseCategory(category)}>
          {categoryLabels[category]} automatisch verteilen
        </button>
      </div>
      <p className="muted small">
        Die automatische Verteilung ersetzt die aktuelle Einteilung dieser Kategorie. Manuell
        verschiebst du eine Disziplin über «Verschieben nach».
      </p>
      {board && <PlanningBoard board={board} onMove={controller.moveDiscipline} />}
      <details className={`panel ${styles['planner-explanation']}`}>
        <summary>Wie wird verteilt?</summary>
        <p>
          Die Verteilung minimiert gemeinsame Disziplinpaare pro Person innerhalb eines Teils. Zwei
          Disziplinen derselben Person im selben Teil ergeben eine Überschneidung, drei Disziplinen
          ergeben drei. Bei gleicher Konfliktzahl werden die Disziplinen möglichst gleichmässig auf
          drei Teile verteilt.
        </p>
        <p>
          Bis zwölf Disziplinen wird mit begrenztem Suchbudget nach einer optimalen Einteilung
          gesucht. Bei grösseren Aufgaben wird ein verbesserter Verteilungsvorschlag berechnet.
          Verbleibende Konflikte werden immer mit Namen angezeigt.
        </p>
        <p>
          Grundlage sind die ausgewählten Anmeldungen. Bitte mögliche Mehrfachanmeldungen zuerst
          prüfen. Mindestbestände, Zeitpläne und weitere Wettkampfregeln sind noch nicht
          berücksichtigt. Änderungen gelten nur für diese Sitzung.
        </p>
      </details>
    </>
  );
}
