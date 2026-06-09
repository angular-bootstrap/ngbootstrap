import type { NgbCompositeFilterDescriptor } from './models/filtering';

export type NgbDataGridSortDirection = 'asc' | 'desc';

export interface NgbDataGridSortDescriptor {
  field: string;
  direction: NgbDataGridSortDirection;
}

export interface NgbDataGridState {
  /** 1-based page number used by the DataGrid pager. */
  page?: number;
  /** 0-based page index for API integrations that use page indexes. */
  pageIndex?: number;
  /** Number of records skipped before the current page. */
  skip?: number;
  pageSize?: number;
  sort?: NgbDataGridSortDescriptor[];
  filter?: NgbCompositeFilterDescriptor;
  globalFilter?: string;
}

export type NgbDataGridAggregateFunction = 'count' | 'sum' | 'average' | 'min' | 'max';

export interface NgbDataGridAggregateDescriptor {
  field: string;
  aggregate: NgbDataGridAggregateFunction;
}

export type NgbDataGridAggregateResults = Record<
  string,
  Partial<Record<NgbDataGridAggregateFunction, number | string | Date | null>>
>;

export interface NgbDataGridProcessOptions<T = unknown> {
  state?: NgbDataGridState | null;
  aggregates?: NgbDataGridAggregateDescriptor[];
  globalFilterFields?: string[];
  columns?: Array<{ field: Extract<keyof T, string> | string; type?: string; filterType?: string }>;
  /**
   * When false, returns the filtered/sorted full result without page slicing.
   * Aggregates are always calculated before page slicing.
   */
  page?: boolean;
}

export interface NgbDataGridDataResult<T = unknown> {
  data: T[];
  total: number;
  aggregates?: NgbDataGridAggregateResults;
}

// datagrid.types.ts
export type NgbDataGridExportType = 'pdf' | 'excel' | 'both';
export type NgbDataGridExportPages = 'all' | 'current' | 'selection';
export type NgbDataGridTheme =
  | 'bootstrap'
  | 'bootstrap-main'
  | 'bootstrap-main-dark'
  | 'bootstrap-nordic'
  | 'bootstrap-urban'
  | 'bootstrap-vintage'
  | 'material'
  | 'material-main'
  | 'material-indigo'
  | 'material-deep-purple'
  | 'tailwind'
  | 'tailwind-main'
  | 'tailwind-slate'
  | 'tailwind-emerald';

export interface NgbDataGridThemeOption {
  value: NgbDataGridTheme;
  label: string;
  group: 'Bootstrap' | 'Material' | 'Tailwind';
  swatches: [string, string, string];
  dark?: boolean;
}

export const NGB_DATAGRID_THEME_OPTIONS: NgbDataGridThemeOption[] = [
  { value: 'bootstrap', label: 'Classic', group: 'Bootstrap', swatches: ['#ffffff', '#0d6efd', '#6c757d'] },
  { value: 'bootstrap-main', label: 'Ocean', group: 'Bootstrap', swatches: ['#f8fbff', '#1769e0', '#172554'] },
  { value: 'bootstrap-main-dark', label: 'Midnight', group: 'Bootstrap', swatches: ['#111827', '#38bdf8', '#e5e7eb'], dark: true },
  { value: 'bootstrap-nordic', label: 'Aqua Rose', group: 'Bootstrap', swatches: ['#f8ffff', '#0891b2', '#fb7185'] },
  { value: 'bootstrap-urban', label: 'Clay', group: 'Bootstrap', swatches: ['#fffaf7', '#c05621', '#256d85'] },
  { value: 'bootstrap-vintage', label: 'Sage', group: 'Bootstrap', swatches: ['#fffdf7', '#6b705c', '#b08968'] },
  { value: 'material-main', label: 'Orchid', group: 'Material', swatches: ['#fffbfe', '#9c27b0', '#2d1b33'] },
  { value: 'material-indigo', label: 'Indigo', group: 'Material', swatches: ['#f7f8ff', '#3f51b5', '#263238'] },
  { value: 'material-deep-purple', label: 'Plum', group: 'Material', swatches: ['#fdf8ff', '#7e57c2', '#4a148c'] },
  { value: 'tailwind-main', label: 'Sky', group: 'Tailwind', swatches: ['#ffffff', '#0284c7', '#0f172a'] },
  { value: 'tailwind-slate', label: 'Graphite', group: 'Tailwind', swatches: ['#f8fafc', '#334155', '#020617'] },
  { value: 'tailwind-emerald', label: 'Mint', group: 'Tailwind', swatches: ['#f0fdfa', '#0f766e', '#064e3b'] },
];

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

/** Built-in row editing interaction mode. */
export type NgbEditMode = 'inline' | 'incell' | 'external' | 'toolbar';

/** Labels and visibility for the built-in multi-checkbox filter menu footer. */
/** Segment returned by {@link Datagrid.getSearchHighlightSegments} for match highlighting. */
export interface NgbSearchHighlightSegment {
  text: string;
  match: boolean;
}

/** Placement when calling {@link Datagrid.reorderColumn}. */
export interface NgbColumnReorderOptions {
  /** When true (default), inserts before the column at the destination index. When false, inserts after it. */
  before?: boolean;
}

export interface NgbColumnReorderEvent<T = any> {
  /** Visible columns in their new order. */
  columns: Array<{ field: string; header: string } & Record<string, unknown>>;
  /** Column that was moved. */
  column: T;
  fromIndex: number;
  toIndex: number;
  /** Ordered field names after the move. */
  fields: string[];
}

export interface NgbMultiCheckboxFilterOptions {
  /** Primary action label. Default: `OK` */
  applyLabel?: string;
  /** Secondary action label. Default: `Cancel` */
  cancelLabel?: string;
  /** Whether the secondary action is shown. Default: `true` */
  showCancel?: boolean;
}
