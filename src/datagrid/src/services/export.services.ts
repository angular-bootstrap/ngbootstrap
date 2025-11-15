import { inject, Injectable } from "@angular/core";

export interface PdfExportPayload { fileName: string; columns: string[]; rows: any[]; options?: any; }
export interface ExcelExportPayload { fileName: string; sheetName: string; columns: Array<{ key: string; title: string }>; rows: any[]; }

export abstract class PdfExportAdapter { abstract export(p: PdfExportPayload): Promise<void>; }
export abstract class ExcelExportAdapter { abstract export(p: ExcelExportPayload): Promise<void>; }

@Injectable({ providedIn: 'root' })
export class NgbExportService {
  // Optional injections via inject()
  private pdf = inject(PdfExportAdapter, { optional: true });
  private excel = inject(ExcelExportAdapter, { optional: true });

  exportPdf(p: PdfExportPayload) {
    if (!this.pdf) throw new Error('No PdfExportAdapter provided');
    return this.pdf.export(p);
  }

  exportExcel(p: ExcelExportPayload) {
    if (!this.excel) throw new Error('No ExcelExportAdapter provided');
    return this.excel.export(p);
  }
}