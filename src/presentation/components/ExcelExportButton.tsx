import { useState } from 'react';
import { useServices } from '../app/context';

export function ExcelExportButton() {
  const { controller } = useServices();
  const [exporting, setExporting] = useState(false);
  async function download() {
    setExporting(true);
    try {
      await controller.downloadWorkbook();
    } finally {
      setExporting(false);
    }
  }
  return (
    <button className="button secondary" disabled={exporting} onClick={() => void download()}>
      {exporting ? 'Excel wird erstellt …' : 'Excel herunterladen'}
    </button>
  );
}
