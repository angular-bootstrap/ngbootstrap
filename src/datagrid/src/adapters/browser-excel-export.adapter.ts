import { ExcelExportAdapter, ExcelExportPayload } from '../services/export.services';

export class BrowserExcelExportAdapter implements ExcelExportAdapter {
  async export(payload: ExcelExportPayload) {
    const workbook = this.createSpreadsheetXml(payload);
    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.baseFileName(payload.fileName)}.xls`;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private createSpreadsheetXml({ sheetName, columns, rows }: ExcelExportPayload) {
    const header = this.createRow(columns.map(column => column.title));
    const body = rows.map(row => this.createRow(columns.map(column => row[column.key]))).join('');

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${this.escapeXml(this.safeSheetName(sheetName))}">
    <Table>${header}${body}</Table>
  </Worksheet>
</Workbook>`;
  }

  private createRow(values: unknown[]) {
    return `<Row>${values.map(value => this.createCell(value)).join('')}</Row>`;
  }

  private createCell(value: unknown) {
    if (value === null || value === undefined) {
      return '<Cell><Data ss:Type="String"></Data></Cell>';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
    }

    if (typeof value === 'boolean') {
      return `<Cell><Data ss:Type="Boolean">${value ? 1 : 0}</Data></Cell>`;
    }

    if (value instanceof Date) {
      return `<Cell><Data ss:Type="DateTime">${value.toISOString()}</Data></Cell>`;
    }

    return `<Cell><Data ss:Type="String">${this.escapeXml(String(value))}</Data></Cell>`;
  }

  private safeSheetName(sheetName: string) {
    return (sheetName || 'Sheet1').replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet1';
  }

  private baseFileName(fileName: string) {
    return (fileName || 'export').replace(/\.(xls)$/i, '');
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
