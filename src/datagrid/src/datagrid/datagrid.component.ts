import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output, inject, AfterContentInit, ContentChildren, QueryList, OnChanges, SimpleChanges, TemplateRef, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnDef } from '../models/column-def';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import {
  NgbCellTemplate, NgbEditorTemplate, NgbFilterTemplate, NgbGlobalFilterTemplate,
  CellCtx, EditCtx, FilterCtx
} from '../directives/datagrid-templates.directive';
import { ContentChild } from '@angular/core';
import { NgbRowDetailTemplate } from '../directives/datagrid-templates.directive';
import { NgbPaginationComponent } from '../../../pagination';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { NgbDataGridExportOptions, NgbDataGridTheme, NgbDataGridResponsiveOptions } from '../datagrid.types';
import { ExcelExportAdapter, NgbExportService, PdfExportAdapter } from '../services/export.services';
import { NgbDatagridDefaultEditService, NgbDatagridEditService, NgbDatagridTrackByFn } from '../services/editing.service';
import { JsPdfAdapter } from '../adapters/jsdf.adapter';
import { XlsxAdapter } from '../adapters/xlsx.adapter';

import { ExportButtonDirective, ExportButtonContext } from '../directives/export-button.directive';
import { NgbGridHighlightDirective, HighlightItem } from './directives/grid-highlight.directive';
import { NgbSyncColgroupDirective } from './directives/colgroup-sync.directive';

type SortDir = 'asc' | 'desc' | '';

type Key<T> = Extract<keyof T, string>;

type KeyOf<T> = Extract<keyof T, string>;

const MAX_EMAIL_LENGTH = 254;

export type NgbTableResponsive = true | false | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export interface NgbTableOptions {
  stripedRows?: boolean;
  stripedColumns?: boolean;
  hoverRows?: boolean;
  activeRows?: boolean;
  bordered?: boolean;
  borderless?: boolean;
  small?: boolean;
  groupDividers?: boolean;
  align?: 'top' | 'middle' | 'bottom';
  caption?: string;
  captionSide?: 'top' | 'bottom';
  responsive?: NgbTableResponsive;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
  stickyRows?: boolean;
}

export type NgbSelectionMode = 'none' | 'single' | 'multiple';
export type NgbSelectionBehavior = 'row' | 'checkbox' | 'both';
export type NgbSelectionKeyMode = 'desktop' | 'mobile';
export type NgbRowKey = string | ((row: any, rowIndex: number) => any);
export type NgbColKey = string | ((column: any, columnIndex: number) => any);

export interface NgbSelectionLabels {
  selectAll?: string;
  unselectAll?: string;
  selectRow?: string;
  unselectRow?: string;
}

const isReasonableEmail = (value: unknown): boolean => {
  if (value == null) return false;
  const str = String(value);
  if (!str || str.length > MAX_EMAIL_LENGTH) return false;
  // Basic, linear-time check: one "@", non-empty local part, and a domain with at least one ".".
  const at = str.indexOf('@');
  if (at <= 0) return false;
  if (str.indexOf('@', at + 1) !== -1) return false;
  if (at === str.length - 1) return false;
  if (/\s/.test(str)) return false;
  const dot = str.lastIndexOf('.');
  if (dot <= at + 1) return false;
  if (dot === str.length - 1) return false;
  return true;
};

