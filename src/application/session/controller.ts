import { analyse, initialConfig, mappingErrors } from '../imports/prepare';
import type { ImportConfig } from '../imports/model';
import type { ApplicationPorts, ImportInput } from '../ports/browser';
import { categories, isCategory, isPart } from '../../domain/planning/model';
import { disciplinesFor } from '../../domain/planning/categories';
import { optimise } from '../../domain/planning/optimise';
import { conflictsFor, conflictCount } from '../../domain/planning/conflicts';
import { reconcilePlan } from '../planning/reconcile';
import { exportModel, selectedRegistrations } from './selectors';
import type { ApplicationState, ReadySession, Session, SessionMessage } from './model';

export function createSessionController(ports: ApplicationPorts) {
  let state: ApplicationState = { session: { stage: 'empty' }, busy: false, message: null };
  let importRequest = 0;
  let revision = 0;
  const listeners = new Set<() => void>();
  function publish(next: ApplicationState) {
    state = next;
    revision++;
    listeners.forEach((listener) => listener());
  }
  function setSession(session: Session, message: SessionMessage | null = null) {
    publish({ session, message, busy: false });
  }
  function status(code: Extract<SessionMessage, { kind: 'status' }>['code']) {
    publish({ ...state, message: { kind: 'status', code } });
  }
  function updateReady(
    change: (session: ReadySession) => ReadySession,
    message?: Extract<SessionMessage, { kind: 'status' }>['code'],
  ) {
    if (state.session.stage !== 'ready') return;
    setSession(change(state.session), message ? { kind: 'status', code: message } : null);
  }
  function reconcile(session: ReadySession): ReadySession {
    const selected = selectedRegistrations(session);
    const plans = new Map(
      categories.map((category) => [
        category,
        reconcilePlan(
          disciplinesFor(selected, category, session.overrides),
          session.plans.get(category),
        ),
      ]),
    );
    return { ...session, plans, transferred: new Set() };
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async importSource(input: ImportInput) {
      const request = ++importRequest;
      if (input.size > 10 * 1024 * 1024) {
        publish({ ...state, busy: false, message: { kind: 'status', code: 'file-too-large' } });
        return;
      }
      publish({ ...state, busy: true, message: null });
      try {
        const text = await input.read();
        if (request !== importRequest) return;
        const result = ports.parseCsv(text);
        if (!result.ok) {
          publish({ ...state, busy: false, message: { kind: 'parse', error: result } });
          return;
        }
        const config = initialConfig(result.table);
        const demoConfig = input.demo
          ? {
              ...config,
              separator: ',',
              disciplines: Object.fromEntries(
                Object.keys(config.disciplines).map((column) => [column, 'club' as const]),
              ),
            }
          : config;
        setSession({
          stage: 'mapping',
          importId: String(request),
          filename: input.name,
          demo: input.demo ?? false,
          table: result.table,
          originalTable: result.table,
          config: demoConfig,
        });
      } catch {
        if (request === importRequest)
          publish({ ...state, busy: false, message: { kind: 'status', code: 'read-failed' } });
      }
    },
    configure(config: ImportConfig) {
      if (state.session.stage === 'mapping') setSession({ ...state.session, config });
    },
    confirmMapping() {
      const session = state.session;
      if (session.stage !== 'mapping') return;
      const issues = mappingErrors(session.config, session.table.headers.length);
      if (issues.length) {
        publish({ ...state, message: { kind: 'mapping', issues } });
        return;
      }
      const registrations = analyse(session.table, session.config, session.importId, ports.today());
      const plans = new Map(
        categories.map((category) => [category, optimise(disciplinesFor(registrations, category))]),
      );
      setSession({
        ...session,
        stage: 'ready',
        registrations,
        plans,
        excluded: new Set(),
        transferred: new Set(),
        overrides: new Map(),
      });
    },
    remap() {
      const session = state.session;
      if (session.stage !== 'ready') return;
      const { importId, filename, demo, table, originalTable, config } = session;
      setSession({ stage: 'mapping', importId, filename, demo, table, originalTable, config });
    },
    reset() {
      importRequest++;
      setSession({ stage: 'empty' });
    },
    selectRegistration(id: string, included: boolean) {
      if (
        state.session.stage !== 'ready' ||
        !state.session.registrations.some((registration) => registration.id === id)
      ) {
        status('invalid-command');
        return;
      }
      updateReady((session) => {
        const excluded = new Set(session.excluded);
        if (included) excluded.delete(id);
        else excluded.add(id);
        return reconcile({ ...session, excluded });
      }, 'selection-changed');
    },
    editRegistration(id: string, values: readonly string[]) {
      const session = state.session;
      if (session.stage !== 'ready') return;
      const registration = session.registrations.find((item) => item.id === id);
      if (!registration || values.length !== session.table.headers.length) {
        status('invalid-command');
        return;
      }
      const index = registration.rowNumber - 1;
      if (session.table.rows[index].every((value, column) => value === values[column])) return;
      const table = {
        ...session.table,
        rows: session.table.rows.map((row, rowIndex) => (rowIndex === index ? [...values] : row)),
      };
      const registrations = analyse(table, session.config, session.importId, ports.today());
      setSession(reconcile({ ...session, table, registrations }), {
        kind: 'status',
        code: 'registration-changed',
      });
    },
    downloadRegistrations() {
      const session = state.session;
      if (session.stage !== 'ready') return;
      const selected = selectedRegistrations(session);
      if (!selected.length) {
        status('invalid-command');
        return;
      }
      const rows = selected.map((registration) => {
        const row = [...session.table.rows[registration.rowNumber - 1]];
        const override = session.overrides.get(registration.category);
        if (override)
          row[session.config.mapping.category] = override === 'active' ? 'Aktive' : '35+';
        return row;
      });
      try {
        ports.downloadCsv({ headers: session.table.headers, rows }, 'anmeldungen-bereinigt.csv');
        status('downloaded');
      } catch {
        status('download-failed');
      }
    },
    moveDiscipline(category: string, discipline: string, part: number) {
      const session = state.session;
      if (session.stage !== 'ready' || !isCategory(category) || !isPart(part)) {
        status('invalid-command');
        return;
      }
      const previous = session.plans.get(category);
      if (!previous?.assignments.has(discipline)) {
        status('invalid-command');
        return;
      }
      const assignments = new Map(previous.assignments);
      assignments.set(discipline, part);
      const score = conflictCount(
        conflictsFor(
          disciplinesFor(selectedRegistrations(session), category, session.overrides),
          assignments,
        ),
      );
      const plans = new Map(session.plans);
      plans.set(category, {
        assignments,
        manual: true,
        search: { primaryOptimality: 'unproven', completion: 'edited', score },
      });
      setSession(
        { ...session, plans, transferred: new Set() },
        { kind: 'status', code: 'plan-changed' },
      );
    },
    optimiseCategory(category: string) {
      if (!isCategory(category)) {
        status('invalid-command');
        return;
      }
      updateReady((session) => {
        const plans = new Map(session.plans);
        plans.set(
          category,
          optimise(disciplinesFor(selectedRegistrations(session), category, session.overrides)),
        );
        return { ...session, plans, transferred: new Set() };
      }, 'plan-changed');
    },
    mapCategory(raw: string, category: string) {
      if (category && !isCategory(category)) {
        status('invalid-command');
        return;
      }
      updateReady((session) => {
        if (!session.registrations.some((registration) => registration.category === raw))
          return session;
        const overrides = new Map(session.overrides);
        if (isCategory(category)) overrides.set(raw, category);
        else overrides.delete(raw);
        return reconcile({ ...session, overrides });
      }, 'category-changed');
    },
    markTransferred(id: string, checked: boolean) {
      updateReady((session) => {
        if (!selectedRegistrations(session).some((registration) => registration.id === id))
          return session;
        const transferred = new Set(session.transferred);
        if (checked) transferred.add(id);
        else transferred.delete(id);
        return { ...session, transferred };
      });
    },
    async copy(plansOnly = false) {
      if (state.session.stage !== 'ready') return;
      const currentRevision = revision;
      try {
        await ports.writeClipboard(ports.formatExport(exportModel(state.session), plansOnly));
        if (revision === currentRevision) status('copied');
      } catch {
        if (revision === currentRevision) status('copy-failed');
      }
    },
    print() {
      try {
        ports.print();
      } catch {
        status('print-failed');
      }
    },
  };
}
export type SessionController = ReturnType<typeof createSessionController>;
