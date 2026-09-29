import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createSessionController } from '../application/session/controller';
import { parseCsv } from '../infrastructure/csv/papa-parser';
import { browserEffects, fileInput } from '../infrastructure/browser/adapters';
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
