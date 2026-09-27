import type { NgbDatagridRowId } from '../services/editing.service';

/** Address on the current loaded page; trackBy supplies a stable row identity. */
export interface NgbGridCellAddress {
  rowId: NgbDatagridRowId;
  field: string;
}

/** One rectangular range in visible-column and current-page order. */
export interface NgbGridCellRange {
  anchor: NgbGridCellAddress;
  focus: NgbGridCellAddress;
}
