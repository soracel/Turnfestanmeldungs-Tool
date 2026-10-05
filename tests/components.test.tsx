// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createSessionController } from '../src/application/session/controller';
import { exportModel } from '../src/application/session/selectors';
import { parseCsv } from '../src/infrastructure/csv/papa-parser';
import { AppProvider, useSession } from '../src/presentation/app/context';
import { RegistrationsView } from '../src/presentation/features/registrations/RegistrationsView';
import { PlanningBoard } from '../src/presentation/features/planning/PlanningBoard';
import { fixtureCsv } from './fixture';
import { referenceDate } from './helpers';
afterEach(cleanup);
async function mount(view: 'registrations' | 'planning') {
  const controller = createSessionController({
    parseCsv,
    today: () => referenceDate,
    writeClipboard: vi.fn(),
    print: vi.fn(),
    downloadCsv: vi.fn(),
    formatExport: () => '',
  });
  const demoInput = {
    name: 'fixture.csv',
    size: fixtureCsv.length,
    demo: true,
    read: async () => fixtureCsv,
  };
  await controller.importSource(demoInput);
  controller.confirmMapping();
  function Harness() {
    const { session } = useSession();
    if (session.stage !== 'ready') return null;
    return view === 'registrations' ? (
      <RegistrationsView session={session} />
    ) : (
      <PlanningBoard board={exportModel(session).boards[0]} onMove={controller.moveDiscipline} />
    );
  }
  render(
    <AppProvider services={{ controller, demoInput, fileInput: () => demoInput }}>
      <Harness />
    </AppProvider>,
  );
  return controller;
}
it('keeps search focus while filtering and exposes source records', async () => {
  await mount('registrations');
  const user = userEvent.setup();
  const input = screen.getByRole('textbox', { name: 'Suche' });
  await user.type(input, 'Noah');
  expect(document.activeElement).toBe(input);
  expect(screen.getByText('1 von 6')).toBeTruthy();
  expect(screen.getByText('Noah Beispiel')).toBeTruthy();
});
it('retains focus after moving a discipline between columns and exposes the updated value', async () => {
  const controller = await mount('planning');
  const user = userEvent.setup();
  const name = 'Fachtest Allround · Aktive · Wettkampfteil';
  await user.selectOptions(screen.getByRole('combobox', { name }), '2');
  const moved = screen.getByRole('combobox', { name }) as HTMLSelectElement;
  expect(moved.value).toBe('2');
  expect(document.activeElement).toBe(moved);
  const session = controller.getSnapshot().session;
  expect(session.stage === 'ready' && session.plans.get('active')?.manual).toBe(true);
});
