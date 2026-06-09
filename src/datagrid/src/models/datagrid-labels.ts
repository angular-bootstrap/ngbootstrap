/** Localizable strings for built-in datagrid UI (pagination, filters, actions, a11y). */
export interface NgbDatagridLabels {
  paginationRange?: string;
  rowsPerPage?: string;
  emptyState?: string;
  booleanYes?: string;
  booleanNo?: string;
  selectAll?: string;
  unselectAll?: string;
  selectRow?: string;
  unselectRow?: string;
  globalFilter?: string;
  expandRow?: string;
  collapseRow?: string;
  exportPdf?: string;
  exportExcel?: string;
  stickyRowToggle?: string;
  editRow?: string;
  deleteRow?: string;
  reorderColumn?: string;
  resizeColumn?: string;
  openFilterMenu?: string;
  clearFilter?: string;
  filterOperator?: string;
  columnFilter?: string;
  sortBy?: string;
  stickyBadge?: string;
  addRow?: string;
  addRowButton?: string;
  save?: string;
  cancel?: string;
  edit?: string;
  delete?: string;
  multiCheckboxApply?: string;
  multiCheckboxCancel?: string;
  combineConditions?: string;
  searchFilterValues?: string;
}

export const NGB_DATAGRID_DEFAULT_LABELS: Required<NgbDatagridLabels> = {
  paginationRange: '{start}–{end} of {total}',
  rowsPerPage: 'Rows per page',
  emptyState: 'No records to display.',
  booleanYes: 'Yes',
  booleanNo: 'No',
  selectAll: 'Select all rows',
  unselectAll: 'Unselect all rows',
  selectRow: 'Select row {index}',
  unselectRow: 'Unselect row {index}',
  globalFilter: 'Search all columns',
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  exportPdf: 'Export to PDF',
  exportExcel: 'Export to Excel',
  stickyRowToggle: 'Toggle sticky row',
  editRow: 'Edit row {index}',
  deleteRow: 'Delete row {index}',
  reorderColumn: 'Reorder {header}',
  resizeColumn: 'Resize {header}',
  openFilterMenu: 'Open filter menu for {header}',
  clearFilter: 'Clear filter for {header}',
  filterOperator: 'Filter operator for {header}',
  columnFilter: '{header} filter',
  sortBy: 'Sort by {header}. Current sort {state}.',
  stickyBadge: 'STICKY',
  addRow: 'Add row',
  addRowButton: '+ Add',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  multiCheckboxApply: 'OK',
  multiCheckboxCancel: 'Cancel',
  combineConditions: 'Combine conditions with',
  searchFilterValues: 'Search values for {header}',
};

/** Documented keyboard shortcuts when [keyboardNavigation] is enabled. */
export const NGB_DATAGRID_KEYBOARD_SHORTCUTS = {
  moveCell: 'Arrow keys — move focus between data cells',
  firstLastColumn: 'Home / End — first or last column in the row',
  firstLastRow: 'Ctrl+Home / Ctrl+End — first or last row on the page',
  sortColumn: 'Enter on focused sortable header — cycle sort',
  toggleSelection: 'Space on a focused row — toggle row selection (when enabled)',
  pagePrevNext: 'Alt+Page Up / Alt+Page Down — previous or next page (when paginated)',
  openFilter: 'F3 on a focused column — open row filter operator menu (row filter mode)',
  cancelOverlay: 'Escape — close filter menus and cancel in-cell edit',
  commitIncell: 'Enter — commit in-cell edit; Arrow keys move between editable cells while editing',
} as const;

export type NgbDatagridTextDirection = 'ltr' | 'rtl' | 'auto';

export function ngbFormatDatagridLabel(
  template: string,
  tokens: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = tokens[key];
    return value === undefined || value === null ? '' : String(value);
  });
}
