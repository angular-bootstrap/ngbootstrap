// datagrid.types.ts
export type NgbDataGridExportType = 'pdf' | 'excel' | 'both';
export type NgbDataGridExportPages = 'all' | 'current' | 'selection';
export type NgbDataGridTheme = 'material' | 'tailwind' | 'bootstrap';

export interface NgbDataGridExportOptions {
  enabled: boolean;
  type: NgbDataGridExportType;
  pages: NgbDataGridExportPages;
  fileName?: string;
  pdf?: { pageSize?: 'A4'|'Letter'|string; landscape?: boolean; margins?: [number,number,number,number] };
  excel?: { sheetName?: string };
}

export interface NgbDataGridResponsiveOptions {
  enabled: boolean;
  breakpoints?: { mobile?: number; tablet?: number; desktop?: number };
}
