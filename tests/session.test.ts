import { describe, expect, it, vi } from 'vitest';
import { createSessionController } from '../src/application/session/controller';
import type { ReadySession } from '../src/application/session/model';
import { parseCsv } from '../src/infrastructure/csv/papa-parser';
import { formatCsv } from '../src/infrastructure/exports/csv';
import { fixtureCsv } from './fixture';
import { referenceDate } from './helpers';
function setup() {
  const writeClipboard = vi.fn(async (text: string) => {
    void text;
  });
  const downloadCsv = vi.fn();
  const controller = createSessionController({
    parseCsv,
    today: () => referenceDate,
    writeClipboard,
    print: vi.fn(),
    downloadCsv,
    formatExport: (model) => model.registrations.map((item) => item.id).join(','),
  });
  const ready = () => {
    const session = controller.getSnapshot().session;
    if (session.stage !== 'ready') throw new Error('Expected ready session');
    return session;
  };
  const load = async () => {
    await controller.importSource({
      name: 'fixture.csv',
      size: fixtureCsv.length,
      demo: true,
      read: async () => fixtureCsv,
    });
    controller.confirmMapping();
  };
  return { controller, ready, load, writeClipboard, downloadCsv };
}
describe('Session commands', () => {
  it('retains a valid session after failed imports and gives new imports new identities', async () => {
    const { controller, ready, load } = setup();
    await load();
    const before = ready();
    await controller.importSource({ name: 'bad.csv', size: 10, read: async () => 'A,B\n' });
    expect(ready()).toBe(before);
    expect(controller.getSnapshot().message?.kind).toBe('parse');
    await load();
    expect(ready().registrations[0].id).not.toBe(before.registrations[0].id);
  });
  it('ignores stale reads after reset and after a newer oversized import', async () => {
    const { controller } = setup();
    let resolve!: (text: string) => void;
    const input = {
      name: 'slow.csv',
      size: 10,
      read: () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    };
    const pending = controller.importSource(input);
    controller.reset();
    resolve(fixtureCsv);
    await pending;
    expect(controller.getSnapshot().session.stage).toBe('empty');
    const second = controller.importSource(input);
    await controller.importSource({ ...input, size: 11 * 1024 * 1024 });
    resolve(fixtureCsv);
    await second;
    expect(controller.getSnapshot().session.stage).toBe('empty');
    expect(controller.getSnapshot().busy).toBe(false);
  });
  it('isolates categories, preserves surviving manual moves, and invalidates transfer marks', async () => {
    const { controller, ready, load } = setup();
    await load();
    const before = ready();
    controller.markTransferred(before.registrations[0].id, true);
    controller.moveDiscipline('active', 'Fachtest Allround', 2);
    expect(ready().plans.get('masters35')).toBe(before.plans.get('masters35'));
    expect(ready().transferred.size).toBe(0);
    expect(before.plans.get('active')?.manual).toBe(false);
    controller.selectRegistration(before.registrations[4].id, false);
    expect(ready().plans.get('active')?.assignments.get('Fachtest Allround')).toBe(2);
    expect(before.excluded.size).toBe(0);
  });
  it('rejects invalid commands without changing allocations', async () => {
    const { controller, ready, load } = setup();
    await load();
    const plans = ready().plans;
    for (const [category, discipline, part] of [
      ['active', 'Fachtest Allround', 5],
      ['invalid', 'A', 0],
      ['active', 'missing', 0],
    ] as const)
      controller.moveDiscipline(category, discipline, part);
    controller.selectRegistration('missing', false);
    expect(ready().plans).toBe(plans);
    expect(ready().excluded.size).toBe(0);
  });
  it('exports selected records and reports clipboard failures without losing transfer marks', async () => {
    const { controller, ready, load, writeClipboard } = setup();
    await load();
    const [first, second] = ready().registrations;
    controller.selectRegistration(first.id, false);
    controller.markTransferred(second.id, true);
    await controller.copy();
    expect(writeClipboard.mock.calls[0][0].split(',')).not.toContain(first.id);
    writeClipboard.mockRejectedValueOnce(new Error('Denied'));
    await controller.copy();
    expect(controller.getSnapshot().message).toEqual({ kind: 'status', code: 'copy-failed' });
    expect(ready().transferred.has(second.id)).toBe(true);
  });
  it('remapping clears derived state while retaining original input', async () => {
    const { controller, ready, load } = setup();
    await load();
    const before: ReadySession = ready();
    controller.remap();
    expect(controller.getSnapshot().session).toMatchObject({
      stage: 'mapping',
      table: before.table,
    });
    controller.confirmMapping();
    expect(ready().excluded.size).toBe(0);
    expect(ready().overrides.size).toBe(0);
  });
});

