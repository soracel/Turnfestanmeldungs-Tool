import { useState } from 'react';
import type { MappingSession } from '../../../application/session/model';
import { importFields, type DisciplineRole } from '../../../application/imports/model';
import { fieldLabels } from '../../messages/de-CH';
import { useServices } from '../../app/context';
import { PageTitle } from '../../components/Primitives';
function ColumnOptions({ headers }: { headers: readonly string[] }) {
  return (
    <>
      <option value={-1}>Spalte fehlt</option>
      {headers.map((header, index) => (
        <option key={index} value={index}>
          {index + 1}. {header}
        </option>
      ))}
    </>
  );
}
export function MappingView({ session }: { session: MappingSession }) {
  const { controller } = useServices();
  const [extraColumn, setExtraColumn] = useState(-1);
  const { table, config } = session;
  const roles: [DisciplineRole, string][] = [
    ['unassigned', 'Bitte zuordnen'],
    ['club', 'Vereinswettkampf'],
    ['individual', 'Einzelwettkampf'],
    ['ignore', 'Nicht auswerten'],
  ];
  return (
    <>
      <PageTitle eyebrow="SCHRITT 1 · IMPORT PRÜFEN" title="Die richtigen Angaben zuordnen">
        {session.filename} · {table.rows.length} Anmeldungen · {table.headers.length} Spalten
      </PageTitle>
      {session.demo && (
        <div className="callout">
          Dies sind ausschliesslich künstliche Demodaten. Sie enthalten absichtlich offene Punkte
          und eine Mehrfachanmeldung.
        </div>
      )}
      <section className="panel">
        <h2>Spaltenzuordnung</h2>
        <p className="muted">
          Die Vorschläge basieren auf deinem Formular. Prüfe sie vor der Auswertung.
        </p>
        <div className="mapping-grid">
          {importFields.map((field) => (
            <label key={field}>
              {fieldLabels[field]}
              <select
                value={config.mapping[field]}
                onChange={(event) =>
                  controller.configure({
                    ...config,
                    mapping: { ...config.mapping, [field]: Number(event.target.value) },
                  })
                }
              >
                <ColumnOptions headers={table.headers} />
              </select>
            </label>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Disziplin-Spalten unterscheiden</h2>
        <p className="muted">
          Gleichnamige Spalten bleiben getrennt. Entscheide anhand der Werte, zu welchem Wettkampf
          sie gehören.
        </p>
        {Object.entries(config.disciplines).map(([column, role]) => (
          <div className="discipline-mapping" key={column}>
            <div>
              <strong>
                Spalte {Number(column) + 1} · {table.headers[Number(column)]}
              </strong>
              <p className="muted">
                Beispiele:{' '}
                {[...new Set(table.rows.map((row) => row[Number(column)]).filter(Boolean))]
                  .slice(0, 3)
                  .join(' / ') || 'Keine ausgefüllten Werte'}
              </p>
            </div>
            <label>
              Verwendung
              <select
                value={role}
                onChange={(event) => {
                  const selected = roles.find(([value]) => value === event.target.value);
                  if (selected)
                    controller.configure({
                      ...config,
                      disciplines: { ...config.disciplines, [column]: selected[0] },
                    });
                }}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <div className="inline-controls">
          <label>
            Weitere Disziplin-Spalte
            <select
              value={extraColumn}
              onChange={(event) => setExtraColumn(Number(event.target.value))}
            >
              <ColumnOptions headers={table.headers} />
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() => {
              if (extraColumn >= 0)
                controller.configure({
                  ...config,
                  disciplines: { ...config.disciplines, [extraColumn]: 'unassigned' },
                });
            }}
          >
            Spalte hinzufügen
          </button>
        </div>
        <label className="separator-label">
          Mehrfachauswahl trennen bei
          <select
            value={config.separator}
            onChange={(event) => controller.configure({ ...config, separator: event.target.value })}
          >
            {[
              ['', 'Nicht trennen (gesamter Zellwert)'],
              [',', 'Komma'],
              [';', 'Semikolon'],
              ['\n', 'Zeilenumbruch'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Wähle ein Trennzeichen nur, wenn es im Export einzelne Disziplinen trennt. Kommas
          innerhalb eines Disziplinnamens würden sonst ebenfalls getrennt.
        </p>
      </section>
      <section className="panel">
        <h2>Originaldaten · Vorschau</h2>
        <p className="muted">
          Die ersten {Math.min(table.rows.length, 5)} Anmeldungen, unverändert.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {table.headers.map((header, index) => (
                  <th key={index}>
                    {index + 1}. {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.slice(0, 5).map((row, index) => (
                <tr key={index}>
                  {row.map((value, column) => (
                    <td key={column}>{value || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="actions">
        <button className="button secondary" onClick={controller.reset}>
          Verwerfen
        </button>
        <button className="button primary" onClick={controller.confirmMapping}>
          Zuordnung bestätigen &amp; auswerten →
        </button>
      </div>
    </>
  );
}
