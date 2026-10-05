import type { CsvTable, ImportConfig, ImportIssue, ParseResult } from '../imports/model';
import type { Registration, RegistrationId } from '../../domain/registration/model';
import type { CategoryOverrides, Plans } from '../../domain/planning/model';
export interface ImportedSource {
  readonly importId: string;
  readonly filename: string;
  readonly demo: boolean;
  readonly table: CsvTable;
  readonly originalTable: CsvTable;
  readonly config: ImportConfig;
}
export interface MappingSession extends ImportedSource {
  readonly stage: 'mapping';
}
export interface ReadySession extends ImportedSource {
  readonly stage: 'ready';
  readonly registrations: readonly Registration[];
  readonly excluded: ReadonlySet<RegistrationId>;
  readonly transferred: ReadonlySet<RegistrationId>;
  readonly overrides: CategoryOverrides;
  readonly plans: Plans;
}
export type Session = { readonly stage: 'empty' } | MappingSession | ReadySession;
export type SessionMessage =
  | { readonly kind: 'parse'; readonly error: Extract<ParseResult, { ok: false }> }
  | { readonly kind: 'mapping'; readonly issues: readonly ImportIssue[] }
  | {
      readonly kind: 'status';
      readonly code:
        | 'registration-changed'
        | 'downloaded'
        | 'download-failed'
        | 'selection-changed'
        | 'plan-changed'
        | 'category-changed'
        | 'copied'
        | 'file-too-large'
        | 'read-failed'
        | 'copy-failed'
        | 'print-failed'
        | 'invalid-command';
    };
export interface ApplicationState {
  readonly session: Session;
  readonly busy: boolean;
  readonly message: SessionMessage | null;
}
