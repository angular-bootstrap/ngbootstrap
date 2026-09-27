import type { NgbGridCellAddress } from '../models/cell-range';

export interface NgbGridBatchCellError extends NgbGridCellAddress { message: string; }
export interface NgbGridBatchRowChange<T> { rowId: string | number; original: T; updated: T; }
export interface NgbGridBatchSaveEvent<T> { changes: NgbGridBatchRowChange<T>[]; historyAction?: 'undo' | 'redo'; }
export type NgbGridBatchResult = { success: true; changedCells: number } | {
  success: false;
  reason: 'unavailable' | 'selection' | 'identity' | 'limit' | 'parse' | 'protected' | 'validation' | 'conflict' | 'cancelled' | 'empty' | 'busy' | 'clipboard';
  message: string;
};
export type NgbGridClipboardResult = { success: true; text: string } | Extract<NgbGridBatchResult, { success: false }>;
export type NgbGridBatchValidator<T> = (changes: readonly NgbGridBatchRowChange<T>[], signal: AbortSignal) =>
  readonly NgbGridBatchCellError[] | Promise<readonly NgbGridBatchCellError[]>;

/** Internal bridge between the host grid and its opt-in batch directive. */
export interface NgbGridBatchController {
  restoreBatch(changes: NgbGridBatchRowChange<unknown>[], action: 'undo' | 'redo'): Promise<NgbGridBatchResult>;
  hasPending(): boolean;
  value(rowId: unknown, field: string, fallback: unknown): unknown;
  dirty(rowId: unknown, field: string): boolean;
  error(rowId: unknown, field: string): string;
  onGridChange(): void;
}
