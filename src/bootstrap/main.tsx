import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createSessionController } from '../application/session/controller';
import { parseCsv } from '../infrastructure/csv/papa-parser';
import { browserEffects, fileInput, downloadExcel } from '../infrastructure/browser/adapters';
import { formatExport } from '../infrastructure/exports/text';
import { App } from '../presentation/app/App';
import { AppProvider } from '../presentation/app/context';
import {
  categoryLabels,
  answerLabels,
  issueText,
  registrationName,
} from '../presentation/messages/de-CH';
import { demoCsv } from '../demo/registrations';
import '../presentation/styles/base.css';
const controller = createSessionController({
  ...browserEffects,
  parseCsv,
  downloadWorkbook: async (model, exportedAt) => {
    const { createWorkbook } = await import('../infrastructure/exports/workbook');
    const workbook = createWorkbook(model, exportedAt, {
      categories: categoryLabels,
      answers: answerLabels,
      issue: issueText,
      name: registrationName,
    });
    const buffer = await workbook.xlsx.writeBuffer();
    downloadExcel(
      new Uint8Array(buffer),
      `turnfest-auswertung-${exportedAt.toISOString().slice(0, 10)}.xlsx`,
    );
  },
  formatExport: (model, plansOnly) =>
    formatExport(model, plansOnly, {
      categories: categoryLabels,
      answers: answerLabels,
      issue: issueText,
      name: registrationName,
    }),
});
const root = document.getElementById('app');
if (!root) throw new Error('Application root is missing');
createRoot(root).render(
  <StrictMode>
    <AppProvider
      services={{
        controller,
        fileInput,
        demoInput: {
          name: 'Künstliche Demodaten',
          demo: true,
          size: demoCsv.length,
          read: async () => demoCsv,
        },
      }}
    >
      <App />
    </AppProvider>
  </StrictMode>,
);
