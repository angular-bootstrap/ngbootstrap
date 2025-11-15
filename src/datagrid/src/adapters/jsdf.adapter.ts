import { PdfExportAdapter, PdfExportPayload } from '../services/export.services';

export class JsPdfAdapter implements PdfExportAdapter {
  async export({ fileName, columns, rows, options }: PdfExportPayload) {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: options?.landscape ? 'landscape' : 'portrait' });
    autoTable(doc, { head: [columns], body: rows.map(r => columns.map(k => r[k])), margin: options?.margins });
    doc.save(`${fileName}.pdf`);
  }
}