import { ExcelExportAdapter, ExcelExportPayload } from '../services/export.services';

export class XlsxAdapter implements ExcelExportAdapter {
  async export({ fileName, sheetName, columns, rows }: ExcelExportPayload) {
    const XLSX = await import('xlsx');
    const header = [columns.map(c => c.title)];
    const data = rows.map(r => columns.map(c => r[c.key]));
    const ws = XLSX.utils.aoa_to_sheet([...header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}