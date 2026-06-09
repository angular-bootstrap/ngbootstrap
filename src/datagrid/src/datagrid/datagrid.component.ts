import { Component, Input, EventEmitter, Output, inject, AfterContentInit, ContentChildren, QueryList, OnChanges, SimpleChanges, TemplateRef, ElementRef, ViewChild, ChangeDetectorRef, HostListener, ViewEncapsulation, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnDef, ColumnType } from '../models/column-def';
import {
  NgbDatagridPageableSettings,
  NgbDatagridPagerPosition,
  NgbDatagridPagerType,
  NGB_DATAGRID_DEFAULT_PAGEABLE,
  ngbResolvePageableSettings,
} from '../models/datagrid-pageable';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import {
  NgbCellTemplate,
  NgbEditorTemplate,
  NgbFilterTemplate,
  NgbFilterMenuTemplate,
  NgbGlobalFilterTemplate,
  NgbPagerTemplate,
  CellCtx,
  EditCtx,
  FilterCtx,
  PagerCtx,
} from '../directives/datagrid-templates.directive';
import { ContentChild } from '@angular/core';
import { NgbRowDetailTemplate } from '../directives/datagrid-templates.directive';
import { ngbResolvePagerPageSizeOptions } from '../../../pagination';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import {
  NgbColumnReorderEvent,
  NgbColumnReorderOptions,
  NgbDataGridState,
  NgbDataGridExportOptions,
  NgbDataGridProcessOptions,
  NgbDataGridTheme,
  NgbDataGridResponsiveOptions,
  NgbEditMode
} from '../datagrid.types';
import { ngbApplyDataGridOperations } from '../data-operations';
import { ExcelExportAdapter, NgbExportService, PdfExportAdapter } from '../services/export.services';
import { NgbDatagridDefaultEditService, NgbDatagridEditService, NgbDatagridTrackByFn } from '../services/editing.service';
import { JsPdfAdapter } from '../adapters/jsdf.adapter';
import { XlsxAdapter } from '../adapters/xlsx.adapter';

import { ExportButtonDirective, ExportButtonContext } from '../directives/export-button.directive';
import { NgbGridColumnDirective } from '../directives/grid-column.directive';
import { NgbDatagridAddRowComponent } from './components/datagrid-add-row.component';
import { NgbDatagridColgroupComponent } from './components/datagrid-colgroup.component';
import { NgbDatagridDataRowComponent } from './components/datagrid-data-row.component';
import { NgbDatagridDetailRowComponent } from './components/datagrid-detail-row.component';
import { NgbDatagridFooterComponent } from './components/datagrid-footer.component';
import { NgbDatagridHeaderComponent } from './components/datagrid-header.component';
import { NgbDatagridFilterMenuPanelComponent } from './components/datagrid-filter-menu-panel.component';
import { NgbDatagridRowFilterOperatorPanelComponent } from './components/datagrid-row-filter-operator-panel.component';
import { NgbDatagridToolbarComponent } from './components/datagrid-toolbar.component';
import { NgbDatagridEditingToolbarComponent } from './components/datagrid-editing-toolbar.component';
import { NgbDatagridExternalEditorComponent } from './components/datagrid-external-editor.component';
import { NgbGridHighlightDirective, HighlightItem } from './directives/grid-highlight.directive';
import { NgbSyncColgroupDirective } from './directives/colgroup-sync.directive';
import { NgbDndDropEvent, NgbDndListDirective } from '../../../drag-drop/src/directive/dnd-list.directive';
import { NgbDndItemDirective } from '../../../drag-drop/src/directive/dnd-item.directive';
import {
  NgbCompositeFilterDescriptor,
  NgbFilterDescriptor,
  NgbFilterable,
  NgbFilterMode,
  NgbFilterOperator,
  ngbAllowedFilterOperators,
  ngbColumnTypeToFilterType,
  ngbDefaultFilterOperator,
  ngbFilterOperatorLabel,
  ngbIsCompositeFilter,
  ngbSetFieldFilter,
  NgbMenuFilterConditionDraft
} from '../models/filtering';
import { NGB_DATAGRID_HOST } from '../layout-toolbar/datagrid-host.token';
import { NgbMultiCheckboxFilterOptions } from '../datagrid.types';
import {
  NGB_DATAGRID_DEFAULT_LABELS,
  NgbDatagridLabels,
  NgbDatagridTextDirection,
  ngbFormatDatagridLabel,
} from '../models/datagrid-labels';

type SortDir = 'asc' | 'desc' | '';

type Key<T> = Extract<keyof T, string>;

type KeyOf<T> = Extract<keyof T, string>;

const MAX_EMAIL_LENGTH = 254;
const SELECTION_COL_WIDTH = 48;
const DETAIL_COL_WIDTH = 48;
const STICKY_TOGGLE_COL_WIDTH = 48;
const ACTION_COL_WIDTH = 176;

type UtilityColumnKind = 'selection' | 'detail' | 'sticky-toggle' | 'actions';

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
  density?: 'comfortable' | 'compact';
  stacked?: boolean;
  /** `list` = single-column cards; `cards` = multi-column card rows (use `stackedGroup` on columns). */
  stackedLayout?: 'list' | 'cards';
  /** Alternating row backgrounds in the table body (Figma patient grid). */
  zebraStripes?: boolean;
}

/** Tabular columns vs adaptive stacked cards (`stacked` in {@link NgbTableOptions}). */
export type NgbDataLayoutMode = 'tabular' | 'stacked';

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
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbSyncColgroupDirective,
    NgbGridHighlightDirective,
    NgbDatagridToolbarComponent,
    NgbDatagridEditingToolbarComponent,
    NgbDatagridExternalEditorComponent,
    NgbDatagridColgroupComponent,
    NgbDatagridHeaderComponent,
    NgbDatagridFilterMenuPanelComponent,
    NgbDatagridRowFilterOperatorPanelComponent,
    NgbDatagridAddRowComponent,
    NgbDatagridDataRowComponent,
    NgbDatagridDetailRowComponent,
    NgbDatagridFooterComponent,
    NgbDndListDirective,
    NgbDndItemDirective
  ],
  styleUrls: ['./datagrid.component.scss'],
  providers: [
    { provide: PdfExportAdapter, useClass: JsPdfAdapter },
    { provide: ExcelExportAdapter, useClass: XlsxAdapter },
    { provide: NGB_DATAGRID_HOST, useExisting: forwardRef(() => Datagrid) },
  ],
  standalone:true
})
export class Datagrid<T = any> implements AfterContentInit, OnChanges {
  /** Column definitions to render */
  private _columns: ColumnDef<T>[] = [];
  @Input()
  get columns(): ColumnDef<T>[] {
    return this._columns;
  }
  set columns(value: ColumnDef<T>[] | null | undefined) {
    this._columns = value ?? [];
    this.invalidateColumnCaches();
    this.syncColumnWidthOverrides(true);
    this.syncColumnOrder(true);
  }

  /** Row data to display */
  private _data: T[] = [];
  @Input()
  get data(): T[] {
    return this._data;
  }
  set data(value: T[] | null | undefined) {
    this._data = value ?? [];
    this.invalidateDataCaches();
  }
  /**
   * When `true`, shows a loading overlay and sets `aria-busy` on the grid root.
   * Use while fetching remote data before assigning `[data]`.
   */
  @Input() loading = false;
  /**
   * Total record count for paging and range labels when using server-side data binding.
   * When set and greater than `data.length`, the grid treats `[data]` as the current page only
   * (no client-side page slicing). Omit for local in-memory arrays.
   */
  private _total: number | null = null;
  @Input()
  get total(): number | null {
    return this._total;
  }
  set total(value: number | null | undefined) {
    this._total = value ?? null;
    this.invalidatePagedCache();
  }
  private _enableSorting = false;
  @Input()
  get enableSorting(): boolean {
    return this._enableSorting;
  }
  set enableSorting(value: boolean) {
    this._enableSorting = value;
    this.invalidateSortedCaches();
    this.markGridForCheck();
  }
  private _enableFiltering = false;
  @Input()
  get enableFiltering(): boolean {
    return this._enableFiltering;
  }
  set enableFiltering(value: boolean) {
    this._enableFiltering = value;
    this.invalidateFilteredCaches();
    this.markGridForCheck();
  }
  private _filterable: NgbFilterable = false;
  @Input()
  get filterable(): NgbFilterable {
    return this._filterable;
  }
  set filterable(value: NgbFilterable | null | undefined) {
    this._filterable = value ?? false;
    this.invalidateFilteredCaches();
    this.markGridForCheck();
  }
  private _enableGlobalFilter = false;
  @Input()
  get enableGlobalFilter(): boolean {
    return this._enableGlobalFilter;
  }
  set enableGlobalFilter(value: boolean) {
    this._enableGlobalFilter = value;
    this.invalidateFilteredCaches();
    this.markGridForCheck();
  }
  private _filterMode: NgbFilterMode = 'row';
  @Input()
  get filterMode(): NgbFilterMode {
    return this._filterMode;
  }
  set filterMode(value: NgbFilterMode | null | undefined) {
    this._filterMode = value ?? 'row';
    this.markGridForCheck();
  }
  private _filter: NgbCompositeFilterDescriptor | null = null;
  @Input()
  get filter(): NgbCompositeFilterDescriptor | null {
    return this._filter;
  }
  set filter(value: NgbCompositeFilterDescriptor | null | undefined) {
    this._filter = value ?? null;
    this.localFilter = this.cloneComposite(this._filter);
    this.syncLegacyFilters(this.localFilter);
    this.invalidateFilteredCaches();
  }
  @Input() filterOperators?: Partial<Record<ColumnType, NgbFilterOperator[]>>;
  @Input() filterManual = false;
  @Input() externalFiltering = false;
  /** Opts local arrays into the reusable DataGrid operation helper for filter/sort/page processing. */
  private _dataOperations: boolean | NgbDataGridProcessOptions<T> = false;
  @Input()
  get dataOperations(): boolean | NgbDataGridProcessOptions<T> {
    return this._dataOperations;
  }
  set dataOperations(value: boolean | NgbDataGridProcessOptions<T> | null | undefined) {
    this._dataOperations = value ?? false;
    this.invalidatePagedCache();
  }
  /**
   * Optional controlled data-operation state. When provided, the grid syncs page, pageSize,
   * sort, filter, and global filter from this object.
   */
  private _state: NgbDataGridState | null = null;
  @Input()
  get state(): NgbDataGridState | null {
    return this._state;
  }
  set state(value: NgbDataGridState | null | undefined) {
    this._state = value ?? null;
    this.syncFromDataState(this._state);
  }
  /** Footer actions for the built-in multi-checkbox filter menu. */
  @Input() multiCheckboxFilterOptions: NgbMultiCheckboxFilterOptions = {};
  private _enablePagination = false;
  @Input()
  get enablePagination(): boolean {
    return this._enablePagination;
  }
  set enablePagination(value: boolean) {
    this._enablePagination = value;
    this.invalidatePagedCache();
  }
  /**
   * Pager configuration. `true` enables the pager with defaults; pass an object to customize.
   * When set, pagination is active even if `[enablePagination]` is false.
   */
  private _pageable: boolean | NgbDatagridPageableSettings = false;
  @Input()
  get pageable(): boolean | NgbDatagridPageableSettings {
    return this._pageable;
  }
  set pageable(value: boolean | NgbDatagridPageableSettings | null | undefined) {
    this._pageable = value ?? false;
    this.invalidatePagedCache();
  }
  @Input() enableEdit = false;
  @Input() enableDelete = false;
  /** @deprecated Prefer `pageable.pageSizes`. Kept for `[enablePagination]` compatibility. */
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  private _enableAdd = false;
  @Input()
  get enableAdd(): boolean {
    return this._enableAdd;
  }
  set enableAdd(value: boolean) {
    this._enableAdd = value;
    this.markGridForCheck();
  }
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
  /** Enables scroll table body container */
  @Input() scrollable = true;
  /** Row height used to stack multiple sticky rows without overlap (px). */
  @Input() stickyRowHeight = 40;
  /** Header height (px) used to offset sticky rows below the header. */
  @Input() stickyHeaderHeight = 40;
  /** Footer height (px) used to offset scrollable area. */
  @Input() stickyFooterHeight = 56;
  /** Bootstrap-like table styling options. */
  private _tableOptions: NgbTableOptions = {};
  @Input()
  get tableOptions(): NgbTableOptions {
    return this._tableOptions;
  }
  set tableOptions(value: NgbTableOptions | null | undefined) {
    this._tableOptions = value ?? {};
    this.invalidatePagedCache();
  }
  /**
   * When set, overrides `tableOptions.stacked` for layout mode.
   * Use `'stacked'` for card/label-value rows or `'tabular'` for the standard column grid.
   */
  @Input() dataLayoutMode: NgbDataLayoutMode | null = null;
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
  private _highlightedIndex: HighlightItem[] = [];
  @Input()
  get highlightedIndex(): HighlightItem[] {
    return this._highlightedIndex;
  }
  set highlightedIndex(value: HighlightItem[] | null | undefined) {
    this._highlightedIndex = value ?? [];
    this.updateHighlightCache();
  }
  /** Row key for highlighting. */
  @Input() highlightRowKey: NgbRowKey | null = null;
  /** Column key for highlighting. */
  @Input() highlightColKey: NgbColKey | null = null;
  /** Accessible label for the global filter input. */
  @Input() globalFilterAriaLabel = 'Search all columns';
  /** Placeholder for the built-in global search input. */
  @Input() globalFilterPlaceholder = 'Search all columns';
  /** When set, matching substrings in visible cells are wrapped with `.grid-search-highlight`. */
  @Input() searchHighlightTerm = '';
  /** Column fields included in search highlighting; all visible columns when empty. */
  @Input() searchHighlightFields: string[] | null = null;
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
  /** Row editing interaction: inline actions, in-cell, external dialog, or toolbar selection. */
  @Input() editMode: NgbEditMode = 'inline';
  /** Hint shown in toolbar editing mode when a row is selected. */
  @Input() toolbarEditHint = 'Row selected — click Edit to modify or Delete to remove';
  @Input() singleExpand = false;  // accordion mode: one row expanded at a time
  private _exportOptions: NgbDataGridExportOptions = {
    enabled: false,
    type: 'both',
    pages: 'current',
    fileName: 'export'
  };
  @Input()
  get exportOptions(): NgbDataGridExportOptions {
    return this._exportOptions;
  }
  set exportOptions(value: NgbDataGridExportOptions | null | undefined) {
    this._exportOptions = value ?? {
      enabled: false,
      type: 'both',
      pages: 'current',
      fileName: 'export'
    };
    this.markGridForCheck();
  }

  @Input() theme: NgbDataGridTheme = 'bootstrap';
  @Input() responsive: NgbDataGridResponsiveOptions | boolean = false;
  @Input() trackBy?: NgbDatagridTrackByFn<T>;
  @Input() rowClass?: string | string[] | Record<string, boolean> | ((row: T, rowIndex: number) => string | string[] | Record<string, boolean>);
  @Input() rowStyle?: Record<string, string | number> | ((row: T, rowIndex: number) => Record<string, string | number> | null | undefined);
  @Input() rowReorderable = false;
  private _columnReorderable = false;
  @Input()
  get columnReorderable(): boolean {
    return this._columnReorderable;
  }
  set columnReorderable(value: boolean) {
    this._columnReorderable = value;
    this.markGridForCheck();
  }
  /** Enables drag-to-resize on column headers (requires explicit column widths). */
  private _resizable = false;
  @Input()
  get resizable(): boolean {
    return this._resizable;
  }
  set resizable(value: boolean) {
    this._resizable = value;
    this.markGridForCheck();
  }
  /** Render row actions as icon-only square buttons (Figma editing screen). */
  @Input() actionDisplay: 'text' | 'icons' = 'text';
  /** Show a STICKY badge on the configured column when a row is pinned. */
  @Input() showStickyRowBadge = false;
  @Input() stickyRowBadgeField: string | null = null;
  @Input() stickyRowBadgeLabel = 'STICKY';
  /** Localized strings for built-in UI; individual aria/text inputs override matching keys. */
  @Input() labels: NgbDatagridLabels = {};
  /** BCP 47 locale for pagination range and number formatting (e.g. `en-US`, `ar-SA`). */
  @Input() locale: string | null = null;
  /** Text direction on the grid root; `auto` inherits from document or parent `dir`. */
  @Input() dir: NgbDatagridTextDirection = 'auto';
  /** Enables arrow-key cell focus, Space selection, Alt+Page paging, and F3 filter shortcuts. */
  @Input() keyboardNavigation = true;
  @Input() editService?: NgbDatagridEditService<T>;

