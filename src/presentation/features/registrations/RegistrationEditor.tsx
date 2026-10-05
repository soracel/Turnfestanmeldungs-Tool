import { useEffect, useId, useRef, useState } from 'react';
import type { Registration } from '../../../domain/registration/model';
import type { ReadySession } from '../../../application/session/model';
import { useServices } from '../../app/context';
import { registrationName } from '../../messages/de-CH';
import styles from './registration-editor.module.css';

function EditorDialog({
  registration,
  session,
  onClose,
}: {
  registration: Registration;
  session: ReadySession;
  onClose: () => void;
}) {
  const { controller } = useServices();
  const editorId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState([...session.table.rows[registration.rowNumber - 1]]);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function close() {
    dialog.current?.close();
    onClose();
  }
  const roles = {
    club: 'Vereinswettkampf',
    individual: 'Einzelwettkampf',
    ignore: 'Nicht ausgewertet',
    unassigned: 'Nicht zugeordnet',
  };
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={`${editorId}-title`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          controller.editRegistration(registration.id, values);
          close();
        }}
      >
        <h2 id={`${editorId}-title`}>Anmeldung bearbeiten · {registrationName(registration)}</h2>
        <p>
          Leere oder unbekannte Angaben bleiben erlaubt und werden weiterhin geprüft. Mehrere
          Disziplinen trennen bei:{' '}
          <strong>
            {session.config.separator === '\n'
              ? 'Zeilenumbruch'
              : session.config.separator || 'Nicht trennen'}
          </strong>
          .
        </p>
        <div className={styles.fields}>
          {session.table.headers.map((header, column) => {
            const role = session.config.disciplines[column];
            const original = session.originalTable.rows[registration.rowNumber - 1][column];
            return (
              <label key={column}>
                <span id={`${editorId}-${column}`}>
                  {column + 1}. {header}
                  {role ? ` · ${roles[role]}` : ''}
                </span>
                <textarea
                  aria-labelledby={`${editorId}-${column}`}
                  rows={2}
                  value={values[column]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setValues((previous) =>
                      previous.map((cell, index) => (index === column ? value : cell)),
                    );
                  }}
                />
                {original !== values[column] && <small>Beim Import: {original || 'Leer'}</small>}
              </label>
            );
          })}
        </div>
        <div className="actions">
          <button type="button" className="button secondary" onClick={close}>
            Abbrechen
          </button>
          <button type="submit" className="button primary">
            Änderungen speichern
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function RegistrationEditor({
  registration,
  session,
}: {
  registration: Registration;
  session: ReadySession;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <button
        className="button secondary"
        aria-label={`${registrationName(registration)} Datensatz ${registration.rowNumber} bearbeiten`}
        onClick={() => setEditing(true)}
      >
        Bearbeiten
      </button>
      {editing && (
        <EditorDialog
          registration={registration}
          session={session}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
