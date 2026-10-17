import { useState } from 'react';
import { ExcelExportButton } from '../../components/ExcelExportButton';
import type { ReadySession } from '../../../application/session/model';
import {
  festivalCardOrder,
  filteredFestivalCardRows,
} from '../../../application/session/selectors';
import type { CardChoice, CardReason, CardWarning } from '../../../domain/festival-cards/order';
import { useServices } from '../../app/context';
import { PageTitle } from '../../components/Primitives';
import { answerLabels, registrationName } from '../../messages/de-CH';
import styles from './festival-cards.module.css';

const labels: Record<CardChoice, string> = {
  A: 'Typ A · Erwachsene',
  B: 'Typ B · Jugend',
  C: 'Typ C · nur EGT',
  none: 'Keine Festkarte',
  pending: 'Noch offen',
};
const reasons: Record<CardReason, string> = {
  'competing-judge': 'Mitturnende Richter benötigen Typ A.',
  youth: 'Jahrgang 2010 oder jünger; Typ B deckt Vereins- und EGT-Wettkampf ab.',
  'adult-club': 'Erwachsene im Vereinswettkampf; EGT ist mit abgedeckt.',
  'adult-egt': 'Nur EGT angegeben; Typ C, sofern keine Karte A/B anderweitig bestellt wird.',
  'no-competition': 'Keine Wettkampfteilnahme angegeben.',
  'participation-open': 'Wettkampfteilnahme noch klären.',
  'judge-open': 'Richtereinsatz noch klären.',
  'age-review':
    'Geburtstag fehlt, ist ungültig oder unplausibel; Jahrgang für die Festkarte klären.',
  'egt-review': 'Prüfen, ob ausschliesslich Einzelgeräteturnen (EGT) gemeint ist.',
};
const warnings: Record<CardWarning, string> = {
  'birthday-review': 'Geburtstag unplausibel: Alter unter 3 oder über 100 Jahre. Jahrgang prüfen.',
  duplicate: 'Mögliche Mehrfachanmeldung: vor der Bestellung vergleichen.',
  'judge-needs-a': 'Mitturnende Richter benötigen laut Vorschriften Typ A.',
  'club-needs-ab': 'Typ C deckt den Vereinswettkampf nicht ab.',
  'participant-without-card':
    'Wettkampfteilnahme angegeben, aber keine Karte zugeordnet. Anderweitige Bestellung prüfen.',
};
function money(amount: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
}

