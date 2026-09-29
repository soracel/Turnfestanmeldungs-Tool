import type { Registration } from '../../../domain/registration/model';
import type { CsvTable } from '../../../application/imports/model';
import { issueText } from '../../messages/de-CH';
export function IssueList({ registration }: { registration: Registration }) {
  return (
    <ul className="issue-list">
      {registration.issues.map((issue, index) => (
        <li key={`${issue.code}:${index}`}>{issueText(issue)}</li>
      ))}
    </ul>
  );
}
export function RegistrationDetails({
  registration,
  table,
}: {
  registration: Registration;
  table: CsvTable;
}) {
  const row = table.rows[registration.rowNumber - 1];
  return (
    <details className="raw">
      <summary>Original &amp; Hinweise</summary>
      {!!registration.issues.length && <IssueList registration={registration} />}
      <dl>
        {table.headers.map((header, column) => (
          <div key={column}>
            <dt>
              {column + 1}. {header}
            </dt>
            <dd>{row?.[column] || 'Leer'}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
