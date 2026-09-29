import { describe, expect, it, vi } from 'vitest';
import { createSessionController } from '../src/application/session/controller';
import type { ReadySession } from '../src/application/session/model';
import { parseCsv } from '../src/infrastructure/csv/papa-parser';
import { fixtureCsv } from './fixture';
import { referenceDate } from './helpers';
function setup() {
  const writeClipboard = vi.fn(async (text: string) => {
    void text;
  });
  const controller = createSessionController({
    parseCsv,
    today: () => referenceDate,
    writeClipboard,
    print: vi.fn(),
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
  return { controller, ready, load, writeClipboard };
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