  // Data hooks for export
  @Input() dataProviderAll?: () => Observable<any[]> | Promise<any[]> | any[]; // used when pages='all'
  @Input() dataProviderSelection?: () => any[]; // used when pages='selection'
  
  // Grab the directive and its TemplateRef
  @ContentChild(ExportButtonDirective) exportButtonDir?: ExportButtonDirective;
  @ViewChild('bodyScroller') bodyScroller?: ElementRef<HTMLElement>;
  @ViewChild('headerScroller') headerScroller?: ElementRef<HTMLElement>;
  private hostEl = inject(ElementRef<HTMLElement>);
  colgroupSyncId = `dg-col-${Math.random().toString(36).slice(2, 8)}`;
  private columnWidthOverrides: Record<string, number> = {};
  private resizeSession: { field: string; startX: number; startWidth: number } | null = null;
  private columnOrder: string[] = [];
  columnDragField: string | null = null;
  columnDragOverIndex: number | null = null;

  exporting = false;
  
  @Output() rowAdd = new EventEmitter<{ newRow: T }>();

  //  events
  @Output() rowEdit = new EventEmitter<{ row: T; index: number }>();
  @Output() rowSave = new EventEmitter<{ original: T; updated: T; index: number }>();
  @Output() rowCancel = new EventEmitter<{ row: T; index: number }>();
  @Output() rowDelete = new EventEmitter<{ row: T; index: number }>();

  @Output() sortChange = new EventEmitter<{ active: string | null; direction: 'asc' | 'desc' | '' }>();
  @Output() filterChange = new EventEmitter<NgbCompositeFilterDescriptor>();
  @Output() filtersChange = new EventEmitter<{ global: string; columns: Record<string, string> }>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();
  @Output() dataStateChange = new EventEmitter<NgbDataGridState>();
  @Output() selectionChange = new EventEmitter<{ selected: T[]; lastAction: { row: T; index: number; selected: boolean } | null }>();
  @Output() rowReorder = new EventEmitter<{ row: T; fromIndex: number; toIndex: number; data: T[] }>();
  @Output() columnReorder = new EventEmitter<NgbColumnReorderEvent<ColumnDef<T>>>();

  @ContentChild(NgbRowDetailTemplate) rowDetailTpl?: NgbRowDetailTemplate<T>;
  @ContentChild(NgbPagerTemplate) pagerTpl?: NgbPagerTemplate<T>;
  private exporter = inject(NgbExportService); // instead of constructor(private exporter: NgbExportService) {}

  expanded: Set<number> = new Set<number>();

  private fb = inject(FormBuilder);

  public filterForm: FormGroup = this.fb.group({});
  public globalFilterCtrl = new FormControl<string>('', { nonNullable: true });

  addingNew = false;
  draftNew: Partial<Record<KeyOf<T>, any>> | null = null;
  errorsNew: Partial<Record<KeyOf<T>, string>> = {};
  // --- sorting (from previous step)
  private _sort: { active: Extract<keyof T, string> | null; direction: SortDir } = { active: null, direction: '' };
  get sort(): { active: Extract<keyof T, string> | null; direction: SortDir } {
    return this._sort;
  }
  set sort(value: { active: Extract<keyof T, string> | null; direction: SortDir } | null | undefined) {
    this._sort = value ?? { active: null, direction: '' };
    this.invalidateSortedCaches();
  }
  stickyRowIds: Set<any> = new Set<any>();
  selectedRowIds: Set<any> = new Set<any>();
  private selectionAnchor: number | null = null;
  private highlightRowMap: Map<any, HighlightItem[]> = new Map();
  // --- filtering
  private _globalFilter = '';
  get globalFilter(): string {
    return this._globalFilter;
  }
  set globalFilter(value: string | null | undefined) {
    this._globalFilter = value ?? '';
    this.invalidateFilteredCaches();
  }
  private _filters: Record<string, string> = {};
  get filters(): Record<string, string> {
    return this._filters;
  }
  set filters(value: Record<string, string> | null | undefined) {
    this._filters = value ?? {};
    this.invalidateFilteredCaches();
  }
  private _localFilter: NgbCompositeFilterDescriptor = { logic: 'and', filters: [] };
  get localFilter(): NgbCompositeFilterDescriptor {
    return this._localFilter;
  }
  set localFilter(value: NgbCompositeFilterDescriptor | null | undefined) {
    this._localFilter = value ?? { logic: 'and', filters: [] };
    this.invalidateFilteredCaches();
  }
  openFilterMenuField: string | null = null;
  openFilterMenuAnchor: HTMLElement | null = null;
  openRowFilterField: string | null = null;
  openRowFilterOperatorAnchor: HTMLElement | null = null;
  openMenuOperatorField: string | null = null;
  menuDrafts: Record<string, NgbMenuFilterConditionDraft[]> = {};
  /** Join logic between conditions in a column filter menu (And / Or). */
  menuDraftJoinLogic: Record<string, 'and' | 'or'> = {};
  multiCheckboxDrafts: Record<string, any[]> = {};
  multiCheckboxSearch: Record<string, string> = {};
  private syncingFilterForm = false;
  private _page = 1;
  get page(): number {
    return this._page;
  }
  set page(value: number | null | undefined) {
    const next = Math.max(1, Math.trunc(Number(value) || 1));
    this._page = next;
    this.invalidatePagedCache();
  }
  private _pageSize = 10;
  @Input()
  get pageSize(): number {
    return this._pageSize;
  }
  set pageSize(value: number | null | undefined) {
    this._pageSize = Math.max(1, Math.trunc(Number(value) || 10));
    this.invalidatePagedCache();
  }

  /** Inline / in-cell editing state */
  editingIndex: number | null = null; // index in `paged` view
  editingCell: { rowIndex: number; field: string } | null = null;
  /** Roving keyboard focus within the current page (data cells). */
  focusedCell: { rowIndex: number; colIndex: number } | null = null;
  /** Screen-reader status updates (sort, page, selection). */
  statusMessage = '';
  editForm: FormGroup = this.fb.group({});
  saveAttemptedEdit = false;

  /** External dialog editing state */
  externalEditOpen = false;
  externalEditIsNew = false;
  externalEditPagedIndex: number | null = null;
  externalForm: FormGroup = this.fb.group({});
  saveAttemptedExternal = false;
  private externalDialogOpener: HTMLElement | null = null;
  private externalDialogFocusedOnce = false;

  addForm:  FormGroup = this.fb.group({});
  saveAttemptedNew = false;
  private addDraftRowId: any = null;

  private readonly defaultEditService = new NgbDatagridDefaultEditService<T>();
  private cdr = inject(ChangeDetectorRef);
  private resolvedColumnsCache: ColumnDef<T>[] = [];
  private visibleColumnsCache: ColumnDef<T>[] = [];
  private filteredCache: T[] = [];
  private sortedCache: T[] = [];
  private pagedCache: T[] = [];
  private resolvedColumnsDirty = true;
  private visibleColumnsDirty = true;
  private filteredDirty = true;
  private sortedDirty = true;
  private pagedDirty = true;
  private rowIndexMap = new Map<any, number>();
  private rowIndexMapSource: T[] | null = null;

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
    const sampleRow = (row ?? {}) as T;
    const isNew = !row || !Object.keys(row).length;
    for (const col of this.resolvedColumns) {
      if (!this.isCellEditable(col, sampleRow, isNew)) continue;
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

  get gridHost(): this {
    return this;
  }

  get declarativeColumns(): ColumnDef<T>[] {
    return this.gridColumnQ?.toArray().map((col) => col.toColumnDef()) ?? [];
  }

  get resolvedColumns(): ColumnDef<T>[] {
    if (this.resolvedColumnsDirty) {
      const declarative = this.declarativeColumns;
      if (declarative.length) {
        if (this.columns?.length && !this.warnedDeclarativeColumns) {
          console.warn('ngb-datagrid: declarative columns take precedence over the columns input.');
          this.warnedDeclarativeColumns = true;
        }
        this.resolvedColumnsCache = declarative;
      } else {
        this.resolvedColumnsCache = this.columns ?? [];
      }
      this.resolvedColumnsDirty = false;
    }
    return this.resolvedColumnsCache;
  }

  get visibleColumns(): ColumnDef<T>[] {
    if (this.visibleColumnsDirty) {
      const visible = this.resolvedColumns.filter((col) => !col.hidden);
      const byField = new Map(visible.map((col) => [col.field as string, col]));
      const order = this.columnOrder.length
        ? this.columnOrder.filter((field) => byField.has(field))
        : visible.map((col) => col.field as string);
      const seen = new Set(order);
      for (const col of visible) {
        const field = col.field as string;
        if (!seen.has(field)) {
          order.push(field);
          seen.add(field);
        }
      }
      this.visibleColumnsCache = order.map((field) => byField.get(field)!).filter(Boolean);
      this.visibleColumnsDirty = false;
    }
    return this.visibleColumnsCache;
  }

  private invalidateColumnCaches(): void {
    this.resolvedColumnsDirty = true;
    this.visibleColumnsDirty = true;
    this.invalidateFilteredCaches();
  }

  private invalidateFilteredCaches(): void {
    this.filteredDirty = true;
    this.invalidateSortedCaches();
  }

  private invalidateSortedCaches(): void {
    this.sortedDirty = true;
    this.invalidatePagedCache();
  }

  private invalidatePagedCache(): void {
    this.pagedDirty = true;
  }

  private invalidateDataCaches(): void {
    this.rowIndexMapSource = null;
    this.invalidateFilteredCaches();
  }

  private markGridForCheck(): void {
    this.cdr?.markForCheck();
  }

  private ensureRowIndexMap(): void {
    if (this.rowIndexMapSource === this.data) return;
    this.rowIndexMap.clear();
    (this.data ?? []).forEach((row, index) => this.rowIndexMap.set(row, index));
    this.rowIndexMapSource = this.data;
  }

  private dataIndexOf(row: T, fallback = -1): number {
    this.ensureRowIndexMap();
    return this.rowIndexMap.get(row) ?? fallback;
  }

  private syncColumnOrder(resetFromColumns: boolean): void {
    const visible = this.resolvedColumns.filter((col) => !col.hidden);
    const fields = new Set(visible.map((col) => col.field as string));
    if (resetFromColumns || !this.columnOrder.length) {
      this.columnOrder = visible.map((col) => col.field as string);
      return;
    }
    const next = this.columnOrder.filter((field) => fields.has(field));
    for (const col of visible) {
      const field = col.field as string;
      if (!next.includes(field)) next.push(field);
    }
    this.columnOrder = next;
  }

  isColumnReorderEnabled(): boolean {
    if (!this.columnReorderable || this.isStackedLayout()) return false;
    if (this.visibleColumns.some((col) => col.locked || this.isColumnPinned(col))) return false;
    return true;
  }

  isColumnReorderable(col: ColumnDef<T>): boolean {
    if (!this.isColumnReorderEnabled()) return false;
    if (col.reorderable === false || col.locked) return false;
    if (this.isColumnPinned(col)) return false;
    return true;
  }

  onColumnDragStart(event: DragEvent, col: ColumnDef<T>, fromIndex: number): void {
    if (!this.isColumnReorderable(col)) {
      event.preventDefault();
      return;
    }
    this.columnDragField = col.field as string;
    this.columnDragOverIndex = fromIndex;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', this.columnDragField);
    }
  }

  onColumnDragOver(event: DragEvent, toIndex: number): void {
    if (!this.columnReorderable || !this.columnDragField) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.columnDragOverIndex = toIndex;
    this.cdr.markForCheck();
  }

  onColumnDragLeave(event: DragEvent, index: number): void {
    if (this.columnDragOverIndex === index) {
      const related = event.relatedTarget as Node | null;
      const current = event.currentTarget as HTMLElement | null;
      if (current && related && current.contains(related)) return;
      this.columnDragOverIndex = null;
      this.cdr.markForCheck();
    }
  }

  onColumnDrop(event: DragEvent, toIndex: number): void {
    if (!this.columnReorderable || !this.columnDragField) return;
    event.preventDefault();
    const fromIndex = this.visibleColumns.findIndex((col) => col.field === this.columnDragField);
    this.moveColumn(fromIndex, toIndex);
    this.onColumnDragEnd();
  }

  onColumnDragEnd(): void {
    this.columnDragField = null;
    this.columnDragOverIndex = null;
    this.cdr.markForCheck();
  }

  /**
   * Reorders a visible column relative to another visible column index.
   * Only columns that pass {@link isColumnReorderable} can be moved.
   */
  reorderColumn(
    column: ColumnDef<T> | Extract<keyof T, string>,
    destinationIndex: number,
    options?: NgbColumnReorderOptions,
    emit = true
  ): void {
    if (!this.isColumnReorderEnabled()) return;
    const field = typeof column === 'string' ? column : (column.field as string);
    const cols = this.visibleColumns;
    const fromIndex = cols.findIndex((col) => col.field === field);
    if (fromIndex < 0 || destinationIndex < 0 || destinationIndex >= cols.length) return;

    const insertAfter = options?.before === false;
    let toIndex = insertAfter ? destinationIndex + 1 : destinationIndex;
    toIndex = Math.max(0, Math.min(toIndex, cols.length - 1));
    if (fromIndex === toIndex) return;

    this.moveColumn(fromIndex, toIndex, emit);
  }

  moveColumn(fromIndex: number, toIndex: number, emit = true): void {
    if (!this.isColumnReorderEnabled()) return;
    const cols = this.visibleColumns;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= cols.length || toIndex >= cols.length) return;
    if (fromIndex === toIndex) return;

    const fromCol = cols[fromIndex];
    if (!fromCol || !this.isColumnReorderable(fromCol)) return;

    const movingField = fromCol.field as string;
    const reorderableFields = cols
      .filter((col) => this.isColumnReorderable(col))
      .map((col) => col.field as string);
    const fromReorderIndex = reorderableFields.indexOf(movingField);
    if (fromReorderIndex < 0) return;

    let toReorderIndex = 0;
    let reorderableSeen = 0;
    for (let i = 0; i < cols.length; i++) {
      if (i === toIndex) {
        toReorderIndex = reorderableSeen;
        break;
      }
      if (this.isColumnReorderable(cols[i])) reorderableSeen++;
    }

    const nextReorderable = [...reorderableFields];
    nextReorderable.splice(fromReorderIndex, 1);
    nextReorderable.splice(toReorderIndex, 0, movingField);

    const order: string[] = [];
    let reorderCursor = 0;
    for (const col of cols) {
      if (!this.isColumnReorderable(col)) {
        order.push(col.field as string);
      } else {
        order.push(nextReorderable[reorderCursor++]);
      }
    }

