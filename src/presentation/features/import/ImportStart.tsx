import { useServices, useSession } from '../../app/context';
import { Icon } from '../../components/Icon';
export function ImportStart() {
  const { controller, fileInput, demoInput } = useServices();
  const { busy } = useSession();
  return (
    <>
      <div className="intro">
        <span className="eyebrow">VOM FORMULAR ZUR FESTANMELDUNG</span>
        <h1>
          Alle Anmeldungen.
          <br />
          Ein klarer Überblick.
        </h1>
        <p>
          Werte die Wünsche deines Vereins aus und bereite
          <br className="desktop" /> die Anmeldung im STV Contest-Tool vor.
        </p>
      </div>
      <section className="import-card">
        <div className="import-mark">
          <Icon name="upload" />
        </div>
        <h2>Mit deinem CSV-Export starten</h2>
        <p>
          Exportiere die Antworten aus Google Sheets als CSV
          <br className="desktop" /> und wähle die Datei auf deinem Gerät aus.
        </p>
        <label className="button primary file-button" htmlFor="csv-file">
          <Icon name="upload" />
          CSV-Datei auswählen
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          className="file-input"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void controller.importSource(fileInput(file));
          }}
        />
        <span className="file-note">CSV · bis 10 MB · Verarbeitung auf deinem Gerät</span>
        <div className="demo-link">
          Erst einmal umsehen?{' '}
          <button
            className="link"
            disabled={busy}
            onClick={() => void controller.importSource(demoInput)}
          >
            Demodaten ausprobieren ↗
          </button>
        </div>
      </section>
      <div className="steps">
        {[
          ['Importieren', 'CSV laden und die Spalten prüfen.'],
          ['Überblick gewinnen', 'Disziplinen, Kategorien und offene Punkte.'],
          ['Anmeldung vorbereiten', 'Angaben geordnet ins Contest übertragen.'],
        ].map(([title, description], index) => (
          <div key={title}>
            <span>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