@Component({
  selector: 'ngb-datagrid',
  templateUrl: './datagrid.component.html',
  imports: [CommonModule, FormsModule, NgbPaginationComponent, ReactiveFormsModule, NgbSyncColgroupDirective, NgbGridHighlightDirective],
  styleUrls: ['./datagrid.component.scss'],
  providers: [
    { provide: PdfExportAdapter, useClass: JsPdfAdapter },
    { provide: ExcelExportAdapter, useClass: XlsxAdapter }
  ],
  standalone:true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Datagrid<T = any> implements AfterContentInit, AfterViewInit, OnChanges {
  /** Column definitions to render */
  @Input() columns: ColumnDef<T>[] = [];

  /** Row data to display */
  @Input() data: T[] = [];
  @Input() enableSorting = false;
  @Input() enableFiltering = false;       // per-column + global
  @Input() enableGlobalFilter = false;    // global search bar
  @Input() enablePagination = false;
  @Input() enableEdit = false;
  @Input() enableDelete = false;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Input() enableAdd = false;
  /** Accessible label (aria-label) applied to the add-row button. */
  @Input() addButtonAriaLabel: string | null = 'Add row';
  /** Visible text rendered inside the add-row button. */
  @Input() addButtonText = '+ Add';
  /** Shows sticky toggle column and keeps pinned rows at the top of the list. */
  @Input() stickyRows = false;
  /** Enables sticky column header when scrolling. */
  @Input() stickyHeader = false;
  /** Enables sticky footer when scrolling. */
  @Input() stickyFooter = false;
  /** Enables scroll container (used when pagination is off). */
  @Input() scrollable = true;
  /** Row height used to stack multiple sticky rows without overlap (px). */
  @Input() stickyRowHeight = 40;
  /** Header height (px) used to offset sticky rows below the header. */
  @Input() stickyHeaderHeight = 40;
  /** Footer height (px) used to offset scrollable area. */
  @Input() stickyFooterHeight = 56;
  /** Bootstrap-like table styling options. */
  @Input() tableOptions: NgbTableOptions = {};
  /** Selection mode for rows. */
  @Input() selectionMode: NgbSelectionMode = 'none';
  /** Selection activation: row click, checkbox only, or both. */
  @Input() selectionBehavior: NgbSelectionBehavior = 'row';
  /** Keyboard modifier rules for multi-select. */
  @Input() selectionKeyMode: NgbSelectionKeyMode = 'desktop';
  /** Enable header select-all checkbox for multiple mode. */
  @Input() selectAllEnabled = true;
  /** A11y labels for selection controls. */
  @Input() selectionA11yLabels: NgbSelectionLabels = {};
  /** Disable selection for specific rows. */
  @Input() selectionDisabledFn?: (row: T, index: number) => boolean;
  /** Highlight items (row/cell). */
  @Input() highlightedIndex: HighlightItem[] = [];
  /** Row key for highlighting. */
  @Input() highlightRowKey: NgbRowKey | null = null;
  /** Column key for highlighting. */
  @Input() highlightColKey: NgbColKey | null = null;
  scrollbarWidth = 0;
  /** Accessible label for the global filter input. */
  @Input() globalFilterAriaLabel = 'Search all columns';
  /** Accessible label announced when expanding a row. */
  @Input() expandRowAriaLabel = 'Expand row';
  /** Accessible label announced when collapsing a row. */
  @Input() collapseRowAriaLabel = 'Collapse row';
  /** Accessible label for the PDF export button. */
  @Input() exportPdfAriaLabel = 'Export to PDF';
  /** Accessible label for the Excel export button. */
  @Input() exportExcelAriaLabel = 'Export to Excel';
  /** Optional defaults for new rows */
  @Input() newRowDefaults: | Partial<Record<KeyOf<T>, any>> | (() => Partial<Record<KeyOf<T>, any>>) | null = null;
  @Input() strictEmail = false; // turn off if needed (e.g., intranet emails)
  @Input() editOnRowClick = false;
  @Input() singleExpand = false;  // accordion mode: one row expanded at a time
  @Input() exportOptions: NgbDataGridExportOptions = {
    enabled: false,
    type: 'both',
    pages: 'current',
    fileName: 'export'
  };

  @Input() theme: NgbDataGridTheme = 'bootstrap';
  @Input() responsive: NgbDataGridResponsiveOptions | boolean = false;
  @Input() trackBy?: NgbDatagridTrackByFn<T>;
  @Input() editService?: NgbDatagridEditService<T>;

  // Data hooks for export
  @Input() dataProviderAll?: () => Observable<any[]> | Promise<any[]> | any[]; // used when pages='all'
  @Input() dataProviderSelection?: () => any[]; // used when pages='selection'
  
  // Grab the directive and its TemplateRef
  @ContentChild(ExportButtonDirective) exportButtonDir?: ExportButtonDirective;
  @ViewChild('bodyScroller') bodyScroller?: ElementRef<HTMLElement>;
  @ViewChild('headerScroller') headerScroller?: ElementRef<HTMLElement>;
  colgroupSyncId = `dg-col-${Math.random().toString(36).slice(2, 8)}`;

  exporting = false;
  
  @Output() rowAdd = new EventEmitter<{ newRow: T }>();

  //  events
  @Output() rowEdit = new EventEmitter<{ row: T; index: number }>();
  @Output() rowSave = new EventEmitter<{ original: T; updated: T; index: number }>();
  @Output() rowCancel = new EventEmitter<{ row: T; index: number }>();
  @Output() rowDelete = new EventEmitter<{ row: T; index: number }>();

  @Output() sortChange = new EventEmitter<{ active: string | null; direction: 'asc' | 'desc' | '' }>();
  @Output() filtersChange = new EventEmitter<{ global: string; columns: Record<string, string> }>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();
  @Output() selectionChange = new EventEmitter<{ selected: T[]; lastAction: { row: T; index: number; selected: boolean } | null }>();

  @ContentChild(NgbRowDetailTemplate) rowDetailTpl?: NgbRowDetailTemplate<T>;
  private exporter = inject(NgbExportService); // instead of constructor(private exporter: NgbExportService) {}

  expanded: Set<number> = new Set<number>();

  private fb = inject(FormBuilder);

  public filterForm: FormGroup = this.fb.group({});
  public globalFilterCtrl = new FormControl<string>('', { nonNullable: true });

  addingNew = false;
  draftNew: Partial<Record<KeyOf<T>, any>> | null = null;
  errorsNew: Partial<Record<KeyOf<T>, string>> = {};
  // --- sorting (from previous step)
  sort: { active: Extract<keyof T, string> | null; direction: SortDir } = { active: null, direction: '' };
  stickyRowIds: Set<any> = new Set<any>();
  selectedRowIds: Set<any> = new Set<any>();
  private selectionAnchor: number | null = null;
  private highlightRowMap: Map<any, HighlightItem[]> = new Map();
  // --- filtering
  globalFilter = '';
  filters: Record<string, string> = {};  // per-column text
  page = 1;
  @Input() pageSize = 10;

  /** Inline editing state */
  editingIndex: number | null = null; // index in `paged` view
  editForm: FormGroup = this.fb.group({});
  saveAttemptedEdit = false;

  addForm:  FormGroup = this.fb.group({});
  saveAttemptedNew = false;
  private addDraftRowId: any = null;

  private readonly defaultEditService = new NgbDatagridDefaultEditService<T>();
  private cdr = inject(ChangeDetectorRef);

  private norm(v: unknown): string {
    return (v ?? '').toString().toLowerCase().trim();
  }

  private keyOf(col: ColumnDef<T>): KeyOf<T> {
    return col.field as KeyOf<T>;
  }

  private getDefaults(): Partial<Record<KeyOf<T>, any>> {
    return typeof this.newRowDefaults === 'function'
      ? (this.newRowDefaults as any)() ?? {}
      : this.newRowDefaults ?? {};
  }

  private defaultFor(col: ColumnDef<T>): any {
    const d = this.getDefaults();
    const key = col.field as KeyOf<T>;
    if (key in d) return d[key];
    switch (col.type) {
      case 'boolean': return false;
      case 'number': return '';
      case 'date': return '';
      default: return '';
    }
  }
  private numberValidator() {
    const rx = /^-?\d+(\.\d+)?$/;
    return (c: AbstractControl) =>
      c.value === '' || c.value === null || c.value === undefined || rx.test(String(c.value))
        ? null
        : { number: true };
  }

  private dateValidator() {
    return (c: AbstractControl) => {
      const v = c.value;
      if (v === '' || v === null || v === undefined) return null;
      return isNaN(Date.parse(String(v))) ? { date: true } : null;
    };
  }

  private buildFormFromRow(row?: Partial<Record<KeyOf<T>, any>>): FormGroup {
    const group: Record<string, any> = {};
    for (const col of this.columns) {
      if (col.editable === false) continue; // read-only columns not in form
      const key = col.field as string;
      const initial = row && key in row ? (row as any)[key] : this.defaultFor(col);
      const v: any[] = [];

      if (col.required && col.type !== 'boolean') v.push(Validators.required);
      if (col.type === 'email') {
        v.push(this.strictEmail ? this.strictEmailValidator() : Validators.email);
      }      
      if (col.type === 'number') v.push(this.numberValidator());
      if (col.type === 'date') v.push(this.dateValidator());
      // NOTE: If you need "boolean must be true", add Validators.requiredTrue here.

      group[key] = [initial, v];
    }
    return this.fb.group(group);
  }

  private strictEmailValidator() {
    // simple, pragmatic: local@domain.tld (tld >= 2)
    const rx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return (c: AbstractControl) => {
      const v = c.value;
      if (v === null || v === undefined || v === '') return null; // let "required" handle empties
      if (`${v}`.length > MAX_EMAIL_LENGTH) return { email: true };
      return rx.test(String(v)) ? null : { email: true };
    };
  }

  //Getter for the ng-template
  get exportButtonTpl(): TemplateRef<ExportButtonContext> | null {
    return this.exportButtonDir?.templateRef ?? null;
  }
  // pipeline respects toggles
  get filtered(): T[] {
    if (!this.enableFiltering) return this.data ?? [];
    const src = this.data ?? [];
    return src.filter(r => {
      // per-column
      for (const col of this.columns) {
        if (!col.filterable) continue;
        const q = (this.filters[col.field as string] ?? '').toString().toLowerCase().trim();
        if (!q) continue;
        const cell = ((r as any)[col.field] ?? '').toString().toLowerCase().trim();
        if (!cell.includes(q)) return false;
      }
      // global
      if (this.enableGlobalFilter) {
        const g = (this.globalFilter ?? '').toString().toLowerCase().trim();
        if (g) return this.columns.some(c => ((r as any)[c.field] ?? '').toString().toLowerCase().includes(g));
      }
      return true;
    });
  }

  get sorted(): T[] {
    const base = (!this.enableSorting || !this.sort.active || !this.sort.direction)
      ? [...this.filtered]
      : (() => {
        const copy = [...this.filtered];
        const { active, direction } = this.sort;
        copy.sort((a: any, b: any) => {
          const av = a?.[active]; const bv = b?.[active];
          const cmp = typeof av === 'string' && typeof bv === 'string'
            ? av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
            : av < bv ? -1 : av > bv ? 1 : 0;
          return direction === 'asc' ? cmp : -cmp;
        });
        return copy;
      })();
    return this.withStickyRowsFirst(base);
  }
  // pagination (filled in next step)

  get paged(): T[] {
    if (!this.enablePagination) return this.sorted;
    const start = (this.page - 1) * this.pageSize;
    return this.sorted.slice(start, start + this.pageSize);
  }

  // getters for template conditions / display
  get anyFilterable(): boolean {
    return this.enableFiltering && !!this.columns?.some(c => c.filterable);
  }

  get startIndex(): number { const total = this.sorted.length; return total ? (this.page - 1) * this.pageSize + 1 : 0; }
  get endIndex(): number { return Math.min(this.page * this.pageSize, this.sorted.length); }

  get shouldEnableScroll(): boolean {
    return this.scrollable;
  }

  get isHeaderSticky(): boolean {
    return this.stickyHeaderEnabled && this.shouldEnableScroll;
  }

  get isFooterSticky(): boolean {
    return this.stickyFooterEnabled && this.shouldEnableScroll;
  }

  get detailColspan(): number {
    const actionCols = (this.enableEdit || this.enableDelete) ? 1 : 0;
    const caretCol   = this.rowDetailTpl ? 1 : 0;
    const stickyCol  = this.stickyRowsEnabled ? 1 : 0;
    const selectionCol = this.isSelectionEnabled() ? 1 : 0;
    return this.columns.length + actionCols + caretCol + stickyCol + selectionCol;
  }

  get tableClassList(): string[] {
    const opts = this.tableOptions || {};
    const cls: string[] = ['table'];
    if (opts.stripedRows) cls.push('table-striped');
    if (opts.stripedColumns) cls.push('table-striped-columns');
    if (opts.hoverRows) cls.push('table-hover');
    if (opts.bordered) cls.push('table-bordered');
    if (opts.borderless) cls.push('table-borderless');
    if (opts.small) cls.push('table-sm');
    if (opts.groupDividers) cls.push('table-group-divider');
    if (opts.align === 'middle') cls.push('align-middle');
    if (opts.align === 'bottom') cls.push('align-bottom');
    return cls;
  }

  get responsiveWrapperClasses(): string[] {
    const r = this.tableOptions?.responsive;
    if (r === false) return [];
    if (r === true || r === undefined) return ['table-responsive'];
    return [`table-responsive-${r}`];
  }

  updateHighlightCache(): void {
    this.highlightRowMap.clear();
    (this.highlightedIndex || []).forEach(item => {
      const rowKey = item.row;
      if (!this.highlightRowMap.has(rowKey)) this.highlightRowMap.set(rowKey, []);
      this.highlightRowMap.get(rowKey)?.push(item);
    });
  }

  headerText(col: ColumnDef<T>): string {
    return (col.header ?? col.field ?? '').toString();
  }

  columnFilterAriaLabel(col: ColumnDef<T>): string {
    return `${this.headerText(col)} filter`;
  }

  inputAriaLabel(col: ColumnDef<T>): string {
    return this.headerText(col);
  }

  ariaSortFor(field: Extract<keyof T, string>): 'ascending' | 'descending' | 'none' {
    if (!this.enableSorting || this.sort.active !== field || !this.sort.direction) {
      return 'none';
    }
    return this.sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortButtonAriaLabel(col: ColumnDef<T>): string {
    const header = this.headerText(col);
    const state = this.sort.active === col.field
      ? (this.sort.direction === 'asc'
        ? 'ascending'
        : this.sort.direction === 'desc'
          ? 'descending'
          : 'unsorted')
      : 'unsorted';
    return `Sort by ${header}. Current sort ${state}.`;
  }

  exportAriaLabel(kind: 'pdf'|'excel'): string {
    return kind === 'pdf' ? this.exportPdfAriaLabel : this.exportExcelAriaLabel;
  }
  private withStickyRowsFirst(rows: T[]): T[] {
    if (!this.stickyRows || this.stickyRowIds.size === 0) return rows;
    const sticky: T[] = [];
    const rest: T[] = [];

    rows.forEach(r => {
      const di = this.data.indexOf(r);
      const id = this.getRowId(di >= 0 ? di : 0, r);
      (this.stickyRowIds.has(id) ? sticky : rest).push(r);
    });

    return [...sticky, ...rest];
  }


  // Helpers to map from paged index → original data index
  // helper used above
  private dataIndexFromPaged(i: number): number {
    const row = this.paged[i];
    return this.data.indexOf(row);
  }

  private rebuildFilterForm() {
    const group: Record<string, any> = {};
    for (const c of this.columns) if (c.filterable) group[c.field as string] = [''];
    this.filterForm = this.fb.group(group);

    this.filterForm.valueChanges.subscribe(v => {
      this.page = 1;
      this.filtersChange.emit({ global: this.globalFilterCtrl.value, columns: v as any });
    });
    this.globalFilterCtrl.valueChanges.subscribe(() => {
      this.page = 1;
      this.filtersChange.emit({ global: this.globalFilterCtrl.value, columns: this.filterForm.value as any });
    });
  }

  @ContentChildren(NgbCellTemplate)   private cellTplQ!:   QueryList<NgbCellTemplate<T>>;
  @ContentChildren(NgbEditorTemplate) private editTplQ!:   QueryList<NgbEditorTemplate<T>>;
  @ContentChildren(NgbFilterTemplate) private filterTplQ!: QueryList<NgbFilterTemplate<T>>;
  @ContentChildren(NgbGlobalFilterTemplate) private globalTplQ!: QueryList<NgbGlobalFilterTemplate>;

  /** Internal lookup maps */
  public cellTpls:   Record<string, NgbCellTemplate<T>> = {};
  public editTpls:   Record<string, NgbEditorTemplate<T>> = {};
  public filterTpls: Record<string, NgbFilterTemplate<T>> = {};
  public globalTpl:  NgbGlobalFilterTemplate | null = null;

  private toRecord<T extends { field: string }>(
    items: readonly T[] | QueryList<T> | null | undefined
  ): Record<string, T> {
    const arr = Array.isArray(items)
      ? items
      : items instanceof QueryList
        ? items.toArray()
        : [];
    return arr.reduce((acc, t) => (acc[t.field] = t, acc), {} as Record<string, T>);
  }
  
  async export(kind: 'pdf'|'excel') {
    if (!this.exportOptions?.enabled) return;
    this.exporting = true;
    try {
      const data = await this.resolveDataset();
      const cols = this.columns.map(c => ({ key: c.field, title: c.header }));
      if (kind === 'pdf') {
        await this.exporter.exportPdf({
          fileName: this.exportOptions.fileName || 'export',
          columns: cols.map(c => c.key),
          rows: data,
          options: this.exportOptions.pdf
        });
      } else {
        await this.exporter.exportExcel({
          fileName: this.exportOptions.fileName || 'export',
          sheetName: this.exportOptions.excel?.sheetName || 'Sheet1',
          columns: cols,
          rows: data
        });
      }
    } finally { this.exporting = false; }
  }

  private async resolveDataset(): Promise<any[]> {
    const mode = this.exportOptions?.pages || 'current';
    if (mode === 'all') {
      if (!this.dataProviderAll) throw new Error('dataProviderAll required when pages="all"');
      const d = this.dataProviderAll();
      return isObservable(d) ? firstValueFrom(d) : (d instanceof Promise ? d : d);
    }
    if (mode === 'selection') {
      if (!this.dataProviderSelection) throw new Error('dataProviderSelection required when pages="selection"');
      return this.dataProviderSelection();
    }
    // current page == your existing `paged` array
    return this.paged;
  }

  ngAfterContentInit(): void {
    const rebuild = () => {
      this.cellTpls   = this.toRecord(this.cellTplQ);
      this.editTpls   = this.toRecord(this.editTplQ);
      this.filterTpls = this.toRecord(this.filterTplQ);
      this.globalTpl  = this.globalTplQ?.first ?? null;
    };
    rebuild();
    this.cellTplQ?.changes.subscribe(rebuild);
    this.editTplQ?.changes.subscribe(rebuild);
    this.filterTplQ?.changes.subscribe(rebuild);
    this.globalTplQ?.changes.subscribe(rebuild);
  }
  ngAfterViewInit(): void {
    queueMicrotask(() => this.syncScrollbarWidth());
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['columns']) this.rebuildFilterForm();
    if (ch['highlightedIndex']) this.updateHighlightCache();
  }

  private getRowId(rowIndex: number, row: T): any {
    return this.trackBy ? this.trackBy(rowIndex, row) : rowIndex;
  }

  private getEditService(): NgbDatagridEditService<T> {
    return this.editService ?? this.defaultEditService;
  }

  startAdd() {
    if (!this.enableAdd || this.addingNew) return;
    this.page = 1;
    this.editingIndex = null;
    this.addingNew = true;
    this.addForm = this.buildFormFromRow(); // defaults
    this.saveAttemptedNew = false;

    // Register a draft row with the edit service so implementations can track "new" state.
    const service = this.getEditService();
    const draft = service.assignValues({} as T, this.addForm.value as any);
    this.addDraftRowId = Symbol('ngb-datagrid-new-row');
    service.create(this.data ?? [], draft, this.data.length, this.addDraftRowId);
  }

  saveAdd() {
    if (!this.addingNew || !this.addForm) return;
    this.saveAttemptedNew = true;
    this.addForm.markAllAsTouched();
    this.addForm.updateValueAndValidity();

    if (this.addForm.invalid) return;

    const service = this.getEditService();
    const newRow = service.assignValues({} as T, this.addForm.value as any);
    const rowIndex = this.data.length;
    const rowId = this.addDraftRowId ?? this.getRowId(rowIndex, newRow);
    service.create(this.data ?? [], newRow, rowIndex, rowId);
    service.saveChanges(this.data ?? [], rowIndex, rowId, newRow);
    this.rowAdd.emit({ newRow });

    this.addingNew = false;
    this.addForm = this.fb.group({});;
    this.saveAttemptedNew = false;
    this.addDraftRowId = null;
  }

  cancelAdd() {
    if (this.addDraftRowId != null) {
      this.getEditService().cancelChanges(this.data ?? [], this.data.length, this.addDraftRowId);
    }
    this.addingNew = false;
    this.addForm = this.fb.group({});;
    this.saveAttemptedNew = false;
    this.addDraftRowId = null;
  }

  startEdit(i: number) {
    if (!this.enableEdit) return;
    this.addingNew = false;
    this.editingIndex = i;
    const row = this.paged[i] as any;
    this.editForm = this.buildFormFromRow(this.paged[i] as any);
    this.saveAttemptedEdit = false;
    const di = this.data.indexOf(row);
    const rowId = this.getRowId(di, this.data[di]);
    // Start tracking baseline for the row (service can snapshot original state).
    this.getEditService().update(this.data ?? [], this.data[di], di, rowId);
    this.rowEdit.emit({ row: this.data[di], index: di });
  }

  saveEdit(i: number) {
    if (this.editingIndex !== i || !this.editForm) return;
    this.saveAttemptedEdit = true;
    this.editForm.markAllAsTouched();
    this.editForm.updateValueAndValidity();

    if (this.editForm.invalid) return;

    const di = this.data.indexOf(this.paged[i]);
    const original = this.data[di];
    const rowId = this.getRowId(di, original);
    const service = this.getEditService();
    const updated = service.assignValues(original, this.editForm.value as any);
    service.update(this.data ?? [], updated, di, rowId);
    service.saveChanges(this.data ?? [], di, rowId, updated);

    this.rowSave.emit({ original, updated, index: di });

    this.editingIndex = null;
    this.editForm = this.fb.group({});
    this.saveAttemptedEdit = false;
  }

  cancelEdit(i: number) {
    const di = this.data.indexOf(this.paged[i]);
    const rowId = this.getRowId(di, this.data[di]);
    this.getEditService().cancelChanges(this.data ?? [], di, rowId);
    this.rowCancel.emit({ row: this.data[di], index: di });
    this.editingIndex = null;
    this.editForm = this.fb.group({});   // empty group
    this.saveAttemptedEdit = false;
  }

  // For the "Add row" draft
  onNewDraftChange(col: ColumnDef<T>) {
    if (this.draftNew) {
      const key = this.keyOf(col);
      this.draftNew = this.getEditService().assignValues(this.draftNew as any, { [key]: (this.draftNew as any)[key] } as any) as any;
    }
    this.validateInto(col, this.draftNew, this.errorsNew);
  }

  validateInto(col: ColumnDef<T>,
    targetDraft: Partial<Record<KeyOf<T>, any>> | null,
    targetErrors: Partial<Record<KeyOf<T>, string>>
  ) {
    if (!targetDraft) return;
    const key = this.keyOf(col);
    const val = targetDraft[key];
    let err = '';

    // required
    if (col.required) {
      const empty = val == null || (typeof val === 'string' && val.trim() === '');
      if (empty) err = 'Required';
    }
    // type checks
    if (!err && col.type === 'email' && val && !isReasonableEmail(val)) err = 'Invalid email';
    if (!err && col.type === 'number' && val !== '' && val != null && Number.isNaN(Number(val))) err = 'Invalid number';
    if (!err && col.type === 'date' && val && Number.isNaN(Date.parse(String(val)))) err = 'Invalid date';
    if (!err && col.type === 'boolean' && col.required && val !== true && val !== false) err = 'Required';

    if (err) targetErrors[key] = err; else delete targetErrors[key];
  }

  deleteRow(i: number) {
    if (!this.enableDelete) return;
    const di = this.dataIndexFromPaged(i);
    const row = this.data[di];
    const rowId = this.getRowId(di, row);
    this.getEditService().remove(this.data ?? [], di, rowId);
    this.rowDelete.emit({ row, index: di });
  }

  // (optional) better *ngFor performance
  trackRow = (index: number, row: T) => {
    const di = this.data.indexOf(row);
    const rowIndex = di >= 0 ? di : index;
    return this.trackBy ? this.trackBy(rowIndex, row) : rowIndex;
  };

  private rowKeyValue(row: T, rowIndex: number): any {
    const key = this.highlightRowKey;
    if (typeof key === 'function') return (key as any)(row, rowIndex);
    if (typeof key === 'string') return (row as any)?.[key];
    return rowIndex;
  }

  private colKeyValue(column: ColumnDef<T>, colIndex: number): any {
    const key = this.highlightColKey;
    if (typeof key === 'function') return (key as any)(column, colIndex);
    if (typeof key === 'string') return (column as any)?.[key];
    return colIndex;
  }

  isRowHighlighted(row: T, rowIndex: number): boolean {
    const key = this.rowKeyValue(row, rowIndex);
    return this.highlightRowMap.has(key) && this.highlightRowMap.get(key)?.some(h => h.columnKey === undefined) === true;
  }

  isCellHighlighted(row: T, rowIndex: number, column: ColumnDef<T>, colIndex: number): boolean {
    const key = this.rowKeyValue(row, rowIndex);
    const colKey = this.colKeyValue(column, colIndex);
    const items = this.highlightRowMap.get(key);
    return !!items?.some(h => h.columnKey === colKey);
  }

  toggleSort(field: Extract<keyof T, string>) {
    if (!this.enableSorting) return;

    if (this.sort.active !== field) this.sort = { active: field, direction: 'asc' };
    else this.sort = {
      active: field,
      direction: this.sort.direction === 'asc' ? 'desc' : this.sort.direction === 'desc' ? '' : 'asc'
    };

    this.page = 1;
    this.sortChange.emit({ active: this.sort.active, direction: this.sort.direction });
  }

  onGlobalFilterChange() {
    if (!this.enableFiltering || !this.enableGlobalFilter) return;
    this.page = 1;
    this.filtersChange.emit({ global: this.globalFilter, columns: { ...this.filters } });
  }

  onColumnFilterChange() {
    if (!this.enableFiltering) return;
    this.page = 1;
    this.filtersChange.emit({ global: this.globalFilter, columns: { ...this.filters } });
  }

  onPageChange(p: number) {
    this.page = p;
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
  }

  onPageSizeChange() {
    this.page = 1;
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
  }

  toggleExpand(i: number): void {
    const isOpen = this.expanded.has(i);

    if (this.singleExpand) {
      this.expanded.clear();
      if (!isOpen) this.expanded.add(i); // open the clicked row, or close all if it was open
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isOpen ? this.expanded.delete(i) : this.expanded.add(i);
    }
  }

  isExpanded(i: number): boolean {
    return this.expanded.has(i);
  }

  onRowClick(ev: MouseEvent, i: number) {
    if (!this.editOnRowClick) return;
    if (this.addingNew || this.editingIndex === i) return;
    const el = ev.target as HTMLElement;
    if (el.closest('button, a, input, select, textarea, label, .no-edit-trigger')) return;
    this.startEdit(i);
  }

  onPage(p: number): void {
    if (p < 1) return;
    this.page = p;
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
  }

  onPageSize(sz: number): void {
    this.pageSize = Number(sz) || this.pageSize;
    this.page = 1; // reset to first page when size changes
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
  }

  asBool(v: any): boolean {
    return typeof v === 'boolean' ? v : !!v?.enabled;
  }

  triggerExport(kind: 'pdf'|'excel') {
    this.export(kind);
  }

  isResponsiveEnabled(): boolean {
    const r = this.responsive;
    return r === true || (!!r && (r as NgbDataGridResponsiveOptions).enabled === true);
  }

  isRowSticky(row: T, pagedIndex: number): boolean {
    if (!this.stickyRows) return false;
    const di = this.data.indexOf(row);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    return this.stickyRowIds.has(id);
  }

  toggleStickyRow(pagedIndex: number): void {
    if (!this.stickyRows) return;
    const row = this.paged[pagedIndex];
    if (!row) return;
    const di = this.data.indexOf(row);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    if (this.stickyRowIds.has(id)) this.stickyRowIds.delete(id);
    else this.stickyRowIds.add(id);
  }

  stickyIcon(row: T, pagedIndex: number): string {
    return this.isRowSticky(row, pagedIndex) ? 'pin-angle-fill' : 'pin-fill';
  }

  stickyTop(row: T, pagedIndex: number): number | null {
    if (!this.isRowSticky(row, pagedIndex)) return null;
    const stickyBefore = this.paged
      .slice(0, pagedIndex)
      .filter((r, idx) => this.isRowSticky(r, idx)).length;
    return stickyBefore * this.stickyRowHeight;
  }

  // Selection helpers
  get stickyRowsEnabled(): boolean {
    return this.tableOptions?.stickyRows ?? this.stickyRows;
  }

  get stickyHeaderEnabled(): boolean {
    return this.tableOptions?.stickyHeader ?? this.stickyHeader;
  }

  get stickyFooterEnabled(): boolean {
    return this.tableOptions?.stickyFooter ?? this.stickyFooter;
  }

  isSelectionEnabled(): boolean {
    return this.selectionMode !== 'none';
  }

  isCheckboxOnly(): boolean {
    return this.selectionBehavior === 'checkbox';
  }

  isSelectionDisabled(row: T, pagedIndex: number): boolean {
    if (!this.selectionDisabledFn) return false;
    const di = this.data.indexOf(this.paged[pagedIndex]);
    return this.selectionDisabledFn(row, di >= 0 ? di : pagedIndex);
  }

  isRowSelected(row: T, pagedIndex: number): boolean {
    const di = this.data.indexOf(this.paged[pagedIndex]);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    return this.selectedRowIds.has(id);
  }

  toggleSelection(pagedIndex: number, event?: Event): void {
    if (!this.isSelectionEnabled()) return;
    const row = this.paged[pagedIndex];
    if (!row || this.isSelectionDisabled(row, pagedIndex)) return;

    const di = this.data.indexOf(row);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    const currentlySelected = this.selectedRowIds.has(id);
    const isMulti = this.selectionMode === 'multiple';
    const desktop = this.selectionKeyMode === 'desktop';
    const shift = desktop && !!(event && 'shiftKey' in event && (event as any).shiftKey);
    const meta = desktop && !!(event && (('metaKey' in event && (event as any).metaKey) || ('ctrlKey' in event && (event as any).ctrlKey)));

    if (!isMulti) {
      this.selectedRowIds.clear();
      this.selectedRowIds.add(id);
      this.selectionAnchor = pagedIndex;
      this.emitSelection(row, di, true);
      return;
    }

    if (shift && this.selectionAnchor != null) {
      const start = Math.min(this.selectionAnchor, pagedIndex);
      const end = Math.max(this.selectionAnchor, pagedIndex);
      this.selectedRowIds.clear();
      for (let i = start; i <= end; i++) {
        const r = this.paged[i];
        if (!r || this.isSelectionDisabled(r, i)) continue;
        const rid = this.getRowId(this.data.indexOf(r), r);
        this.selectedRowIds.add(rid);
      }
      this.emitSelection(row, di, true);
      return;
    }

    if (meta || !desktop) {
      if (currentlySelected) this.selectedRowIds.delete(id);
      else this.selectedRowIds.add(id);
    } else {
      this.selectedRowIds.clear();
      this.selectedRowIds.add(id);
    }

    this.selectionAnchor = pagedIndex;
    this.emitSelection(row, di, !currentlySelected || (!meta && desktop));
  }

  private emitSelection(row: T, dataIndex: number, selected: boolean) {
    this.selectionChange.emit({
      selected: this.data.filter((r, idx) => this.selectedRowIds.has(this.getRowId(idx, r))),
      lastAction: { row, index: dataIndex, selected }
    });
  }

  toggleSelectAllCurrentPage(): void {
    if (this.selectionMode !== 'multiple' || !this.selectAllEnabled) return;
    const allSelectable = this.paged.filter((r, i) => !this.isSelectionDisabled(r, i));
    const allSelected = allSelectable.every((r, i) => this.isRowSelected(r, i));
    if (allSelected) {
      allSelectable.forEach((r, i) => {
        const rid = this.getRowId(this.data.indexOf(r), r);
        this.selectedRowIds.delete(rid);
      });
    } else {
      allSelectable.forEach((r, i) => {
        const rid = this.getRowId(this.data.indexOf(r), r);
        this.selectedRowIds.add(rid);
      });
    }
    this.selectionChange.emit({
      selected: this.data.filter((r, idx) => this.selectedRowIds.has(this.getRowId(idx, r))),
      lastAction: null
    });
  }

  isPageAllSelected(): boolean {
    const selectable = this.paged.filter((r, i) => !this.isSelectionDisabled(r, i));
    return selectable.length > 0 && selectable.every((r, i) => this.isRowSelected(r, i));
  }

  isPageIndeterminate(): boolean {
    const selectable = this.paged.filter((r, i) => !this.isSelectionDisabled(r, i));
    const selectedCount = selectable.filter((r, i) => this.isRowSelected(r, i)).length;
    return selectedCount > 0 && selectedCount < selectable.length;
  }

  selectAllLabel(): string {
    const labels = this.selectionA11yLabels || {};
    return this.isPageAllSelected()
      ? (labels.unselectAll || 'Unselect all rows')
      : (labels.selectAll || 'Select all rows');
  }

  rowSelectionLabel(index: number): string {
    const labels = this.selectionA11yLabels || {};
    const selected = this.isRowSelected(this.paged[index], index);
    return selected
      ? (labels.unselectRow || `Unselect row ${index + 1}`)
      : (labels.selectRow || `Select row ${index + 1}`);
  }

  onRowSelect(ev: MouseEvent, pagedIndex: number) {
    if (!this.isSelectionEnabled() || this.isCheckboxOnly()) return;
    const target = ev.target as HTMLElement;
    if (target.closest('input, button, a, select, textarea,label')) return;
    this.toggleSelection(pagedIndex, ev);
  }

  onHeaderScroll(): void {
    const body = this.bodyScroller?.nativeElement;
    const head = this.headerScroller?.nativeElement;
    if (body && head && body.scrollLeft !== head.scrollLeft) {
      body.scrollLeft = head.scrollLeft;
    }
  }

  private syncScrollbarWidth(): void {
    const el = this.bodyScroller?.nativeElement;
    if (!el) return;
    const width = el.offsetWidth - el.clientWidth;
    if (width !== this.scrollbarWidth) {
      this.scrollbarWidth = width;
      this.cdr.markForCheck();
    }
  }

}