    this.columnOrder = order;
    this.visibleColumnsDirty = true;
    const column = this.resolvedColumns.find((col) => col.field === movingField);
    const toIndexResolved = order.indexOf(movingField);
    if (emit && column) {
      this.columnReorder.emit({
        columns: this.visibleColumns.map((col) => ({ ...col })),
        column,
        fromIndex,
        toIndex: toIndexResolved,
        fields: [...order],
      });
    }
    this.syncResizableColgroups();
    this.cdr.markForCheck();
  }

  private validateColumnConfig(): void {
    const columns = this.resolvedColumns;
    const seenFields = new Set<string>();
    const duplicates = new Set<string>();
    columns.forEach((col) => {
      const field = `${col.field ?? ''}`;
      if (seenFields.has(field)) duplicates.add(field);
      seenFields.add(field);
    });
    if (duplicates.size) {
      throw new Error(`ngb-datagrid: duplicate column field(s): ${Array.from(duplicates).join(', ')}`);
    }

    const visible = this.visibleColumns;
    const hasPinned = visible.some((col) => this.isColumnPinned(col));
    if (!hasPinned) return;

    if (this.rowDetailTpl) {
      throw new Error('ngb-datagrid: detail rows are not supported with sticky or locked columns.');
    }

    const missingWidth = visible.filter((col) => !this.columnWidth(col) || this.columnWidth(col) <= 0);
    if (missingWidth.length) {
      throw new Error(`ngb-datagrid: sticky/locked columns require explicit width for all visible columns. Missing width on: ${missingWidth.map((col) => col.field).join(', ')}`);
    }

    if (this.resizable && !this.isStackedLayout()) {
      const missingResizableWidth = visible.filter((col) => !this.columnWidth(col) || this.columnWidth(col) <= 0);
      if (missingResizableWidth.length) {
        throw new Error(
          `ngb-datagrid: resizable columns require explicit width for all visible columns. Missing width on: ${missingResizableWidth.map((col) => col.field).join(', ')}`
        );
      }
    }

    if (visible.some((col) => col.locked) && !visible.some((col) => !col.locked)) {
      throw new Error('ngb-datagrid: at least one unlocked visible column is required when locked columns are used.');
    }

    let phase: 'leading' | 'middle' | 'trailing' = 'leading';
    visible.forEach((col) => {
      const side = this.columnOrderGroup(col);
      if (side === 'leading') {
        if (phase !== 'leading') {
          throw new Error('ngb-datagrid: start sticky/locked columns must appear before unlocked columns.');
        }
        return;
      }
      if (side === 'trailing') {
        phase = 'trailing';
        return;
      }
      if (phase === 'trailing') {
        throw new Error('ngb-datagrid: end sticky columns must appear after unlocked columns.');
      }
      phase = 'middle';
    });
  }

  isFilteringEnabled(): boolean {
    return ((this.filterable !== false && this.filterable !== 'none') || this.enableFiltering);
  }

  resolvedFilterMode(): NgbFilterMode {
    if (this.filterable === 'row' || this.filterable === 'menu' || this.filterable === 'multi' || this.filterable === 'none') {
      return this.filterable;
    }
    if (this.filterable === true) return 'row';
    return this.filterMode;
  }

  get filtered(): T[] {
    if (this.filteredDirty) {
      const src = this.data ?? [];
      const global = this.currentGlobalFilter();
      const filtering = this.isFilteringEnabled();
      const globalOnly = this.enableGlobalFilter && !filtering;

      if (!filtering && !globalOnly) {
        this.filteredCache = src;
      } else if (this.filterManual || this.externalFiltering) {
        this.filteredCache = src;
      } else {
        const descriptor = filtering ? this.effectiveFilterDescriptor() : { logic: 'and' as const, filters: [] };
        const resolvedColumns = this.resolvedColumns;
        this.filteredCache = src.filter((row) => {
          const matchesComposite = !descriptor.filters.length || this.matchesComposite(row, descriptor);
          if (!matchesComposite) return false;
          if (!global) return true;
          return resolvedColumns.some((column) => this.norm((row as any)?.[column.field]).includes(global));
        });
      }
      this.filteredDirty = false;
    }
    return this.filteredCache;
  }

  private effectiveFilterDescriptor(): NgbCompositeFilterDescriptor {
    const base = this.filter ?? this.localFilter;
    if (base?.filters?.length) return base;
    return this.legacyFilterDescriptor();
  }

  private legacyFilterDescriptor(): NgbCompositeFilterDescriptor {
    const filters = this.resolvedColumns
      .filter((col) => col.filterable && this.norm(this.filters[col.field as string]))
      .map((col) => ({
        field: col.field as string,
        operator: 'contains' as NgbFilterOperator,
        value: this.filters[col.field as string],
        ignoreCase: true
      }));
    return { logic: 'and', filters };
  }

  private currentGlobalFilter(): string {
    return this.norm(this.globalFilter || this.globalFilterCtrl.value);
  }

  private matchesComposite(row: T, descriptor: NgbCompositeFilterDescriptor): boolean {
    if (!descriptor.filters.length) return true;
    const results = descriptor.filters.map((filter) =>
      ngbIsCompositeFilter(filter) ? this.matchesComposite(row, filter) : this.matchesDescriptor(row, filter)
    );
    return descriptor.logic === 'or' ? results.some(Boolean) : results.every(Boolean);
  }

  private matchesDescriptor(row: T, descriptor: NgbFilterDescriptor): boolean {
    const column = this.resolvedColumns.find((col) => col.field === descriptor.field);
    const filterType = this.getColumnFilterType(column);
    const cellValue = this.normalizeFilterValue((row as any)?.[descriptor.field], filterType);
    const compareValue = this.normalizeFilterValue(descriptor.value, filterType);
    const ignoreCase = descriptor.ignoreCase ?? (filterType === 'text' || filterType === 'select');

    if (descriptor.operator === 'isnull') return cellValue == null;
    if (descriptor.operator === 'isnotnull') return cellValue != null;
    if (descriptor.operator === 'isempty') return cellValue === '';
    if (descriptor.operator === 'isnotempty') return cellValue !== '' && cellValue != null;

    if (filterType === 'numeric' || filterType === 'date') {
      const left = cellValue as number | null;
      const right = compareValue as number | null;
      if (left == null || right == null) return false;
      switch (descriptor.operator) {
        case 'eq': return left === right;
        case 'neq': return left !== right;
        case 'gt': return left > right;
        case 'gte': return left >= right;
        case 'lt': return left < right;
        case 'lte': return left <= right;
        default: return false;
      }
    }

    if (filterType === 'boolean') {
      switch (descriptor.operator) {
        case 'eq': return cellValue === compareValue;
        case 'neq': return cellValue !== compareValue;
        default: return false;
      }
    }

    const left = cellValue == null ? '' : String(cellValue);
    const right = compareValue == null ? '' : String(compareValue);
    const normalizedLeft = ignoreCase ? left.toLowerCase() : left;
    const normalizedRight = ignoreCase ? right.toLowerCase() : right;

    switch (descriptor.operator) {
      case 'contains': return normalizedLeft.includes(normalizedRight);
      case 'doesnotcontain': return !normalizedLeft.includes(normalizedRight);
      case 'eq': return normalizedLeft === normalizedRight;
      case 'neq': return normalizedLeft !== normalizedRight;
      case 'startswith': return normalizedLeft.startsWith(normalizedRight);
      case 'endswith': return normalizedLeft.endsWith(normalizedRight);
      default: return false;
    }
  }

  private normalizeFilterValue(value: any, filterType: ReturnType<Datagrid<T>['getColumnFilterType']>): any {
    if (value === '' || value === undefined) return null;
    if (value === null) return null;
    switch (filterType) {
      case 'numeric': {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      }
      case 'date': {
        const parsed = Date.parse(String(value));
        return Number.isNaN(parsed) ? null : parsed;
      }
      case 'boolean':
        if (value === 'true') return true;
        if (value === 'false') return false;
        return !!value;
      default:
        return String(value);
    }
  }

  getColumnFilterType(col?: ColumnDef<T>): 'text' | 'numeric' | 'boolean' | 'date' | 'select' {
    return col?.filterType ?? ngbColumnTypeToFilterType(col?.type);
  }

  isMultiCheckboxMode(col: ColumnDef<T>): boolean {
    return this.isFilteringEnabled() && this.resolvedFilterMode() === 'multi' && !!col.filterable;
  }

  getAllowedOperators(col: ColumnDef<T>): NgbFilterOperator[] {
    if (col.allowedFilterOperators?.length) return col.allowedFilterOperators;
    const typeOperators = this.filterOperators?.[col.type ?? 'text'];
    if (typeOperators?.length) return typeOperators;
    return ngbAllowedFilterOperators(this.getColumnFilterType(col));
  }

  defaultFilterOperator(col: ColumnDef<T>): NgbFilterOperator {
    const allowed = this.getAllowedOperators(col);
    const explicit = col.defaultFilterOperator;
    if (explicit === '') {
      return allowed[0] ?? ngbDefaultFilterOperator(this.getColumnFilterType(col));
    }
    if (explicit) return explicit;
    return ngbDefaultFilterOperator(this.getColumnFilterType(col));
  }

  rowFilterOperator(col: ColumnDef<T>): NgbFilterOperator {
    const field = col.field as string;
    const raw = this.filterForm?.get(this.operatorControlName(field))?.value as NgbFilterOperator | '' | null | undefined;
    if (raw === '' || raw == null) {
      return this.defaultFilterOperator(col);
    }
    return raw;
  }

  operatorLabel(operator: NgbFilterOperator): string {
    const labels: Record<NgbFilterOperator, string> = {
      contains: 'Contains',
      doesnotcontain: 'Does not contain',
      eq: 'Equals',
      neq: 'Does not equal',
      startswith: 'Starts with',
      endswith: 'Ends with',
      gt: 'Greater than',
      gte: 'Greater than or equal',
      lt: 'Less than',
      lte: 'Less than or equal',
      isnull: 'Is null',
      isnotnull: 'Is not null',
      isempty: 'Is empty',
      isnotempty: 'Is not empty'
    };
    return labels[operator];
  }

  rowFilterOperatorLabel(col: ColumnDef<T>, operator: NgbFilterOperator): string {
    return ngbFilterOperatorLabel(operator, this.getColumnFilterType(col));
  }

  rowFilterMenuTitle(col: ColumnDef<T>): string {
    const filterType = this.getColumnFilterType(col);
    switch (filterType) {
      case 'numeric': return 'Number filter';
      case 'date': return 'Date filter';
      case 'boolean': return 'Boolean filter';
      case 'select': return 'Select filter';
      default: return 'String filter';
    }
  }

  rowFilterPlaceholder(col: ColumnDef<T>): string {
    if (col.filterPlaceholder) return col.filterPlaceholder;
    const filterType = this.getColumnFilterType(col);
    const header = String(col.header ?? '').trim().toLowerCase();
    if (filterType === 'date') return 'dd/mm/yyyy';
    if (filterType === 'numeric') return `Filter by ${header}...`;
    if (filterType === 'text' || filterType === 'select') return `Filter by ${header}...`;
    return '';
  }

  isSearchHighlightEnabled(): boolean {
    return !!this.norm(this.searchHighlightTerm);
  }

  shouldHighlightSearchInColumn(field: string): boolean {
    if (!this.isSearchHighlightEnabled()) return false;
    const fields = this.searchHighlightFields;
    if (!fields?.length) return true;
    return fields.includes(field);
  }

  formatCellDisplayValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  getSearchHighlightSegments(value: unknown, field: string): Array<{ text: string; match: boolean }> {
    const display = this.formatCellDisplayValue(value);
    if (!this.shouldHighlightSearchInColumn(field)) {
      return [{ text: display, match: false }];
    }

    const term = this.norm(this.searchHighlightTerm);
    if (!term || !display) return [{ text: display, match: false }];

    const normalizedDisplay = this.norm(display);
    const segments: Array<{ text: string; match: boolean }> = [];
    let cursor = 0;

    while (cursor < display.length) {
      const slice = display.slice(cursor);
      const normalizedSlice = this.norm(slice);
      const matchIndex = normalizedSlice.indexOf(term);
      if (matchIndex < 0) {
        segments.push({ text: display.slice(cursor), match: false });
        break;
      }

      const start = cursor + matchIndex;
      const end = start + term.length;
      if (start > cursor) {
        segments.push({ text: display.slice(cursor, start), match: false });
      }
      segments.push({ text: display.slice(start, end), match: true });
      cursor = end;
    }

    return segments.length ? segments : [{ text: display, match: false }];
  }

  rowFilterEmptyOptionLabel(col: ColumnDef<T>): string {
    return this.getColumnFilterType(col) === 'boolean' ? '(All)' : 'Select';
  }

  booleanFilterOptionLabel(value: boolean): string {
    return value ? 'Yes' : 'No';
  }

  isRowFilterMenuOpen(field: string): boolean {
    return this.openRowFilterField === field;
  }

  get openRowFilterColumn(): ColumnDef<T> | null {
    if (!this.openRowFilterField) return null;
    return this.resolvedColumns.find((item) => item.field === this.openRowFilterField) ?? null;
  }

  toggleRowFilterMenu(field: string, anchor?: HTMLElement | null): void {
    if (this.openRowFilterField === field) {
      this.openRowFilterField = null;
      this.openRowFilterOperatorAnchor = null;
      this.cdr.markForCheck();
      return;
    }
    this.closeFilterMenu();
    this.openRowFilterField = field;
    this.openRowFilterOperatorAnchor = this.resolveFilterMenuAnchor(anchor);
    this.cdr.markForCheck();
  }

  setRowFilterOperator(col: ColumnDef<T>, operator: NgbFilterOperator): void {
    const field = col.field as string;
    this.filterForm.get(this.operatorControlName(field))?.setValue(operator);
    const value = this.filterForm.get(this.valueControlName(field))?.value;
    if (!this.operatorRequiresValue(operator) || !(value === null || value === undefined || value === '')) {
      this.applyRowFilter(col);
    }
    this.openRowFilterField = null;
    this.openRowFilterOperatorAnchor = null;
    this.cdr.markForCheck();
  }

  operatorRequiresValue(operator: NgbFilterOperator): boolean {
    return !['isnull', 'isnotnull', 'isempty', 'isnotempty'].includes(operator);
  }

  isRowFilterVisible(col: ColumnDef<T>): boolean {
    if (!col.filterable || !this.isFilteringEnabled()) return false;
    if (col.showFilterRow != null) return col.showFilterRow;
    return this.resolvedFilterMode() === 'row';
  }

  isRowFilterOperatorVisible(col: ColumnDef<T>): boolean {
    if (!this.isRowFilterVisible(col)) return false;
    if (this.getColumnFilterType(col) === 'boolean') return false;
    return col.showFilterOperator !== false;
  }

  isMenuFilterVisible(col: ColumnDef<T>): boolean {
    if (!col.filterable || !this.isFilteringEnabled()) return false;
    if (col.showFilterMenu != null) return col.showFilterMenu;
    return this.resolvedFilterMode() === 'menu' || this.resolvedFilterMode() === 'multi';
  }

  getColumnFilter(field: string): NgbFilterDescriptor | null {
    const descriptor = this.effectiveFilterDescriptor().filters.find(
      (filter): filter is NgbFilterDescriptor => !ngbIsCompositeFilter(filter) && filter.field === field
    );
    return descriptor ?? null;
  }

  hasActiveColumnFilter(field: string): boolean {
    return !!this.findFieldFilter(field);
  }

  private findFieldFilter(field: string): NgbFilterDescriptor | NgbCompositeFilterDescriptor | null {
    const found = this.effectiveFilterDescriptor().filters.find((filter) => {
      if (ngbIsCompositeFilter(filter)) {
        return filter.filters.every((item) => !ngbIsCompositeFilter(item) && item.field === field);
      }
      return filter.field === field;
    });
    return found ?? null;
  }

  private withoutFieldFilters(filters: Array<NgbFilterDescriptor | NgbCompositeFilterDescriptor>, field: string) {
    return filters.filter((filter) => {
      if (ngbIsCompositeFilter(filter)) {
        return !filter.filters.every((item) => !ngbIsCompositeFilter(item) && item.field === field);
      }
      return filter.field !== field;
    });
  }

  private upsertColumnFilter(
    field: string,
    operator: NgbFilterOperator,
    value: any,
    emit = true
  ): void {
    const base = this.cloneComposite(this.filter ?? this.localFilter);
    this.commitFilter(
      ngbSetFieldFilter(base, field, operator, value, {
        requiresValue: (op) => this.operatorRequiresValue(op)
      }),
      emit
    );
  }

  clearColumnFilter(field: string, emit = true): void {
    const next = this.cloneComposite(this.filter ?? this.localFilter);
    next.filters = this.withoutFieldFilters(next.filters, field);
    this.commitFilter(next, emit);
    this.setFilterFormField(field, this.defaultFilterOperator(this.resolvedColumns.find((col) => col.field === field)!), '');
    delete this.multiCheckboxDrafts[field];
    delete this.multiCheckboxSearch[field];
    if (this.openRowFilterField === field) {
      this.openRowFilterField = null;
      this.openRowFilterOperatorAnchor = null;
    }
  }

  clearAllFilters(emit = true): void {
    this.localFilter = { logic: 'and', filters: [] };
    this.filters = {};
    this.globalFilter = '';
    this.globalFilterCtrl.setValue('', { emitEvent: false });
    this.menuDrafts = {};
    this.menuDraftJoinLogic = {};
    this.multiCheckboxDrafts = {};
    this.multiCheckboxSearch = {};
    this.closeFilterMenu();
    this.openRowFilterField = null;
    this.openRowFilterOperatorAnchor = null;
    this.syncFilterFormFromState();
    this.page = 1;
    this.invalidateFilteredCaches();
    if (emit) {
      this.filterChange.emit(this.localFilter);
      this.filtersChange.emit({ global: '', columns: {} });
      this.emitDataStateChange();
    }
    this.cdr.markForCheck();
  }

  private commitFilter(filter: NgbCompositeFilterDescriptor, emit = true): void {
    this.localFilter = filter;
    this.syncLegacyFilters(filter);
    this.page = 1;
    this.invalidateFilteredCaches();
    this.syncFilterFormFromState();
    if (emit) {
      this.filterChange.emit(filter);
      this.filtersChange.emit({ global: this.currentGlobalFilterValue(), columns: { ...this.filters } });
      this.emitDataStateChange();
    }
    this.cdr.markForCheck();
  }

  private cloneComposite(filter: NgbCompositeFilterDescriptor | null | undefined): NgbCompositeFilterDescriptor {
    if (!filter) return { logic: 'and', filters: [] };
    return {
      logic: filter.logic,
      filters: filter.filters.map((item) => (ngbIsCompositeFilter(item) ? this.cloneComposite(item) : ({ ...item })))
    };
  }

  private syncLegacyFilters(filter: NgbCompositeFilterDescriptor): void {
    const next: Record<string, string> = {};
    filter.filters.forEach((item) => {
      if (ngbIsCompositeFilter(item)) return;
      next[item.field] = item.value == null ? '' : String(item.value);
    });
    this.filters = next;
  }

  currentGlobalFilterValue(): string {
    return this.globalFilter || this.globalFilterCtrl.value || '';
  }

  operatorControlName(field: string): string {
    return `${field}__operator`;
  }

  valueControlName(field: string): string {
    return `${field}__value`;
  }

  getFilterControl(field: string): AbstractControl | null {
    return this.filterForm.get(this.valueControlName(field));
  }

  applyRowFilter(col: ColumnDef<T>): void {
    const field = col.field as string;
    const operator = this.rowFilterOperator(col);
    const value = this.filterForm.get(this.valueControlName(field))?.value;
    this.upsertColumnFilter(field, operator, value);
  }

  private setFilterFormField(field: string, operator: NgbFilterOperator, value: any): void {
    this.syncingFilterForm = true;
    this.filterForm.get(this.operatorControlName(field))?.setValue(operator, { emitEvent: false });
    this.filterForm.get(this.valueControlName(field))?.setValue(value, { emitEvent: false });
    this.syncingFilterForm = false;
  }

  private syncFilterFormFromState(): void {
    this.resolvedColumns.filter((col) => col.filterable).forEach((col) => {
      const field = col.field as string;
      const descriptor = this.getColumnFilter(col.field as string);
      const currentOperator = this.filterForm.get(this.operatorControlName(field))?.value as NgbFilterOperator | '' | null | undefined;
      const preservedOperator = currentOperator || this.defaultFilterOperator(col);
      this.setFilterFormField(
        field,
        descriptor?.operator ?? preservedOperator,
        descriptor?.value ?? ''
      );
    });
  }

  private static readonly MENU_FILTER_CONDITION_COUNT = 2;

  private defaultMenuOperator(col: ColumnDef<T>): NgbFilterOperator {
    return this.defaultFilterOperator(col);
  }

  private defaultMenuCondition(col: ColumnDef<T>): NgbMenuFilterConditionDraft {
    return {
      operator: this.defaultMenuOperator(col),
      value: '',
    };
  }

  private defaultMenuDraftPair(col: ColumnDef<T>): NgbMenuFilterConditionDraft[] {
    return [this.defaultMenuCondition(col), this.defaultMenuCondition(col)];
  }

  private normalizeMenuDraftConditions(
    col: ColumnDef<T>,
    conditions: NgbMenuFilterConditionDraft[]
  ): NgbMenuFilterConditionDraft[] {
    const count = Datagrid.MENU_FILTER_CONDITION_COUNT;
    if (!conditions.length) return this.defaultMenuDraftPair(col);
    const normalized = conditions.slice(0, count).map((item) => ({ ...item }));
    while (normalized.length < count) {
      normalized.push(this.defaultMenuCondition(col));
    }
    return normalized;
  }

  private menuConditionsFromFieldFilter(field: string, col: ColumnDef<T>): NgbMenuFilterConditionDraft[] {
    const found = this.findFieldFilter(field);
    if (!found) return this.defaultMenuDraftPair(col);
    if (!ngbIsCompositeFilter(found)) {
      return this.normalizeMenuDraftConditions(col, [
        { operator: found.operator, value: found.value ?? '' },
      ]);
    }
    const direct = found.filters.filter((item): item is NgbFilterDescriptor => !ngbIsCompositeFilter(item));
    if (
      (found.logic === 'and' || found.logic === 'or') &&
      direct.length &&
      direct.every((item) => item.field === field)
    ) {
      this.menuDraftJoinLogic[field] = found.logic;
      return this.normalizeMenuDraftConditions(
        col,
        direct.map((item) => ({ operator: item.operator, value: item.value ?? '' }))
      );
    }
    return this.defaultMenuDraftPair(col);
  }

  ensureMenuJoinLogic(col: ColumnDef<T>): 'and' | 'or' {
    const field = col.field as string;
    if (!this.menuDraftJoinLogic[field]) {
      this.menuDraftJoinLogic[field] = 'and';
    }
    return this.menuDraftJoinLogic[field];
  }

  setMenuJoinLogic(col: ColumnDef<T>, logic: 'and' | 'or'): void {
    this.menuDraftJoinLogic[col.field as string] = logic;
    this.cdr.markForCheck();
  }

  menuFilterConditionIsValid(col: ColumnDef<T>, draft: NgbMenuFilterConditionDraft): boolean {
    if (!this.operatorRequiresValue(draft.operator)) return true;
    const value = draft.value;
    return value !== null && value !== undefined && value !== '';
  }

  canApplyMenuFilter(col: ColumnDef<T>): boolean {
    return this.ensureMenuDraftConditions(col).some((draft) => this.menuFilterConditionIsValid(col, draft));
  }

  canClearMenuFilter(col: ColumnDef<T>): boolean {
    return this.hasActiveColumnFilter(col.field as string);
  }

  ensureMenuDraftConditions(col: ColumnDef<T>): NgbMenuFilterConditionDraft[] {
    const field = col.field as string;
    const existing = this.menuDrafts[field];
    if (!existing?.length || existing.length !== Datagrid.MENU_FILTER_CONDITION_COUNT) {
      this.menuDrafts[field] = this.menuConditionsFromFieldFilter(field, col);
    }
    return this.menuDrafts[field];
  }

  /** First menu condition (header filter menus). */
  ensureMenuDraft(col: ColumnDef<T>): NgbMenuFilterConditionDraft {
    return this.ensureMenuDraftConditions(col)[0];
  }

  setMenuDraftOperator(col: ColumnDef<T>, operator: NgbFilterOperator, index = 0): void {
    this.ensureMenuDraftConditions(col)[index].operator = operator;
    this.openMenuOperatorField = null;
  }

  menuOperatorKey(field: string, index = 0): string {
    return `${field}:${index}`;
  }

  isMenuOperatorOpen(field: string, index = 0): boolean {
    return this.openMenuOperatorField === this.menuOperatorKey(field, index);
  }

  toggleMenuOperator(field: string, index = 0): void {
    const key = this.menuOperatorKey(field, index);
    this.openMenuOperatorField = this.openMenuOperatorField === key ? null : key;
  }

  get openFilterMenuColumn(): ColumnDef<T> | null {
    if (!this.openFilterMenuField) return null;
    return this.resolvedColumns.find((item) => item.field === this.openFilterMenuField) ?? null;
  }

  private closeFilterMenu(): void {
    this.openFilterMenuField = null;
    this.openFilterMenuAnchor = null;
    this.openMenuOperatorField = null;
  }

  private resolveFilterMenuAnchor(anchor?: HTMLElement | null): HTMLElement | null {
    if (anchor instanceof HTMLElement) return anchor;
    const native = (anchor as { nativeElement?: unknown } | null)?.nativeElement;
    return native instanceof HTMLElement ? native : null;
  }

  toggleFilterMenu(field: string, anchor?: HTMLElement | null): void {
    this.openFilterMenuField = this.openFilterMenuField === field ? null : field;
    if (this.openFilterMenuField !== field) {
      this.openMenuOperatorField = null;
      this.openFilterMenuAnchor = null;
    } else {
      this.openFilterMenuAnchor = this.resolveFilterMenuAnchor(anchor);
    }
    const col = this.resolvedColumns.find((item) => item.field === field);
    if (col && this.openFilterMenuField === field) {
      if (this.isMultiCheckboxMode(col)) {
        this.ensureMultiCheckboxDraft(col);
      } else {
        if (!this.hasActiveColumnFilter(field)) {
          delete this.menuDrafts[field];
          delete this.menuDraftJoinLogic[field];
        }
        this.ensureMenuDraftConditions(col);
      }
    }
    this.cdr.markForCheck();
  }

  applyMenuFilter(col: ColumnDef<T>): void {
    const field = col.field as string;
    const conditions = this.ensureMenuDraftConditions(col)
      .map((draft) => ({ ...draft }))
      .filter((draft) => {
        if (!this.operatorRequiresValue(draft.operator)) return true;
        const normalized = draft.value === undefined ? null : draft.value;
        return normalized !== null && normalized !== '';
      });

    const next = this.cloneComposite(this.filter ?? this.localFilter);
    const filters = this.withoutFieldFilters(next.filters, field);

    if (!conditions.length) {
      this.commitFilter({ ...next, filters });
    } else if (conditions.length === 1) {
      const draft = conditions[0];
      if (this.operatorRequiresValue(draft.operator)) {
        filters.push({ field, operator: draft.operator, value: draft.value, ignoreCase: true });
      } else {
        filters.push({ field, operator: draft.operator, ignoreCase: true });
      }
      this.commitFilter({ ...next, filters });
    } else {
      const joinLogic = this.ensureMenuJoinLogic(col);
      filters.push({
        logic: joinLogic,
        filters: conditions.map((draft) =>
          this.operatorRequiresValue(draft.operator)
            ? { field, operator: draft.operator, value: draft.value, ignoreCase: true }
            : { field, operator: draft.operator, ignoreCase: true }
        ),
      });
      this.commitFilter({ ...next, filters });
    }

    this.closeFilterMenu();
  }

  clearMenuFilter(col: ColumnDef<T>): void {
    const field = col.field as string;
    delete this.menuDrafts[field];
    delete this.menuDraftJoinLogic[field];
    this.clearColumnFilter(col.field as string);
    this.closeFilterMenu();
  }

  multiCheckboxOptions(col: ColumnDef<T>): Array<{ label: string; value: any }> {
    const seen = new Map<string, { label: string; value: any }>();
    for (const row of this.data ?? []) {
      const value = (row as any)?.[col.field];
      const key = this.multiCheckboxValueKey(value);
      if (!seen.has(key)) {
        seen.set(key, { label: this.multiCheckboxValueLabel(col, value), value });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true }));
  }

  multiCheckboxVisibleOptions(col: ColumnDef<T>): Array<{ label: string; value: any }> {
    const query = this.norm(this.multiCheckboxSearch[col.field as string]);
    const options = this.multiCheckboxOptions(col);
    if (!query) return options;
    return options.filter((option) => this.norm(option.label).includes(query));
  }

  multiCheckboxValueLabel(col: ColumnDef<T>, value: any): string {
    if (this.getColumnFilterType(col) === 'boolean') return this.booleanFilterOptionLabel(!!value);
    if (value === null || value === undefined || value === '') return '(Blank)';
    const option = col.options?.find((item) => item.value === value);
    return option?.label ?? String(value);
  }

  private multiCheckboxValueKey(value: any): string {
    return JSON.stringify(value);
  }

  ensureMultiCheckboxDraft(col: ColumnDef<T>): any[] {
    const field = col.field as string;
    if (!this.multiCheckboxDrafts[field]) {
      const active = this.multiCheckboxSelectedValues(col);
      this.multiCheckboxDrafts[field] = active ?? this.multiCheckboxOptions(col).map((option) => option.value);
    }
    return this.multiCheckboxDrafts[field];
  }

  multiCheckboxSelectedCount(col: ColumnDef<T>): number {
    return this.ensureMultiCheckboxDraft(col).length;
  }

  multiCheckboxTotalCount(col: ColumnDef<T>): number {
    return this.multiCheckboxOptions(col).length;
  }

  isMultiCheckboxChecked(col: ColumnDef<T>, value: any): boolean {
    const key = this.multiCheckboxValueKey(value);
    return this.ensureMultiCheckboxDraft(col).some((item) => this.multiCheckboxValueKey(item) === key);
  }

  toggleMultiCheckboxValue(col: ColumnDef<T>, value: any): void {
    const field = col.field as string;
    const selected = this.ensureMultiCheckboxDraft(col);
    const key = this.multiCheckboxValueKey(value);
    this.multiCheckboxDrafts[field] = selected.some((item) => this.multiCheckboxValueKey(item) === key)
      ? selected.filter((item) => this.multiCheckboxValueKey(item) !== key)
      : [...selected, value];
  }

  isMultiCheckboxAllSelected(col: ColumnDef<T>): boolean {
    return this.multiCheckboxSelectedCount(col) === this.multiCheckboxTotalCount(col);
  }

  toggleMultiCheckboxAll(col: ColumnDef<T>): void {
    const field = col.field as string;
    this.multiCheckboxDrafts[field] = this.isMultiCheckboxAllSelected(col)
      ? []
      : this.multiCheckboxOptions(col).map((option) => option.value);
  }

  multiCheckboxToggleLabel(col: ColumnDef<T>): string {
    return this.isMultiCheckboxAllSelected(col) ? 'Deselect All' : 'Select All';
  }

  isMultiCheckboxPartiallySelected(col: ColumnDef<T>): boolean {
    const selected = this.multiCheckboxSelectedCount(col);
    const total = this.multiCheckboxTotalCount(col);
    return selected > 0 && selected < total;
  }

  private multiCheckboxSelectedValues(col: ColumnDef<T>): any[] | null {
    const filter = this.findFieldFilter(col.field as string);
    if (!filter || !ngbIsCompositeFilter(filter)) return null;
    const directFilters = filter.filters.filter((item): item is NgbFilterDescriptor => !ngbIsCompositeFilter(item));
    if (
      filter.logic === 'and' &&
      directFilters.length === 2 &&
      directFilters.every((item) => item.field === col.field) &&
      directFilters.some((item) => item.operator === 'isnull') &&
      directFilters.some((item) => item.operator === 'isnotnull')
    ) {
      return [];
    }
    if (filter.logic !== 'or' || directFilters.some((item) => item.field !== col.field || item.operator !== 'eq')) {
      return null;
    }
    return directFilters.map((item) => item.value);
  }

  multiCheckboxFilterApplyLabel(): string {
    return this.multiCheckboxFilterOptions.applyLabel ?? this.labelTemplate('multiCheckboxApply');
  }

  multiCheckboxFilterCancelLabel(): string {
    return this.multiCheckboxFilterOptions.cancelLabel ?? this.labelTemplate('multiCheckboxCancel');
  }

  multiCheckboxFilterShowCancel(): boolean {
    return this.multiCheckboxFilterOptions.showCancel !== false;
  }

  cancelMultiCheckboxFilter(col: ColumnDef<T>): void {
    const field = col.field as string;
    delete this.multiCheckboxDrafts[field];
    delete this.multiCheckboxSearch[field];
    this.closeFilterMenu();
    this.cdr.markForCheck();
  }

  applyMultiCheckboxFilter(col: ColumnDef<T>): void {
    const field = col.field as string;
    const selectedValues = this.ensureMultiCheckboxDraft(col);
    const options = this.multiCheckboxOptions(col);
    const next = this.cloneComposite(this.filter ?? this.localFilter);
    const filters = this.withoutFieldFilters(next.filters, field);

    if (selectedValues.length === options.length) {
      this.commitFilter({ ...next, filters });
    } else if (selectedValues.length === 0) {
      filters.push({
        logic: 'and',
        filters: [
          { field, operator: 'isnull' },
          { field, operator: 'isnotnull' },
        ],
      });
      this.commitFilter({ ...next, filters });
    } else {
      filters.push({
        logic: 'or',
        filters: selectedValues.map((value) => ({ field, operator: 'eq' as const, value, ignoreCase: true })),
      });
      this.commitFilter({ ...next, filters });
    }

    this.closeFilterMenu();
  }

  filterContext(col: ColumnDef<T>, source: 'row' | 'menu'): FilterCtx<T> {
    const field = col.field as string;
    const descriptor = source === 'menu'
      ? (() => {
          const draft = this.ensureMenuDraft(col);
          return { field, operator: draft.operator, value: draft.value };
        })()
      : this.getColumnFilter(field);
    const currentFilter = () => this.cloneComposite(this.effectiveFilterDescriptor());
    const commitFromTemplate = (filter: NgbCompositeFilterDescriptor) => {
      this.commitFilter(this.cloneComposite(filter));
      if (source === 'menu') this.closeFilterMenu();
    };
    return {
      $implicit: this.getFilterControl(field),
      control: this.getFilterControl(field),
      col,
      field,
      descriptor,
      filter: currentFilter(),
      operators: this.getAllowedOperators(col),
      setOperator: (operator) => {
        if (source === 'menu') this.ensureMenuDraft(col).operator = operator;
        else {
          this.filterForm.get(this.operatorControlName(field))?.setValue(operator);
          this.applyRowFilter(col);
        }
      },
      setValue: (value) => {
        if (source === 'menu') this.ensureMenuDraft(col).value = value;
        else {
          this.filterForm.get(this.valueControlName(field))?.setValue(value);
          this.applyRowFilter(col);
        }
      },
      clear: () => source === 'menu' ? this.clearMenuFilter(col) : this.clearColumnFilter(field),
      filterChange: commitFromTemplate,
      setFieldFilter: (operator, value) => {
        commitFromTemplate(
          ngbSetFieldFilter(currentFilter(), field, operator, value, {
            requiresValue: (op) => this.operatorRequiresValue(op)
          })
        );
      }
    };
  }

  get sorted(): T[] {
    if (this.sortedDirty) {
      if (this.sort.active && !this.visibleColumns.some((col) => col.field === this.sort.active)) {
        this.sort = { active: null, direction: '' };
      }
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
      this.sortedCache = this.withStickyRowsFirst(base);
      this.sortedDirty = false;
    }
    return this.sortedCache;
  }
  // pagination (filled in next step)

  /** True when `[data]` is a server page and `[total]` is the full result count. */
  isServerBound(): boolean {
    const total = this.total;
    return total != null && Number.isFinite(total) && total >= 0 && total > this.sorted.length;
  }

  /** Row count for pager, range labels, and `aria-rowcount`. */
  recordTotal(): number {
    const total = this.total;
    if (total != null && Number.isFinite(total) && total >= 0) {
      return total;
    }
    if (this.shouldUseLocalDataOperations()) {
      return this.localDataOperationsResult(false).total;
    }
    return this.sorted.length;
  }

  /** Collection size passed to the built-in pager. */
  pagerCollectionSize(): number {
    return this.recordTotal();
  }

  get paged(): T[] {
    if (this.pagedDirty) {
      if (this.shouldUseLocalDataOperations()) {
        this.pagedCache = this.localDataOperationsResult(this.paginationActive).data;
        this.pagedDirty = false;
        return this.pagedCache;
      }
      if (!this.paginationActive || this.isServerBound()) {
        this.pagedCache = this.sorted;
      } else {
        const start = (this.page - 1) * this.pageSize;
        this.pagedCache = this.sorted.slice(start, start + this.pageSize);
      }
      this.pagedDirty = false;
    }
    return this.pagedCache;
  }

  private shouldUseLocalDataOperations(): boolean {
    if (!this.dataOperations) return false;
    const total = this.total;
    return !(total != null && Number.isFinite(total) && total >= 0 && total > (this.data?.length ?? 0));
  }

  private localDataOperationsResult(page: boolean) {
    const options = typeof this.dataOperations === 'object' ? this.dataOperations : {};
    return ngbApplyDataGridOperations(this.data, {
      ...options,
      state: this.dataState(),
      columns: options.columns ?? this.resolvedColumns,
      globalFilterFields: options.globalFilterFields ?? this.resolvedColumns.map((column) => column.field as string),
      page,
    });
  }

  // getters for template conditions / display
  get anyFilterable(): boolean {
    if (this.resolvedFilterMode() !== 'row') return false;
    return this.isFilteringEnabled() && !!this.visibleColumns?.some(c => c.filterable && this.isRowFilterVisible(c));
  }

  get startIndex(): number {
    const total = this.recordTotal();
    return total ? (this.page - 1) * this.pageSize + 1 : 0;
  }
  get endIndex(): number {
    return Math.min(this.page * this.pageSize, this.recordTotal());
  }

  get paginationActive(): boolean {
    return !!ngbResolvePageableSettings(this.pageable, {
      enablePagination: this.enablePagination,
      pageSizeOptions: this.pageSizeOptions,
    });
  }

  resolvedPageable(): NgbDatagridPageableSettings {
    return (
      ngbResolvePageableSettings(this.pageable, {
        enablePagination: this.enablePagination,
        pageSizeOptions: this.pageSizeOptions,
      }) ?? NGB_DATAGRID_DEFAULT_PAGEABLE
    );
  }

  pagerShowsAt(placement: NgbDatagridPagerPosition): boolean {
    if (!this.paginationActive) return false;
    const position = this.resolvedPageable().position ?? 'bottom';
    return position === placement || position === 'both';
  }

  showPagerInfo(): boolean {
    return this.resolvedPageable().info !== false;
  }

  showPagerPageSizes(): boolean {
    const pageSizes = this.resolvedPageable().pageSizes;
    return Array.isArray(pageSizes) && pageSizes.length > 0;
  }

  pagerButtonCount(): number {
    return this.resolvedPageable().buttonCount ?? 10;
  }

  pagerPreviousNext(): boolean {
    return this.resolvedPageable().previousNext !== false;
  }

  pagerType(): NgbDatagridPagerType {
    return this.resolvedPageable().type ?? 'numeric';
  }

  hasCustomPagerTemplate(): boolean {
    return !!this.pagerTpl;
  }

  pagerResponsive(): boolean {
    if (this.hasCustomPagerTemplate()) return false;
    return this.resolvedPageable().responsive !== false;
  }

  pagerContext(): PagerCtx<Datagrid<T>> & { $implicit: PagerCtx<Datagrid<T>> } {
    const total = this.recordTotal();
    const pageCount = Math.max(1, Math.ceil(total / Math.max(1, this.pageSize)));
    const ctx: PagerCtx<Datagrid<T>> = {
      grid: this,
      page: this.page,
      pageSize: this.pageSize,
      total,
      pageCount,
    };
    return { ...ctx, $implicit: ctx };
  }

  dataState(): NgbDataGridState {
    const sort = this.sort.active && this.sort.direction
      ? [{ field: this.sort.active, direction: this.sort.direction }]
      : [];
    return {
      page: this.page,
      pageIndex: Math.max(0, this.page - 1),
      skip: Math.max(0, (this.page - 1) * this.pageSize),
      pageSize: this.pageSize,
      sort,
      filter: this.cloneComposite(this.effectiveFilterDescriptor()),
      globalFilter: this.currentGlobalFilterValue(),
    };
  }

  private emitDataStateChange(): void {
    this.dataStateChange.emit(this.dataState());
  }

  private syncFromDataState(state: NgbDataGridState | null | undefined): void {
    if (!state) return;

    const pageSize = Number(state.pageSize);
    if (Number.isFinite(pageSize) && pageSize > 0) {
      this.pageSize = Math.max(1, Math.trunc(pageSize));
    }

    const page = Number(state.page);
    const pageIndex = Number(state.pageIndex);
    const skip = Number(state.skip);
    if (Number.isFinite(page) && page > 0) {
      this.page = Math.max(1, Math.trunc(page));
    } else if (Number.isFinite(pageIndex) && pageIndex >= 0) {
      this.page = Math.max(1, Math.trunc(pageIndex) + 1);
    } else if (Number.isFinite(skip) && skip >= 0) {
      this.page = Math.max(1, Math.floor(skip / Math.max(1, this.pageSize)) + 1);
    }

    const firstSort = state.sort?.[0];
    this.sort = firstSort?.field && firstSort.direction
      ? { active: firstSort.field as Extract<keyof T, string>, direction: firstSort.direction }
      : { active: null, direction: '' };

    if (state.filter !== undefined) {
      this.localFilter = this.cloneComposite(state.filter ?? { logic: 'and', filters: [] });
      this.syncLegacyFilters(this.localFilter);
    }

    if (state.globalFilter !== undefined) {
      this.globalFilter = state.globalFilter ?? '';
      this.globalFilterCtrl.setValue(this.globalFilter, { emitEvent: false });
    }

    this.invalidateFilteredCaches();
    this.syncFilterFormFromState();
  }

  /** Page-size options for the footer dropdown (includes [pageSize] when not listed in pageSizes). */
  get resolvedPageSizeOptions(): number[] {
    return ngbResolvePagerPageSizeOptions(this.resolvedPageable().pageSizes, this.pageSize);
  }

  get shouldEnableScroll(): boolean {
    return this.scrollable;
  }

  onBodyHorizontalScroll(): void {
    const left = this.bodyScroller?.nativeElement.scrollLeft ?? 0;
    if (this.headerScroller?.nativeElement) {
      this.headerScroller.nativeElement.scrollLeft = left;
    }
  }

  get isHeaderSticky(): boolean {
    return this.stickyHeaderEnabled && this.shouldEnableScroll;
  }

  get isFooterSticky(): boolean {
    return this.stickyFooterEnabled && this.shouldEnableScroll;
  }

  get detailColspan(): number {
    const actionCols = this.showActionsColumn() ? 1 : 0;
    const caretCol   = this.rowDetailTpl ? 1 : 0;
    const stickyCol  = this.stickyRowsEnabled ? 1 : 0;
    const selectionCol = this.showSelectionColumn() ? 1 : 0;
    return this.visibleColumns.length + actionCols + caretCol + stickyCol + selectionCol;
  }

  isColumnPinned(col: ColumnDef<T>): boolean {
    return this.columnPinnedSide(col) !== null;
  }

  columnPinnedSide(col: ColumnDef<T>): 'start' | 'end' | null {
    if (col.locked) return this.isRtl() ? 'end' : 'start';
    if (col.sticky === true || col.sticky === 'start') return 'start';
    if (col.sticky === 'end') return 'end';
    return null;
  }

  private columnOrderGroup(col: ColumnDef<T>): 'leading' | 'middle' | 'trailing' {
    if (col.locked) return 'leading';
    const side = this.columnPinnedSide(col);
    if (side === 'start') return 'leading';
    if (side === 'end') return 'trailing';
    return 'middle';
  }

  resolvedDir(): 'ltr' | 'rtl' | null {
    if (this.dir === 'ltr' || this.dir === 'rtl') return this.dir;
    return null;
  }

  isRtl(): boolean {
    const explicit = this.resolvedDir();
    if (explicit) return explicit === 'rtl';
    const host = this.hostEl?.nativeElement;
    if (!host) return false;
    const inheritedDir = host.closest('[dir]')?.getAttribute('dir') ?? host.getAttribute('dir');
    if (inheritedDir) return inheritedDir.toLowerCase() === 'rtl';
    return getComputedStyle(host).direction === 'rtl';
  }

  hasPinnedColumns(): boolean {
    return this.visibleColumns.some((col) => this.isColumnPinned(col));
  }

  shouldPinLeadingUtilityColumns(): boolean {
    return this.hasPinnedColumns();
  }

  utilityColumnWidth(kind: UtilityColumnKind): number {
    switch (kind) {
      case 'selection': return SELECTION_COL_WIDTH;
      case 'detail': return DETAIL_COL_WIDTH;
      case 'sticky-toggle': return STICKY_TOGGLE_COL_WIDTH;
      case 'actions': return ACTION_COL_WIDTH;
    }
  }

  resolvedEditMode(): NgbEditMode {
    return this.editMode;
  }

  isIncellEditMode(): boolean {
    return this.resolvedEditMode() === 'incell';
  }

  isExternalEditMode(): boolean {
    return this.resolvedEditMode() === 'external';
  }

  isToolbarEditMode(): boolean {
    return this.resolvedEditMode() === 'toolbar';
  }

  showEditingToolbar(): boolean {
    return this.isToolbarEditMode() && (this.enableAdd || this.enableEdit || this.enableDelete);
  }

  showRowEditAction(): boolean {
    return this.enableEdit && (this.resolvedEditMode() === 'inline' || this.isExternalEditMode());
  }

  showRowDeleteAction(): boolean {
    return this.enableDelete && !this.isToolbarEditMode();
  }

  showActionsColumn(): boolean {
    if (this.isIncellEditMode()) return false;
    return (
      (this.enableAdd && !this.isToolbarEditMode()) ||
      this.showRowEditAction() ||
      this.showRowDeleteAction()
    );
  }

  get externalEditableColumns(): ColumnDef<T>[] {
    const row = this.externalEditPagedIndex != null ? (this.paged[this.externalEditPagedIndex] as T) : ({} as T);
    return this.visibleColumns.filter((col) => this.isCellEditable(col, row, this.externalEditIsNew));
  }

  isCellInEditMode(pagedIndex: number, col: ColumnDef<T>): boolean {
    if (!this.enableEdit) return false;
    const row = this.paged[pagedIndex] as T;
    if (!this.isCellEditable(col, row, false)) return false;
    if (this.isIncellEditMode()) {
      return this.editingCell?.rowIndex === pagedIndex && this.editingCell?.field === col.field;
    }
    return this.editingIndex === pagedIndex;
  }

  onCellClick(ev: MouseEvent, pagedIndex: number, col: ColumnDef<T>): void {
    if (!this.isIncellEditMode() || !this.enableEdit) return;
    const row = this.paged[pagedIndex] as T;
    if (!this.isCellEditable(col, row, false)) return;
    const el = ev.target as HTMLElement;
    if (el.closest('button, a, input, select, textarea, label, .no-edit-trigger')) return;
    if (this.isCellInEditMode(pagedIndex, col)) return;
    if (this.editingCell) this.commitIncellEdit(false);
    this.startIncellEdit(pagedIndex, col.field as string);
  }

  onCellKeydown(ev: KeyboardEvent, pagedIndex: number, col: ColumnDef<T>, colIndex: number): void {
    if (!this.isIncellEditMode() || !this.isCellInEditMode(pagedIndex, col)) return;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      this.commitIncellEdit(true);
      return;
    }
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.cancelIncellEdit();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(ev.key)) return;
    ev.preventDefault();
    const row = this.paged[pagedIndex] as T;
    const editableCols = this.visibleColumns
      .map((c, i) => ({ col: c, i }))
      .filter(({ col: c }) => this.isCellEditable(c, row, false));
    const currentIdx = editableCols.findIndex(({ col: c }) => c.field === col.field);
    if (currentIdx < 0) return;

    const currentColField = col.field as string;
    const currentColIndex = currentIdx;

    let nextPagedIndex = pagedIndex;
    let nextColField = currentColField;

    if (ev.key === 'ArrowLeft') {
      nextColField = editableCols[Math.max(0, currentColIndex - 1)]?.col.field as string;
    } else if (ev.key === 'ArrowRight') {
      nextColField = editableCols[Math.min(editableCols.length - 1, currentColIndex + 1)]?.col.field as string;
    } else if (ev.key === 'ArrowUp') {
      nextPagedIndex = Math.max(0, pagedIndex - 1);
    } else if (ev.key === 'ArrowDown') {
      nextPagedIndex = Math.min(this.paged.length - 1, pagedIndex + 1);
    }

    if (nextPagedIndex === pagedIndex && nextColField === currentColField) return;

    if (!this.commitIncellEdit(false)) return;
    this.startIncellEdit(nextPagedIndex, nextColField);
  }

  startIncellEdit(pagedIndex: number, field: string): void {
    this.addingNew = false;
    this.editingIndex = pagedIndex;
    this.editingCell = { rowIndex: pagedIndex, field };
    this.editForm = this.buildFormFromRow(this.paged[pagedIndex] as any);
    this.saveAttemptedEdit = false;
    this.cdr.markForCheck();
    queueMicrotask(() => this.focusInlineEditor(field));
  }

  private focusInlineEditor(preferredField?: string): void {
    const root = this.hostEl?.nativeElement;
    const body = root?.querySelector('.grid-body') as HTMLElement | null;
    if (!body) return;
    if (preferredField) {
      const control = body.querySelector<HTMLElement>(`td.grid-cell--editing [formcontrolname="${CSS.escape(preferredField)}"]`);
      if (control) {
        control.focus?.();
        return;
      }
    }
    const first = body.querySelector<HTMLElement>('td.grid-cell--editing input, td.grid-cell--editing select, td.grid-cell--editing textarea');
    first?.focus?.();
  }

  commitIncellEdit(close = true): boolean {
    if (!this.editingCell || this.editingIndex == null || !this.editForm) return true;
    const { field } = this.editingCell;
    const control = this.editForm.get(field);
    control?.markAsTouched();
    control?.updateValueAndValidity();
    if (control?.invalid) return false;

    const pagedIndex = this.editingIndex;
    const di = this.dataIndexOf(this.paged[pagedIndex]);
    const original = this.data[di];
    const rowId = this.getRowId(di, original);
    const service = this.getEditService();
    const updated = service.assignValues(original, { ...(original as any), [field]: control?.value } as any);
    const next = service.update(this.data ?? [], updated, di, rowId);
    this.data = service.saveChanges(next, di, rowId, updated);
    this.invalidateDataCaches();
    this.rowSave.emit({ original, updated, index: di });

    if (close) {
      this.editingCell = null;
      this.editingIndex = null;
      this.editForm = this.fb.group({});
      this.saveAttemptedEdit = false;
    }
    this.cdr.markForCheck();
    return true;
  }

  cancelIncellEdit(): void {
    if (this.editingIndex == null) return;
    const di = this.dataIndexOf(this.paged[this.editingIndex]);
    const rowId = this.getRowId(di, this.data[di]);
    this.getEditService().cancelChanges(this.data ?? [], di, rowId);
    this.rowCancel.emit({ row: this.data[di], index: di });
    this.editingCell = null;
    this.editingIndex = null;
    this.editForm = this.fb.group({});
    this.saveAttemptedEdit = false;
    this.cdr.markForCheck();
  }

  getSingleSelectedPagedIndex(): number | null {
    const selected = this.paged
      .map((row, index) => ({ row, index }))
      .filter(({ row, index }) => this.isRowSelected(row, index));
    return selected.length === 1 ? selected[0].index : null;
  }

  editSelectedRow(): void {
    const index = this.getSingleSelectedPagedIndex();
    if (index == null) return;
    if (this.isExternalEditMode()) {
      this.openExternalEdit(index);
      return;
    }
    this.startEdit(index);
  }

  deleteSelectedRows(): void {
    const indices = this.paged
      .map((row, index) => (this.isRowSelected(row, index) ? index : -1))
      .filter((index) => index >= 0)
      .sort((a, b) => b - a);
    indices.forEach((index) => this.deleteRow(index));
  }

  openExternalEdit(pagedIndex: number): void {
    this.externalDialogOpener = (document.activeElement as HTMLElement) ?? null;
    this.externalDialogFocusedOnce = false;
    this.externalEditIsNew = false;
    this.externalEditPagedIndex = pagedIndex;
    this.externalForm = this.buildFormFromRow(this.paged[pagedIndex] as any);
    this.saveAttemptedExternal = false;
    this.externalEditOpen = true;
    this.cdr.markForCheck();
    queueMicrotask(() => this.focusExternalDialogFirstField());
  }

  openExternalAdd(): void {
    this.externalDialogOpener = (document.activeElement as HTMLElement) ?? null;
    this.externalDialogFocusedOnce = false;
    this.externalEditIsNew = true;
    this.externalEditPagedIndex = null;
    this.externalForm = this.buildFormFromRow();
    this.saveAttemptedExternal = false;
    this.externalEditOpen = true;
    const service = this.getEditService();
    const draft = service.assignValues({} as T, this.externalForm.value as any);
    this.addDraftRowId = Symbol('ngb-datagrid-new-row');
    service.create(this.data ?? [], draft, this.data.length, this.addDraftRowId);
    this.cdr.markForCheck();
    queueMicrotask(() => this.focusExternalDialogFirstField());
  }

  saveExternalEdit(): void {
    if (!this.externalEditOpen) return;
    this.saveAttemptedExternal = true;
    this.externalForm.markAllAsTouched();
    this.externalForm.updateValueAndValidity();
    if (this.externalForm.invalid) return;

    const service = this.getEditService();
    if (this.externalEditIsNew) {
      const newRow = service.assignValues({} as T, this.externalForm.value as any);
      const rowIndex = this.data.length;
      const rowId = this.addDraftRowId ?? this.getRowId(rowIndex, newRow);
      service.create(this.data ?? [], newRow, rowIndex, rowId);
      service.saveChanges(this.data ?? [], rowIndex, rowId, newRow);
      this.rowAdd.emit({ newRow });
    } else if (this.externalEditPagedIndex != null) {
      const pagedIndex = this.externalEditPagedIndex;
      const di = this.dataIndexOf(this.paged[pagedIndex]);
      const original = this.data[di];
      const rowId = this.getRowId(di, original);
      const updated = service.assignValues(original, this.externalForm.value as any);
      const next = service.update(this.data ?? [], updated, di, rowId);
      this.data = service.saveChanges(next, di, rowId, updated);
      this.invalidateDataCaches();
      this.rowSave.emit({ original, updated, index: di });
    }

    this.closeExternalEdit();
  }

  cancelExternalEdit(): void {
    if (!this.externalEditOpen) return;
    if (this.externalEditIsNew && this.addDraftRowId != null) {
      this.getEditService().cancelChanges(this.data ?? [], this.data.length, this.addDraftRowId);
    } else if (this.externalEditPagedIndex != null) {
      const di = this.dataIndexOf(this.paged[this.externalEditPagedIndex]);
      const rowId = this.getRowId(di, this.data[di]);
      this.getEditService().cancelChanges(this.data ?? [], di, rowId);
      this.rowCancel.emit({ row: this.data[di], index: di });
    }
    this.closeExternalEdit();
  }

  private closeExternalEdit(): void {
    this.externalEditOpen = false;
    this.externalEditIsNew = false;
    this.externalEditPagedIndex = null;
    this.externalForm = this.fb.group({});
    this.saveAttemptedExternal = false;
    this.cdr.markForCheck();
    const opener = this.externalDialogOpener;
    this.externalDialogOpener = null;
    this.externalDialogFocusedOnce = false;
    opener?.focus?.();
  }

  private focusExternalDialogFirstField(): void {
    if (!this.externalEditOpen || this.externalDialogFocusedOnce) return;
    const root = this.hostEl?.nativeElement;
    const dialog = root?.querySelector('.grid-external-editor__panel') as HTMLElement | null;
    if (!dialog) return;
    const focusable = dialog.querySelector<HTMLElement>('input, select, textarea, button:not([disabled])');
    focusable?.focus?.();
    this.externalDialogFocusedOnce = true;
  }

  utilityLeadingWidth(): number {
    let width = 0;
    if (!this.shouldPinLeadingUtilityColumns()) return width;
    if (this.showSelectionColumn()) width += this.utilityColumnWidth('selection');
    if (this.rowDetailTpl) width += this.utilityColumnWidth('detail');
    if (this.stickyRowsEnabled) width += this.utilityColumnWidth('sticky-toggle');
    return width;
  }

  columnWidth(col: ColumnDef<T>): number {
    const field = col.field as string;
    const override = this.columnWidthOverrides[field];
    if (override != null && override > 0) return override;
    return col.width ?? 0;
  }

  isColumnResizable(col: ColumnDef<T>): boolean {
    if (!this.resizable || this.isStackedLayout() || col.locked || col.resizable === false) return false;
    return this.columnWidth(col) > 0;
  }

  startColumnResize(event: MouseEvent, col: ColumnDef<T>): void {
    if (!this.isColumnResizable(col)) return;
    event.preventDefault();
    event.stopPropagation();
    this.resizeSession = {
      field: col.field as string,
      startX: event.clientX,
      startWidth: this.columnWidth(col),
    };
    document.body.classList.add('ngb-datagrid-column-resizing');
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.resizeSession) return;
    const col = this.resolvedColumns.find((item) => item.field === this.resizeSession!.field);
    if (!col) return;
    const rawDelta = event.clientX - this.resizeSession.startX;
    const delta = this.isRtl() ? -rawDelta : rawDelta;
    const next = this.clampColumnWidth(col, this.resizeSession.startWidth + delta);
    this.columnWidthOverrides[this.resizeSession.field] = next;
    this.syncResizableColgroups();
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    if (!this.resizeSession) return;
    this.resizeSession = null;
    document.body.classList.remove('ngb-datagrid-column-resizing');
    this.syncResizableColgroups();
    this.cdr.markForCheck();
  }

  private syncResizableColgroups(): void {
    if (!this.resizable || this.isStackedLayout()) return;
    NgbSyncColgroupDirective.syncExplicitWidths(this.colgroupSyncId);
  }

  autoFitColumnsToGrid(): void {
    if (this.isStackedLayout()) return;
    const cols = this.visibleColumns.filter((col) => this.columnWidth(col) > 0);
    if (!cols.length) return;

    const available = this.gridViewportWidth() - this.nonDataColumnWidth();
    if (available <= 0) return;

    const currentWidths = cols.map((col) => this.columnWidth(col));
    const currentTotal = currentWidths.reduce((sum, width) => sum + width, 0);
    if (currentTotal <= 0) return;

    const scaled = currentWidths.map((width) => (width / currentTotal) * available);
    const next = scaled.map((width, index) => this.clampColumnWidth(cols[index], width));
    let total = next.reduce((sum, width) => sum + width, 0);
    let remainder = available - total;
    let pass = 0;
    while (remainder !== 0 && pass < cols.length * 4) {
      const index = pass % cols.length;
      const col = cols[index];
      const step = remainder > 0 ? 1 : -1;
      const updated = this.clampColumnWidth(col, next[index] + step);
      if (updated !== next[index]) {
        total += updated - next[index];
        next[index] = updated;
        remainder = available - total;
      }
      pass++;
    }

    cols.forEach((col, index) => {
      this.columnWidthOverrides[col.field as string] = next[index];
    });
    this.syncResizableColgroups();
    this.cdr.markForCheck();
  }

  private clampColumnWidth(col: ColumnDef<T>, width: number): number {
    const min = col.minResizableWidth ?? 50;
    const max = col.maxResizableWidth;
    let next = Math.round(width);
    if (next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  }

  private gridViewportWidth(): number {
    const el =
      this.bodyScroller?.nativeElement ??
      (this.hostEl.nativeElement.querySelector('.table-wrapper') as HTMLElement | null);
    return el?.clientWidth ?? 0;
  }

  private nonDataColumnWidth(): number {
    return (
      this.utilityLeadingWidth() + (this.showActionsColumn() ? this.utilityColumnWidth('actions') : 0)
    );
  }

  private syncColumnWidthOverrides(resetFromColumns: boolean): void {
    const next: Record<string, number> = resetFromColumns ? {} : { ...this.columnWidthOverrides };
    for (const col of this.resolvedColumns) {
      const field = col.field as string;
      if (resetFromColumns || !(field in next)) {
        if (col.width != null && col.width > 0) next[field] = col.width;
      }
    }
    const fields = new Set(this.resolvedColumns.map((col) => col.field as string));
    for (const field of Object.keys(next)) {
      if (!fields.has(field)) delete next[field];
    }
    this.columnWidthOverrides = next;
  }

  get tablePixelWidth(): number | null {
    if (this.isStackedLayout()) return null;
    const columnWidths = this.visibleColumns.reduce((sum, col) => sum + this.columnWidth(col), 0);
    const utilityWidths =
      this.utilityLeadingWidth() +
      (this.showActionsColumn() ? this.utilityColumnWidth('actions') : 0);
    const total = columnWidths + utilityWidths;
    return total > 0 ? total : null;
  }

  utilityStickyOffset(kind: Exclude<UtilityColumnKind, 'actions'>): number | null {
    if (!this.shouldPinLeadingUtilityColumns()) return null;
    if (kind === 'selection') return 0;
    if (kind === 'detail') return this.showSelectionColumn() ? this.utilityColumnWidth('selection') : 0;
    let offset = 0;
    if (this.showSelectionColumn()) offset += this.utilityColumnWidth('selection');
    if (this.rowDetailTpl) offset += this.utilityColumnWidth('detail');
    return offset;
  }

  columnStartOffset(col: ColumnDef<T>): number | null {
    if (this.columnPinnedSide(col) !== 'start') return null;
    const preceding = this.visibleColumns
      .slice(0, this.visibleColumns.indexOf(col))
      .filter((item) => this.columnPinnedSide(item) === 'start')
      .reduce((sum, item) => sum + this.columnWidth(item), 0);
    return this.utilityLeadingWidth() + preceding;
  }

  columnEndOffset(col: ColumnDef<T>): number | null {
    if (this.columnPinnedSide(col) !== 'end') return null;
    const index = this.visibleColumns.indexOf(col);
    return this.visibleColumns
      .slice(index + 1)
      .filter((item) => this.columnPinnedSide(item) === 'end')
      .reduce((sum, item) => sum + this.columnWidth(item), 0);
  }

  columnPinnedClass(col: ColumnDef<T>): string | null {
    const side = this.columnPinnedSide(col);
    return side ? `column-pinned-${side}${col.locked ? ' column-locked' : ' column-sticky'}` : null;
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

  get densityMode(): 'comfortable' | 'compact' {
    return this.tableOptions?.density ?? 'comfortable';
  }

  isStackedLayout(): boolean {
    if (this.dataLayoutMode === 'stacked') return true;
    if (this.dataLayoutMode === 'tabular') return false;
    return !!this.tableOptions?.stacked;
  }

  isStackedCardsLayout(): boolean {
    return this.isStackedLayout() && (this.tableOptions?.stackedLayout ?? 'list') === 'cards';
  }

  stackedGroupFor(col: ColumnDef<T>): 'start' | 'center' | 'end' {
    return col.stackedGroup ?? 'start';
  }

  stackedColumnsInGroup(group: 'start' | 'center' | 'end'): ColumnDef<T>[] {
    return this.visibleColumns.filter((col) => this.stackedGroupFor(col) === group);
  }

  stackedCardGroups(): Array<'start' | 'center' | 'end'> {
    const order: Array<'start' | 'center' | 'end'> = ['start', 'center', 'end'];
    return order.filter((group) => this.stackedColumnsInGroup(group).length > 0);
  }

  visibleColumnIndex(col: ColumnDef<T>): number {
    return this.visibleColumns.findIndex((item) => item.field === col.field);
  }

  stackedCardColspan(): number {
    return Math.max(1, this.visibleColumns.length);
  }

  clearSorting(emit = true): void {
    this.sort = { active: null, direction: '' };
    this.page = 1;
    if (emit) {
      this.sortChange.emit({ active: null, direction: '' });
    }
    this.cdr.markForCheck();
  }

  setColumnHidden(field: string, hidden: boolean): void {
    const col = this.resolvedColumns.find((item) => item.field === field);
    if (!col) return;
    col.hidden = hidden;
    if (!this.declarativeColumns.length) {
      this.columns = [...this.columns];
    }
    this.cdr.markForCheck();
  }

  applyColumnVisibility(visibility: Record<string, boolean>): void {
    for (const col of this.resolvedColumns) {
      const field = col.field as string;
      if (visibility[field] !== undefined) {
        col.hidden = !visibility[field];
      }
    }
    if (!this.declarativeColumns.length) {
      this.columns = [...this.columns];
    }
    this.cdr.markForCheck();
  }

  get zebraStripesEnabled(): boolean {
    return !!this.tableOptions?.zebraStripes;
  }

  getSelectedCount(): number {
    return this.selectedRowIds.size;
  }

  hasSelectedRows(): boolean {
    return this.getSelectedCount() > 0;
  }

  hasSingleSelectedRow(): boolean {
    return this.getSelectedCount() === 1;
  }

  resolveHeaderClass(col: ColumnDef<T>): string | string[] | Record<string, boolean> | null {
    return col.headerClass ?? null;
  }

  resolveHeaderStyle(col: ColumnDef<T>): Record<string, string | number> | null {
    return col.headerStyle ?? null;
  }

  resolveCellClass(row: T, rowIndex: number, col: ColumnDef<T>): string | string[] | Record<string, boolean> | null {
    const cellClass = col.cellClass;
    if (typeof cellClass === 'function') return cellClass(row, rowIndex) ?? null;
    return cellClass ?? null;
  }

  resolveCellStyle(row: T, rowIndex: number, col: ColumnDef<T>): Record<string, string | number> | null {
    const cellStyle = col.cellStyle;
    if (typeof cellStyle === 'function') return cellStyle(row, rowIndex) ?? null;
    return cellStyle ?? null;
  }

  resolveRowClass(row: T, rowIndex: number): string | string[] | Record<string, boolean> | null {
    if (typeof this.rowClass === 'function') return this.rowClass(row, rowIndex) ?? null;
    return this.rowClass ?? null;
  }

  resolveRowStyle(row: T, rowIndex: number): Record<string, string | number> | null {
    if (typeof this.rowStyle === 'function') return this.rowStyle(row, rowIndex) ?? null;
    return this.rowStyle ?? null;
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

  headerTitle(col: ColumnDef<T>): string {
    const t = (col as any)?.title;
    return (t ?? this.headerText(col)) ?? '';
  }

  cellTitle(row: T, col: ColumnDef<T>): string {
    const def = (col as any)?.cellTitle;
    if (typeof def === 'function') return def(row) ?? '';
    if (typeof def === 'string') return def;
    const val = (row as any)?.[col.field];
    return val === undefined || val === null ? '' : String(val);
  }

  columnFilterAriaLabel(col: ColumnDef<T>): string {
    return ngbFormatDatagridLabel(this.labelTemplate('columnFilter'), {
      header: this.headerText(col),
    });
  }

  inputAriaLabel(col: ColumnDef<T>): string {
    return this.headerText(col);
  }

  reorderColumnAriaLabel(col: ColumnDef<T>): string {
    return ngbFormatDatagridLabel(this.labelTemplate('reorderColumn'), {
      header: this.headerText(col),
    });
  }

  resizeColumnAriaLabel(col: ColumnDef<T>): string {
    return ngbFormatDatagridLabel(this.labelTemplate('resizeColumn'), {
      header: this.headerText(col),
    });
  }

  openFilterMenuAriaLabel(col: ColumnDef<T>): string {
    return ngbFormatDatagridLabel(this.labelTemplate('openFilterMenu'), {
      header: this.headerText(col),
    });
  }

  clearFilterAriaLabel(col: ColumnDef<T>): string {
    return ngbFormatDatagridLabel(this.labelTemplate('clearFilter'), {
      header: this.headerText(col),
    });
  }

  filterOperatorAriaLabel(col: ColumnDef<T>): string {
    return ngbFormatDatagridLabel(this.labelTemplate('filterOperator'), {
      header: this.headerText(col),
    });
  }

  editRowAriaLabel(index: number): string {
    return ngbFormatDatagridLabel(this.labelTemplate('editRow'), { index: index + 1 });
  }

  deleteRowAriaLabel(index: number): string {
    return ngbFormatDatagridLabel(this.labelTemplate('deleteRow'), { index: index + 1 });
  }

  stickyRowToggleAriaLabel(): string {
    return this.labelTemplate('stickyRowToggle');
  }

  booleanDisplayLabel(value: boolean): string {
    return value ? this.labelTemplate('booleanYes') : this.labelTemplate('booleanNo');
  }

  emptyStateLabel(): string {
    return this.labelTemplate('emptyState');
  }

  paginationRangeLabel(): string {
    const total = this.recordTotal();
    const start = this.startIndex;
    const end = this.endIndex;
    const format = (n: number) => this.formatLocaleNumber(n);
    return ngbFormatDatagridLabel(this.labelTemplate('paginationRange'), {
      start: format(start),
      end: format(end),
      total: format(total),
    });
  }

  rowsPerPageLabel(): string {
    return this.labelTemplate('rowsPerPage');
  }

  ariaRowCount(): number {
    return this.recordTotal();
  }

  ariaColCount(): number {
    let count = this.visibleColumns.length;
    if (this.showSelectionColumn()) count += 1;
    if (this.rowDetailTpl) count += 1;
    if (this.stickyRowsEnabled) count += 1;
    if (this.showActionsColumn()) count += 1;
    return count;
  }

  isCellFocused(rowIndex: number, colIndex: number): boolean {
    return (
      this.keyboardNavigation &&
      this.focusedCell?.rowIndex === rowIndex &&
      this.focusedCell?.colIndex === colIndex
    );
  }

  cellTabIndex(rowIndex: number, colIndex: number): number | null {
    if (!this.keyboardNavigation || this.isStackedLayout()) return null;
    if (!this.focusedCell) {
      return rowIndex === 0 && colIndex === 0 ? 0 : -1;
    }
    return this.isCellFocused(rowIndex, colIndex) ? 0 : -1;
  }

  focusCell(rowIndex: number, colIndex: number): void {
    if (!this.keyboardNavigation) return;
    const maxRow = Math.max(0, this.paged.length - 1);
    const maxCol = Math.max(0, this.visibleColumns.length - 1);
    this.focusedCell = {
      rowIndex: Math.min(Math.max(0, rowIndex), maxRow),
      colIndex: Math.min(Math.max(0, colIndex), maxCol),
    };
    this.cdr.markForCheck();
    queueMicrotask(() => this.focusFocusedCellElement());
  }

  onDataCellFocus(rowIndex: number, colIndex: number): void {
    if (!this.keyboardNavigation) return;
    this.focusedCell = { rowIndex, colIndex };
  }

  onDataCellKeydown(
    ev: KeyboardEvent,
    rowIndex: number,
    colIndex: number,
    col: ColumnDef<T>
  ): void {
    if (!this.keyboardNavigation) return;
    if (this.isCellInEditMode(rowIndex, col)) {
      return;
    }

    const key = ev.key;
    if (key === ' ' && this.isSelectionEnabled() && !this.isCheckboxOnly()) {
      ev.preventDefault();
      this.toggleSelection(rowIndex, ev);
      return;
    }

    if (key === 'F3' && this.isRowFilterEnabledForColumn(col)) {
      ev.preventDefault();
      this.openRowFilterMenuForColumn(col, ev.target as HTMLElement);
      return;
    }

    if (key === 'F2' && this.isIncellEditMode() && this.enableEdit) {
      const row = this.paged[rowIndex] as T;
      if (this.isCellEditable(col, row, false)) {
        ev.preventDefault();
        this.startIncellEdit(rowIndex, col.field as string);
      }
      return;
    }

    if (key === 'Enter' && this.isIncellEditMode() && this.enableEdit) {
      const row = this.paged[rowIndex] as T;
      if (this.isCellEditable(col, row, false)) {
        ev.preventDefault();
        this.startIncellEdit(rowIndex, col.field as string);
      }
      return;
    }

    if (this.paginationActive && ev.altKey && (key === 'PageDown' || key === 'PageUp')) {
      ev.preventDefault();
      const totalPages = Math.max(1, Math.ceil(this.recordTotal() / this.pageSize));
      const nextPage = key === 'PageDown' ? Math.min(totalPages, this.page + 1) : Math.max(1, this.page - 1);
      if (nextPage !== this.page) {
        this.onPage(nextPage);
        this.announceStatus(this.paginationRangeLabel());
        this.focusCell(0, colIndex);
      }
      return;
    }

    let nextRow = rowIndex;
    let nextCol = colIndex;
    const colCount = this.visibleColumns.length;
    const rowCount = this.paged.length;

    if (key === 'ArrowRight') nextCol = Math.min(colCount - 1, colIndex + 1);
    else if (key === 'ArrowLeft') nextCol = Math.max(0, colIndex - 1);
    else if (key === 'ArrowDown') nextRow = Math.min(rowCount - 1, rowIndex + 1);
    else if (key === 'ArrowUp') nextRow = Math.max(0, rowIndex - 1);
    else if (key === 'Home' && ev.ctrlKey) {
      ev.preventDefault();
      nextRow = 0;
    } else if (key === 'End' && ev.ctrlKey) {
      ev.preventDefault();
      nextRow = Math.max(0, rowCount - 1);
    } else if (key === 'Home') {
      ev.preventDefault();
      nextCol = 0;
    } else if (key === 'End') {
      ev.preventDefault();
      nextCol = Math.max(0, colCount - 1);
    } else {
      return;
    }

    ev.preventDefault();
    this.focusCell(nextRow, nextCol);
  }

  private openRowFilterMenuForColumn(col: ColumnDef<T>, anchor: HTMLElement): void {
    if (!col.filterable) return;
    this.toggleRowFilterMenu(col.field as string, anchor);
  }

  private isRowFilterEnabledForColumn(col: ColumnDef<T>): boolean {
    return this.isFilteringEnabled() && !!col.filterable && this.filterMode === 'row';
  }

  private focusFocusedCellElement(): void {
    const cell = this.focusedCell;
    if (!cell) return;
    const root = this.hostEl?.nativeElement;
    const rows = root?.querySelectorAll('tbody tr.grid-data-row');
    const row = rows?.[cell.rowIndex] as HTMLElement | undefined;
    const el = row?.querySelector(`td[data-col-index="${cell.colIndex}"]`) as HTMLElement | null;
    el?.focus?.();
  }

  announceStatus(message: string): void {
    this.statusMessage = message;
    this.cdr.markForCheck();
  }

  private labelTemplate(key: keyof NgbDatagridLabels): string {
    const bag = this.labels?.[key];
    if (bag != null && bag !== '') return bag;
    return NGB_DATAGRID_DEFAULT_LABELS[key];
  }

  private formatLocaleNumber(value: number): string {
    try {
      return new Intl.NumberFormat(this.locale ?? undefined).format(value);
    } catch {
      return String(value);
    }
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
    if (this.labels?.sortBy) {
      return ngbFormatDatagridLabel(this.labelTemplate('sortBy'), { header, state });
    }
    return `Sort by ${header}. Current sort ${state}.`;
  }

  exportAriaLabel(kind: 'pdf'|'excel'): string {
    if (kind === 'pdf') {
      return this.exportPdfAriaLabel || this.labelTemplate('exportPdf');
    }
    return this.exportExcelAriaLabel || this.labelTemplate('exportExcel');
  }
  private withStickyRowsFirst(rows: T[]): T[] {
    if (!this.stickyRows || this.stickyRowIds.size === 0) return rows;
    const sticky: T[] = [];
    const rest: T[] = [];

    rows.forEach(r => {
      const di = this.dataIndexOf(r);
      const id = this.getRowId(di >= 0 ? di : 0, r);
      (this.stickyRowIds.has(id) ? sticky : rest).push(r);
    });

    return [...sticky, ...rest];
  }


  // Helpers to map from paged index → original data index
  // helper used above
  private dataIndexFromPaged(i: number): number {
    const row = this.paged[i];
    return this.dataIndexOf(row);
  }

  private rebuildFilterForm() {
    const group: Record<string, any> = {};
    for (const c of this.resolvedColumns) {
      if (!c.filterable) continue;
      const descriptor = this.getColumnFilter(c.field as string);
      group[this.operatorControlName(c.field as string)] = [descriptor?.operator ?? this.defaultFilterOperator(c)];
      group[this.valueControlName(c.field as string)] = [descriptor?.value ?? ''];
    }
    this.filterForm = this.fb.group(group);

    this.filterForm.valueChanges.subscribe(() => {
      if (this.syncingFilterForm) return;
    });
    this.globalFilterCtrl.valueChanges.subscribe((value) => {
      this.globalFilter = value;
      this.page = 1;
      this.filtersChange.emit({ global: value, columns: { ...this.filters } });
    });
  }

  @ContentChildren(NgbCellTemplate)   private cellTplQ!:   QueryList<NgbCellTemplate<T>>;
  @ContentChildren(NgbEditorTemplate) private editTplQ!:   QueryList<NgbEditorTemplate<T>>;
  @ContentChildren(NgbFilterTemplate) private filterTplQ!: QueryList<NgbFilterTemplate<T>>;
  @ContentChildren(NgbFilterMenuTemplate) private filterMenuTplQ!: QueryList<NgbFilterMenuTemplate<T>>;
  @ContentChildren(NgbGlobalFilterTemplate) private globalTplQ!: QueryList<NgbGlobalFilterTemplate>;
  @ContentChildren(NgbGridColumnDirective) private gridColumnQ!: QueryList<NgbGridColumnDirective<T>>;

  /** Internal lookup maps */
  public cellTpls:   Record<string, NgbCellTemplate<T>> = {};
  public editTpls:   Record<string, NgbEditorTemplate<T>> = {};
  public filterTpls: Record<string, NgbFilterTemplate<T>> = {};
  public filterMenuTpls: Record<string, NgbFilterMenuTemplate<T>> = {};
  public globalTpl:  NgbGlobalFilterTemplate | null = null;
  private warnedDeclarativeColumns = false;

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
      const cols = this.visibleColumns.map(c => ({ key: c.field, title: c.header }));
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
      this.invalidateColumnCaches();
      this.cellTpls   = this.toRecord(this.cellTplQ);
      this.editTpls   = this.toRecord(this.editTplQ);
      this.filterTpls = this.toRecord(this.filterTplQ);
      this.filterMenuTpls = this.toRecord(this.filterMenuTplQ);
      this.globalTpl  = this.globalTplQ?.first ?? null;
      this.syncColumnWidthOverrides(true);
      this.syncColumnOrder(true);
      this.validateColumnConfig();
      this.rebuildFilterForm();
      if (this.sort.active && !this.visibleColumns.some((col) => col.field === this.sort.active)) {
        this.sort = { active: null, direction: '' };
      }
    };
    rebuild();
    this.cellTplQ?.changes.subscribe(rebuild);
    this.editTplQ?.changes.subscribe(rebuild);
    this.filterTplQ?.changes.subscribe(rebuild);
    this.filterMenuTplQ?.changes.subscribe(rebuild);
    this.globalTplQ?.changes.subscribe(rebuild);
    this.gridColumnQ?.changes.subscribe(rebuild);
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['state']) {
      this.syncFromDataState(this.state);
    }
    if (ch['filter']) {
      this.localFilter = this.cloneComposite(this.filter);
      this.syncLegacyFilters(this.localFilter);
      this.invalidateFilteredCaches();
    }
    if (ch['columns']) {
      this.invalidateColumnCaches();
      this.syncColumnWidthOverrides(true);
      this.syncColumnOrder(true);
    }
    if (ch['data']) {
      this.invalidateDataCaches();
    }
    if (ch['columns'] || ch['filter']) {
      this.validateColumnConfig();
      if (this.sort.active && !this.visibleColumns.some((col) => col.field === this.sort.active)) {
        this.sort = { active: null, direction: '' };
      }
      this.rebuildFilterForm();
      this.syncFilterFormFromState();
    }
    if (ch['highlightedIndex']) this.updateHighlightCache();
    if (ch['editMode']) this.resetEditingState();
    if (ch['pageSize'] || ch['pageSizeOptions'] || ch['enablePagination'] || ch['pageable'] || ch['state'] || ch['dataOperations']) {
      const size = Math.max(1, Math.trunc(Number(this.pageSize) || 10));
      this.pageSize = size;
      this.invalidatePagedCache();
    }
    if (ch['data'] || ch['columns'] || ch['labels'] || ch['locale'] || ch['dir']) {
      this.cdr.markForCheck();
    }
  }

  private resetEditingState(): void {
    this.editingCell = null;
    this.editingIndex = null;
    this.editForm = this.fb.group({});
    this.saveAttemptedEdit = false;
    this.closeExternalEdit();
    this.cdr.markForCheck();
  }

  private getRowId(rowIndex: number, row: T): any {
    return this.trackBy ? this.trackBy(rowIndex, row) : rowIndex;
  }

  /** Apply selection ids and refresh checkbox UI (for programmatic / OnPush sync). */
  setSelectionIds(ids: Iterable<any>, options?: { emit?: boolean }): void {
    if (!this.isSelectionEnabled()) return;
    this.selectedRowIds.clear();
    for (const id of ids) {
      this.selectedRowIds.add(id);
    }
    if (options?.emit !== false) {
      this.selectionChange.emit({
        selected: this.data.filter((row, idx) => this.selectedRowIds.has(this.getRowId(idx, row))),
        lastAction: null,
      });
    }
    this.cdr.markForCheck();
    Promise.resolve().then(() => {
      this.cdr.detectChanges();
    });
  }

  private getEditService(): NgbDatagridEditService<T> {
    return this.editService ?? this.defaultEditService;
  }

  isCellEditable(col: ColumnDef<T>, row: T, isNew: boolean): boolean {
    if (typeof col.editable === 'function') return col.editable(row, isNew);
    return col.editable ?? true;
  }

  isRowReorderEnabled(): boolean {
    return this.rowReorderable &&
      !this.sort.active &&
      !this.hasActiveFilters() &&
      !this.addingNew &&
      this.editingIndex == null &&
      !this.stickyRowsEnabled;
  }

  hasActiveFilters(): boolean {
    return !!(this.currentGlobalFilterValue() || this.localFilter.filters.length > 0);
  }

  startAdd() {
    if (!this.enableAdd || this.addingNew) return;
    if (this.isExternalEditMode()) {
      this.openExternalAdd();
      return;
    }
    this.page = 1;
    this.editingIndex = null;
    this.editingCell = null;
    this.addingNew = true;
    this.addForm = this.buildFormFromRow(); // defaults
    this.saveAttemptedNew = false;

    // Register a draft row with the edit service so implementations can track "new" state.
    const service = this.getEditService();
    const draft = service.assignValues({} as T, this.addForm.value as any);
    this.addDraftRowId = Symbol('ngb-datagrid-new-row');
    service.create(this.data ?? [], draft, this.data.length, this.addDraftRowId);
    this.cdr.markForCheck();
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
    this.invalidateDataCaches();
    this.rowAdd.emit({ newRow });

    this.addingNew = false;
    this.addForm = this.fb.group({});;
    this.saveAttemptedNew = false;
    this.addDraftRowId = null;
    this.cdr.markForCheck();
  }

  cancelAdd() {
    if (this.addDraftRowId != null) {
      this.getEditService().cancelChanges(this.data ?? [], this.data.length, this.addDraftRowId);
    }
    this.addingNew = false;
    this.addForm = this.fb.group({});;
    this.saveAttemptedNew = false;
    this.addDraftRowId = null;
    this.cdr.markForCheck();
  }

  startEdit(i: number) {
    if (!this.enableEdit) return;
    if (this.isExternalEditMode()) {
      this.openExternalEdit(i);
      return;
    }
    this.addingNew = false;
    this.editingCell = null;
    this.editingIndex = i;
    const row = this.paged[i] as any;
    this.editForm = this.buildFormFromRow(this.paged[i] as any);
    this.saveAttemptedEdit = false;
    const di = this.dataIndexOf(row);
    const rowId = this.getRowId(di, this.data[di]);
    // Start tracking baseline for the row (service can snapshot original state).
    this.getEditService().update(this.data ?? [], this.data[di], di, rowId);
    this.rowEdit.emit({ row: this.data[di], index: di });
    this.cdr.markForCheck();
    queueMicrotask(() => this.focusInlineEditor());
  }

  saveEdit(i: number) {
    if (this.editingIndex !== i || !this.editForm) return;
    this.saveAttemptedEdit = true;
    this.editForm.markAllAsTouched();
    this.editForm.updateValueAndValidity();

    if (this.editForm.invalid) return;

    const di = this.dataIndexOf(this.paged[i]);
    const original = this.data[di];
    const rowId = this.getRowId(di, original);
    const service = this.getEditService();
    const updated = service.assignValues(original, this.editForm.value as any);
    const next = service.update(this.data ?? [], updated, di, rowId);
    this.data = service.saveChanges(next, di, rowId, updated);
    this.invalidateDataCaches();

    this.rowSave.emit({ original, updated, index: di });

    this.editingIndex = null;
    this.editForm = this.fb.group({});
    this.saveAttemptedEdit = false;
    this.cdr.markForCheck();
  }

  cancelEdit(i: number) {
    const di = this.dataIndexOf(this.paged[i]);
    const rowId = this.getRowId(di, this.data[di]);
    this.getEditService().cancelChanges(this.data ?? [], di, rowId);
    this.rowCancel.emit({ row: this.data[di], index: di });
    this.editingIndex = null;
    this.editForm = this.fb.group({});   // empty group
    this.saveAttemptedEdit = false;
    this.cdr.markForCheck();
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

  // Optional stable row identity for efficient rendering.
  trackRow = (index: number, row: T) => {
    const di = this.dataIndexOf(row);
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
    this.invalidateSortedCaches();
    this.sortChange.emit({ active: this.sort.active, direction: this.sort.direction });
    this.emitDataStateChange();
    const col = this.resolvedColumns.find((item) => item.field === field);
    if (col) {
      const state = this.sort.direction === 'asc' ? 'ascending' : this.sort.direction === 'desc' ? 'descending' : 'none';
      this.announceStatus(
        ngbFormatDatagridLabel(this.labelTemplate('sortBy'), {
          header: this.headerText(col),
          state,
        })
      );
    }
  }

  onGlobalFilterChange() {
    if (!this.isFilteringEnabled() || !this.enableGlobalFilter) return;
    this.globalFilterCtrl.setValue(this.globalFilter, { emitEvent: false });
    this.page = 1;
    this.invalidateFilteredCaches();
    this.filtersChange.emit({ global: this.globalFilter, columns: { ...this.filters } });
    this.emitDataStateChange();
  }

  onColumnFilterChange() {
    if (!this.isFilteringEnabled()) return;
    this.localFilter = this.legacyFilterDescriptor();
    this.page = 1;
    this.invalidateFilteredCaches();
    this.filterChange.emit(this.localFilter);
    this.filtersChange.emit({ global: this.globalFilter, columns: { ...this.filters } });
    this.emitDataStateChange();
    this.syncFilterFormFromState();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const insideMenu = !!target?.closest(
      '.grid-filter-menu-host, .grid-filter-operator, .grid-filter-operator-menu, .ngb-datagrid-floating-panel, .ngb-grid__filter-menu-overlay'
    );
    if (insideMenu) {
      return;
    }
    this.closeFilterMenu();
    this.openRowFilterField = null;
    this.openRowFilterOperatorAnchor = null;

    if (this.isIncellEditMode()) {
      // Clicking outside the grid commits a valid in-cell edit and keeps invalid edits open.
      if (!target?.closest('.ngb-grid')) {
        this.commitIncellEdit(true);
      }
    }
  }

  canCancelToolbarEdit(): boolean {
    return this.isToolbarEditMode() && (this.editingIndex != null || this.externalEditOpen);
  }

  isToolbarEditActive(): boolean {
    return this.isToolbarEditMode() && (this.addingNew || this.editingIndex != null || this.externalEditOpen);
  }

  isToolbarSaveDisabled(): boolean {
    if (!this.isToolbarEditActive()) return true;
    // External dialog validates before save; inline toolbar add/edit validate on save click.
    if (this.externalEditOpen) return !!this.externalForm?.invalid;
    return false;
  }

  saveToolbarEdit(): void {
    if (!this.isToolbarEditMode()) return;
    if (this.externalEditOpen) {
      this.saveExternalEdit();
      return;
    }
    if (this.addingNew) {
      this.saveAdd();
      return;
    }
    if (this.editingIndex != null) {
      this.saveEdit(this.editingIndex);
    }
  }

  cancelToolbarEdit(): void {
    if (!this.isToolbarEditMode()) return;
    if (this.externalEditOpen) {
      this.cancelExternalEdit();
      return;
    }
    if (this.addingNew) {
      this.cancelAdd();
      return;
    }
    if (this.editingIndex != null) {
      this.cancelEdit(this.editingIndex);
    }
  }

  private ariaUtilityColumns(): Exclude<UtilityColumnKind, 'actions'>[] {
    const cols: Exclude<UtilityColumnKind, 'actions'>[] = [];
    if (this.showSelectionColumn()) cols.push('selection');
    if (this.rowDetailTpl) cols.push('detail');
    if (this.stickyRowsEnabled) cols.push('sticky-toggle');
    return cols;
  }

  ariaColIndexForUtility(kind: Exclude<UtilityColumnKind, 'actions'>): number | null {
    const idx = this.ariaUtilityColumns().indexOf(kind);
    return idx >= 0 ? idx + 1 : null;
  }

  ariaColIndexForDataColumn(visibleColumnIndex: number): number {
    return this.ariaUtilityColumns().length + visibleColumnIndex + 1;
  }

  ariaColIndexForActions(): number {
    return this.ariaUtilityColumns().length + this.visibleColumns.length + 1;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeFilterMenu();
    this.openRowFilterField = null;
  }

  onPageChange(p: number) {
    this.page = p;
    this.invalidatePagedCache();
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
    this.emitDataStateChange();
  }

  onPageSizeChange() {
    this.page = 1;
    this.invalidatePagedCache();
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
    this.emitDataStateChange();
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
    if (this.isIncellEditMode() || this.isToolbarEditMode() || this.isExternalEditMode()) return;
    if (!this.editOnRowClick) return;
    if (this.addingNew || this.editingIndex === i) return;
    const el = ev.target as HTMLElement;
    if (el.closest('button, a, input, select, textarea, label, .no-edit-trigger')) return;
    this.startEdit(i);
  }

  onPage(p: number): void {
    if (p < 1) return;
    this.page = p;
    this.invalidatePagedCache();
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
    this.emitDataStateChange();
  }

  onPageSize(sz: number | string): void {
    const next = Math.max(1, Math.trunc(Number(sz)));
    this.pageSize = Number.isFinite(next) && next > 0 ? next : this.pageSize;
    this.page = 1; // reset to first page when size changes
    this.invalidatePagedCache();
    this.pageChange.emit({ page: this.page, pageSize: this.pageSize });
    this.emitDataStateChange();
  }

  onRowDrop(event: NgbDndDropEvent<T>): void {
    if (!this.isRowReorderEnabled()) return;
    if (!event.sameList || event.fromIndex === event.toIndex) return;

    const pageOffset = this.paginationActive ? (this.page - 1) * this.pageSize : 0;
    const fromIndex = pageOffset + event.fromIndex;
    const toIndex = pageOffset + event.toIndex;

    if (fromIndex < 0 || toIndex < 0 || fromIndex >= this.data.length || toIndex >= this.data.length) return;

    const next = this.data.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    this.data = next;
    this.invalidateDataCaches();
    this.rowReorder.emit({ row: moved, fromIndex, toIndex, data: next.slice() });
    this.cdr.markForCheck();
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
    const di = this.dataIndexOf(row);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    return this.stickyRowIds.has(id);
  }

  toggleStickyRow(pagedIndex: number): void {
    if (!this.stickyRows) return;
    const row = this.paged[pagedIndex];
    if (!row) return;
    const di = this.dataIndexOf(row);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    if (this.stickyRowIds.has(id)) this.stickyRowIds.delete(id);
    else this.stickyRowIds.add(id);
    this.invalidateSortedCaches();
  }

  stickyIcon(row: T, pagedIndex: number): string {
    return this.isRowSticky(row, pagedIndex) ? 'pin-angle-fill' : 'pin-fill';
  }

  stickyTop(row: T, pagedIndex: number): number | null {
    if (!this.isRowSticky(row, pagedIndex)) return null;
    let offset = 0;
    for (let idx = 0; idx < pagedIndex; idx++) {
      const candidate = this.paged[idx];
      if (!candidate || !this.isRowSticky(candidate, idx)) continue;
      offset += this.measuredStickyRowHeight(idx);
    }
    return offset;
  }

  private measuredStickyRowHeight(pagedIndex: number): number {
    const rows = this.bodyScroller?.nativeElement.querySelectorAll<HTMLTableRowElement>('tbody > tr.grid-data-row');
    const measured = rows?.[pagedIndex]?.offsetHeight ?? 0;
    return measured > 0 ? measured : this.stickyRowHeight;
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

  showSelectionColumn(): boolean {
    return this.isSelectionEnabled() && this.selectionBehavior !== 'row';
  }

  isCheckboxOnly(): boolean {
    return this.selectionBehavior === 'checkbox';
  }

  isSelectionDisabled(row: T, pagedIndex: number): boolean {
    if (!this.selectionDisabledFn) return false;
    const di = this.dataIndexOf(this.paged[pagedIndex]);
    return this.selectionDisabledFn(row, di >= 0 ? di : pagedIndex);
  }

  isRowSelected(row: T, pagedIndex: number): boolean {
    const di = this.dataIndexOf(this.paged[pagedIndex]);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    return this.selectedRowIds.has(id);
  }

  toggleSelection(pagedIndex: number, event?: Event): void {
    if (!this.isSelectionEnabled()) return;
    const row = this.paged[pagedIndex];
    if (!row || this.isSelectionDisabled(row, pagedIndex)) return;

    const di = this.dataIndexOf(row);
    const id = this.getRowId(di >= 0 ? di : pagedIndex, row);
    const currentlySelected = this.selectedRowIds.has(id);
    const isMulti = this.selectionMode === 'multiple';
    const desktop = this.selectionKeyMode === 'desktop';
    const shift = desktop && !!(event && 'shiftKey' in event && (event as any).shiftKey);
    const meta = desktop && !!(event && (('metaKey' in event && (event as any).metaKey) || ('ctrlKey' in event && (event as any).ctrlKey)));
    const fromCheckbox = !!(event?.target instanceof HTMLInputElement && event.target.type === 'checkbox');

    if (!isMulti) {
      this.selectedRowIds.clear();
      this.selectedRowIds.add(id);
      this.selectionAnchor = pagedIndex;
      this.emitSelection(row, di, true);
      this.cdr.markForCheck();
      return;
    }

    if (shift && this.selectionAnchor != null) {
      const start = Math.min(this.selectionAnchor, pagedIndex);
      const end = Math.max(this.selectionAnchor, pagedIndex);
      this.selectedRowIds.clear();
      for (let i = start; i <= end; i++) {
        const r = this.paged[i];
        if (!r || this.isSelectionDisabled(r, i)) continue;
        const rid = this.getRowId(this.dataIndexOf(r), r);
        this.selectedRowIds.add(rid);
      }
      this.emitSelection(row, di, true);
      this.cdr.markForCheck();
      return;
    }

    if (fromCheckbox || meta || !desktop) {
      if (currentlySelected) this.selectedRowIds.delete(id);
      else this.selectedRowIds.add(id);
    } else {
      this.selectedRowIds.clear();
      this.selectedRowIds.add(id);
    }

    this.selectionAnchor = pagedIndex;
    this.emitSelection(row, di, !currentlySelected || (!meta && desktop));
    this.cdr.markForCheck();
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
        const rid = this.getRowId(this.dataIndexOf(r), r);
        this.selectedRowIds.delete(rid);
      });
    } else {
      allSelectable.forEach((r, i) => {
        const rid = this.getRowId(this.dataIndexOf(r), r);
        this.selectedRowIds.add(rid);
      });
    }
    this.selectionChange.emit({
      selected: this.data.filter((r, idx) => this.selectedRowIds.has(this.getRowId(idx, r))),
      lastAction: null
    });
    this.cdr.markForCheck();
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
      ? (labels.unselectAll || this.labelTemplate('unselectAll'))
      : (labels.selectAll || this.labelTemplate('selectAll'));
  }

  rowSelectionLabel(index: number): string {
    const labels = this.selectionA11yLabels || {};
    const selected = this.isRowSelected(this.paged[index], index);
    if (selected) {
      return labels.unselectRow
        ? ngbFormatDatagridLabel(labels.unselectRow, { index: index + 1 })
        : ngbFormatDatagridLabel(this.labelTemplate('unselectRow'), { index: index + 1 });
    }
    return labels.selectRow
      ? ngbFormatDatagridLabel(labels.selectRow, { index: index + 1 })
      : ngbFormatDatagridLabel(this.labelTemplate('selectRow'), { index: index + 1 });
  }

  onRowSelect(ev: MouseEvent, pagedIndex: number) {
    if (!this.isSelectionEnabled() || this.isCheckboxOnly()) return;
    const target = ev.target as HTMLElement;
    if (target.closest('input, button, a, select, textarea,label')) return;
    this.toggleSelection(pagedIndex, ev);
  }

}