it('revalidates edits across records, retains identity and exclusions, and reconciles manual plans', async () => {
  const { controller, ready, load } = setup();
  await load();
  const before = ready();
  const duplicate = before.registrations[4];
  controller.selectRegistration(duplicate.id, false);
  controller.moveDiscipline('active', 'Fachtest Allround', 2);
  controller.markTransferred(before.registrations[0].id, true);
  const values = [...before.table.rows[4]];
  values[1] = 'Anna';
  values[4] = 'anna@example.com';
  values[9] = 'Weitsprung';
  controller.editRegistration(duplicate.id, values);
  expect(ready().registrations[4]).toMatchObject({ id: duplicate.id, first: 'Anna' });
  expect(ready().registrations[0].issues.some((issue) => issue.code === 'possible-duplicate')).toBe(
    false,
  );
  expect(ready().excluded.has(duplicate.id)).toBe(true);
  expect(ready().transferred.size).toBe(0);
  expect(ready().plans.get('active')?.assignments.get('Fachtest Allround')).toBe(2);
  expect(ready().plans.get('active')?.assignments.has('Weitsprung')).toBe(false);
  expect(ready().originalTable.rows[4][1]).toBe('Mia');
  expect(before.table.rows[4][1]).toBe('Mia');
  values[1] = 'Mutated caller';
  expect(ready().table.rows[4][1]).toBe('Anna');
  controller.selectRegistration(duplicate.id, true);
  expect(ready().plans.get('active')?.assignments.has('Weitsprung')).toBe(true);
});
it('round-trips corrected selected rows, duplicate headers, empty cells and category overrides', async () => {
  const { controller, ready, load, downloadCsv } = setup();
  await load();
  const before = ready();
  const values = [...before.table.rows[0]];
  values[1] = 'Mia, "Test"';
  values[13] = 'LA\nWeitere Angabe';
  controller.editRegistration(before.registrations[0].id, values);
  controller.selectRegistration(before.registrations[4].id, false);
  controller.mapCategory('Aktive (Alter offen)', 'masters35');
  controller.downloadRegistrations();
  const [table, filename] = downloadCsv.mock.calls[0];
  expect(filename).toBe('anmeldungen-bereinigt.csv');
  expect(table.headers).toEqual(before.table.headers);
  expect(table.rows).toHaveLength(5);
  const csv = formatCsv(table);
  expect(parseCsv(csv)).toEqual({ ok: true, table });
  await controller.importSource({
    name: filename,
    size: csv.length,
    demo: true,
    read: async () => csv,
  });
  controller.confirmMapping();
  expect(ready().registrations).toHaveLength(5);
  expect(ready().registrations[0]).toMatchObject({
    first: 'Mia, "Test"',
    brevet: 'LA\nWeitere Angabe',
    category: '35+',
  });
  expect(ready().registrations[0].clubDisciplines).toEqual(before.registrations[0].clubDisciplines);
});
it('rejects invalid edits and empty exports and reports failed downloads without changing data', async () => {
  const { controller, ready, load, downloadCsv } = setup();
  await load();
  const before = ready();
  controller.editRegistration('missing', before.table.rows[0]);
  controller.editRegistration(before.registrations[0].id, ['short']);
  expect(ready()).toBe(before);
  downloadCsv.mockImplementationOnce(() => {
    throw new Error('Failed');
  });
  controller.downloadRegistrations();
  expect(controller.getSnapshot().message).toEqual({ kind: 'status', code: 'download-failed' });
  expect(ready()).toBe(before);
  for (const registration of before.registrations)
    controller.selectRegistration(registration.id, false);
  controller.downloadRegistrations();
  expect(downloadCsv).toHaveBeenCalledTimes(1);
});

it('preserves a corrected record with all cells cleared through CSV serialization', async () => {
  const { controller, ready, load, downloadCsv } = setup();
  await load();
  controller.editRegistration(
    ready().registrations[0].id,
    ready().table.headers.map(() => ''),
  );
  controller.downloadRegistrations();
  const [table] = downloadCsv.mock.calls[0];
  expect(parseCsv(formatCsv(table))).toEqual({ ok: true, table });
});