export function FestivalCardsView({ session }: { session: ReadySession }) {
  const { controller } = useServices();
  const order = festivalCardOrder(session);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const visibleRows = filteredFestivalCardRows(order, query, filter);
  const visibleIds = new Set(visibleRows.map((row) => row.registration.id));
  return (
    <>
      <PageTitle
        eyebrow="BIEL 2027 · FESTKARTEN"
        title="Festkarten bestellen"
        actions={
          <div className="actions">
            <ExcelExportButton />
            <button className="button" onClick={controller.print}>
              Bestellübersicht drucken
            </button>
          </div>
        }
      >
        Mengen und Kosten für A, B und C aus den ausgewählten Anmeldungen.
      </PageTitle>
      <section className={`panel ${styles.summary}`} aria-label="Bestellübersicht">
        <h2>Bestellübersicht</h2>
        <p className="muted">
          {session.filename} · {order.rows.length} ausgewählte Anmeldungen
        </p>
        <div className={styles.scroll}>
          <table>
            <thead>
              <tr>
                <th>Festkarte</th>
                <th>Anzahl</th>
                <th>Einzelpreis</th>
                <th>Betrag</th>
              </tr>
            </thead>
            <tbody>
              {order.totals.map((total) => (
                <tr key={total.type}>
                  <th scope="row">{labels[total.type]}</th>
                  <td>{total.quantity}</td>
                  <td>{money(total.unitPrice)}</td>
                  <td>{money(total.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total zugeordnet</th>
                <td>{order.quantity}</td>
                <td></td>
                <td>{money(order.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p aria-live="polite">
          <strong>{order.pending} noch offen</strong> · {order.withoutCard} ohne Festkarte ·{' '}
          {order.review} mit Prüfhinweisen
        </p>
        <p className="muted small">
          Grundpreise ohne Zuschläge, Übernachtungen oder zusätzliche Leistungen. Offene Zuordnungen
          sind im Total nicht enthalten. Dies ist eine Vorbereitung, keine ausgelöste Bestellung.
        </p>
      </section>
      {(order.pending > 0 || order.review > 0) && (
        <div className="callout warning">
          Vor der Bestellung offene Zuordnungen und Prüfhinweise bearbeiten. Mögliche
          Mehrfachanmeldungen zählen separat; nicht benötigte Datensätze unter «Anmeldungen»
          ausschliessen.
        </div>
      )}
      <section className={`panel ${styles.assignments}`} aria-label="Festkarten zuordnen">
        <h2>Zuordnung pro Anmeldung</h2>
        <p className="muted">
          Vorschläge prüfen und bei Bedarf ändern. «Keine Festkarte» kann auch eine bereits
          anderweitig bestellte Karte bedeuten. Richterangaben sind Einsatzbereitschaften;
          tatsächlichen Einsatz prüfen. Funktionärsrollen sind im Import nicht erfasst.
        </p>
        <div className={styles.filters}>
          <label className={styles.control}>
            Name oder Datensatz suchen
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label className={styles.control}>
            Festkarten filtern
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">Alle Zuordnungen</option>
              {(['A', 'B', 'C', 'pending', 'none'] as const).map((value) => (
                <option key={value} value={value}>
                  {labels[value]}
                </option>
              ))}
              <option value="review">Mit Prüfhinweisen</option>
              <option value="manual">Manuell zugeordnet</option>
            </select>
          </label>
          <button
            className="button"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            Filter zurücksetzen
          </button>
          <p aria-live="polite">
            {visibleRows.length} von {order.rows.length} Anmeldungen angezeigt. Bestellsummen, Excel
            und Druck enthalten weiterhin alle ausgewählten Anmeldungen.
          </p>
          {order.rows.length > 0 && !visibleRows.length && (
            <p>Keine Anmeldungen entsprechen diesem Filter.</p>
          )}
        </div>
        {!order.rows.length && (
          <p>
            Keine ausgewählten Anmeldungen. Wähle unter «Anmeldungen» die benötigten Datensätze aus.
          </p>
        )}
        {order.rows.map(({ registration, choice, suggestion, manual, warnings: rowWarnings }) => {
          const name = registrationName(registration);
          return (
            <article
              className={`${styles.row} ${visibleIds.has(registration.id) ? '' : styles.filtered}`}
              key={registration.id}
            >
              <div>
                <h3>
                  {name} <span className="muted">· #{registration.rowNumber}</span>
                </h3>
                <p className="small">
                  Geburtstag: {registration.birth || 'offen'} · Verein:{' '}
                  {answerLabels[registration.club]} · Einzel:{' '}
                  {answerLabels[registration.individual]} · Richter:{' '}
                  {answerLabels[registration.judge]}
                </p>
                <p className="muted small">
                  Vorschlag: {labels[suggestion.choice]} · {reasons[suggestion.reason]}
                </p>
                {rowWarnings.map((warning) => (
                  <p className={styles.warning} key={warning}>
                    {warnings[warning]}
                  </p>
                ))}
              </div>
              <div>
                <label className={styles.control}>
                  Festkarte für {name} · #{registration.rowNumber}
                  <select
                    value={manual ? choice : 'auto'}
                    onChange={(event) =>
                      controller.setCardChoice(registration.id, event.target.value)
                    }
                  >
                    <option value="auto">Vorschlag verwenden ({labels[suggestion.choice]})</option>
                    {(['A', 'B', 'C', 'none', 'pending'] as const).map((value) => (
                      <option key={value} value={value}>
                        {labels[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={styles.choice}>
                  {labels[choice]} · {manual ? 'manuell' : 'Vorschlag'}
                </p>
              </div>
            </article>
          );
        })}
      </section>
      <section className="panel">
        <h2>Grundlage und Termine</h2>
        <p>
          Wettkampfvorschriften STF Biel/Bienne 2027, Version 24. September 2026, Ziffern 8.5 (S.
          30), 2.4.1 (S. 8) und 1.7 (S. 7).
        </p>
        <ul>
          <li>
            A/B decken Vereins- und EGT-Wettkampf ab. Pro Anmeldung wird höchstens eine Karte
            gezählt.
          </li>
          <li>
            Typ B gilt für Jahrgang 2010 und jünger, auch bei ausschliesslicher EGT-Teilnahme.
            Fehlende, ungültige oder unplausible Geburtstage bleiben zur Prüfung offen. Mitturnende
            Richter erhalten bei plausiblem Geburtstag unabhängig vom Jahrgang Typ A.
          </li>
          <li>
            Mitturnende Richter und Funktionäre benötigen A; nichtturnende benötigen keine
            Festkarte.
          </li>
          <li>
            Summarische Bestellung: 15. November 2026. Nachlösen nach dem 28. Februar bis 15. April
            2027: CHF 10.– Aufpreis je Karte. Danach nur am Fest.
          </li>
          <li>
            Eine Mahlzeit mit alkoholfreiem Getränk, Turnpin (sofern bestellt) und eine An- und
            Abreise im Libero-Gebiet sind enthalten.
          </li>
        </ul>
        <p className="muted small">
          Zuordnungen bleiben nur in dieser Sitzung erhalten und sind im Excel-Export enthalten,
          jedoch nicht im CSV-Export. Eine Bearbeitung der Quelldaten setzt die manuelle Festkarte
          dieser Anmeldung zurück. Neuladen, neuer Import und erneute Spaltenzuordnung verwerfen die
          Zuordnungen.
        </p>
      </section>
    </>
  );
}
