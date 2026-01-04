import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output, inject, AfterContentInit, ContentChildren, QueryList, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
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

type SortDir = 'asc' | 'desc' | '';

type Key<T> = Extract<keyof T, string>;

type KeyOf<T> = Extract<keyof T, string>;

const MAX_EMAIL_LENGTH = 254;

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
  imports: [CommonModule, FormsModule, NgbPaginationComponent, ReactiveFormsModule],
  styleUrls: ['./datagrid.component.scss'],
  providers: [
    { provide: PdfExportAdapter, useClass: JsPdfAdapter },
    { provide: ExcelExportAdapter, useClass: XlsxAdapter }
  ],
  standalone:true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Datagrid<T = any> implements AfterContentInit, OnChanges {
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
    if (!this.enableSorting || !this.sort.active || !this.sort.direction) return this.filtered;
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

  get detailColspan(): number {
    const actionCols = (this.enableEdit || this.enableDelete) ? 1 : 0;
    const caretCol   = this.rowDetailTpl ? 1 : 0;
    return this.columns.length + actionCols + caretCol;
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

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['columns']) this.rebuildFilterForm();
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

}
