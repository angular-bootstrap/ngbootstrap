import { DestroyRef, Directive, ElementRef, EventEmitter, HostListener, Input, Output, computed, inject, signal } from '@angular/core';
import { Datagrid } from '../datagrid/datagrid.component';
import { ColumnDef } from '../models/column-def';
import { copyHistoryRow, sameHistoryRow } from '../views/history-row';
import { NgbGridBatchCellError, NgbGridBatchController, NgbGridBatchResult, NgbGridBatchRowChange, NgbGridBatchValidator, NgbGridClipboardResult } from './batch-types';
import { NGB_GRID_PASTE_CELL_LIMIT, ngbParseGridClipboard, ngbSerializeGridClipboard } from './clipboard';

type Draft<T> = NgbGridBatchRowChange<T> & { fields: Set<string> };
const blockedFields = new Set(['__proto__', 'prototype', 'constructor']);

/** Draft-only clipboard editing. Apply commits once; application code owns persistence. */
@Directive({ selector: 'ngb-datagrid[ngbGridBatchEditing]', standalone: true, exportAs: 'ngbGridBatchEditing' })
export class NgbGridBatchEditingDirective<T extends object = Record<string, unknown>> implements NgbGridBatchController {
  private readonly grid = inject(Datagrid<T>);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private drafts = new Map<unknown, Draft<T>>();
  private readonly count = signal(0);
  private readonly issues = signal<readonly NgbGridBatchCellError[]>([]);
  private readonly running = signal(false);
  private readonly status = signal('');
  private errorIndex = new Map<unknown, Map<string, string>>();
  private stale = false;
  private committing = false;
  private generation = 0;
  private controller?: AbortController;
  readonly pendingCount = this.count.asReadonly();
  readonly validating = this.running.asReadonly();
  readonly errors = this.issues.asReadonly();
  readonly message = this.status.asReadonly();
  readonly canApply = computed(() => this.count() > 0 && !this.running());
  @Input() batchValidator?: NgbGridBatchValidator<T>;
  @Output() batchResult = new EventEmitter<NgbGridBatchResult>();

  constructor() {
    if (this.grid.batchEditor) throw new Error('Only one batch editor can attach to a grid.');
    this.grid.batchEditor = this;
    this.destroyRef.onDestroy(() => {
      this.generation++; this.controller?.abort();
      if (this.grid.batchEditor === this) this.grid.batchEditor = undefined;
    });
  }

  hasPending(): boolean { return this.count() > 0; }
  value(rowId: unknown, field: string, fallback: unknown): unknown {
    const draft = this.drafts.get(rowId);
    return draft?.fields.has(field) ? this.read(draft.updated, field) : fallback;
  }
  dirty(rowId: unknown, field: string): boolean { return this.drafts.get(rowId)?.fields.has(field) ?? false; }
  error(rowId: unknown, field: string): string { return this.errorIndex.get(rowId)?.get(field) ?? ''; }
  private setErrors(errors: readonly NgbGridBatchCellError[]): void {
    this.errorIndex.clear();
    for (const error of errors) {
      const fields = this.errorIndex.get(error.rowId) ?? new Map<string, string>();
      fields.set(error.field, [fields.get(error.field), error.message].filter(Boolean).join('; '));
      this.errorIndex.set(error.rowId, fields);
    }
    this.issues.set(errors);
  }
  private setMessage(message: string): void { this.status.set(message); this.grid.announceStatus(message); }

  onGridChange(): void {
    if (!this.hasPending() || this.committing) return;
    this.generation++; this.controller?.abort(); this.running.set(false); this.stale = true;
    this.setMessage('Grid data or configuration changed. Discard the pending batch and paste again.');
  }

  private read(row: T, field: string): unknown { return (row as Record<string, unknown>)[field]; }
  private fail(reason: Extract<NgbGridBatchResult, { success: false }>['reason'], message: string): Extract<NgbGridBatchResult, { success: false }> {
    this.setMessage(message); return { success: false, reason, message };
  }
  private allowed(): Extract<NgbGridBatchResult, { success: false }> | null {
    if (!this.grid.cellRangeEnabled() || this.grid.rowDetailTpl || this.grid.editService || !this.grid.enableEdit) return this.fail('unavailable', 'Enable editing and cellSelection="range" on an ungrouped grid using the default edit service. Detail, sticky, stacked and row-reordering modes are unsupported.');
    if (this.grid.editingIndex !== null || this.grid.editingCell || this.grid.addingNew || this.grid.externalEditOpen) return this.fail('busy', 'Save or cancel the active editor first.');
    if (!this.grid.trackBy) return this.fail('identity', 'Provide a unique stable string or number trackBy key for every row.');
    if (this.stale) return this.fail('conflict', 'Grid data or configuration changed. Discard the pending batch and paste again.');
    return null;
  }

  private identities(): Map<unknown, number> {
    const ids = new Map<unknown, number>();
    this.grid.data.forEach((row, index) => {
      const id = this.grid.trackBy!(index, row);
      if (!(typeof id === 'string' || typeof id === 'number' && Number.isFinite(id)) || ids.has(id)) throw new Error('trackBy keys must be unique finite numbers or strings.');
      ids.set(id, index);
    });
    return ids;
  }

  private selection(ids: Map<unknown, number>): { row: number; col: number; rows: number; cols: number } | null {
    const range = this.grid.cellRange;
    if (!range) return null;
    const rowIndex = (id: unknown) => this.grid.paged.indexOf(this.grid.data[ids.get(id) ?? -1]);
    const a = rowIndex(range.anchor.rowId), b = rowIndex(range.focus.rowId);
    const x = this.grid.visibleColumns.findIndex(c => c.field === range.anchor.field), y = this.grid.visibleColumns.findIndex(c => c.field === range.focus.field);
    return Math.min(a, b, x, y) < 0 ? null : { row: Math.min(a, b), col: Math.min(x, y), rows: Math.abs(a - b) + 1, cols: Math.abs(x - y) + 1 };
  }

  copySelection(): NgbGridClipboardResult {
    const blocked = this.allowed(); if (blocked) return blocked;
    try {
      const ids = this.identities(), range = this.selection(ids);
      if (!range) return this.fail('selection', 'Select a cell range first.');
      if (range.rows * range.cols > NGB_GRID_PASTE_CELL_LIMIT) return this.fail('limit', 'Selection exceeds 10000 cells.');
      const rows: string[][] = [];
      for (let r = 0; r < range.rows; r++) {
        const row = this.grid.paged[range.row + r];
        const id = this.grid.trackBy!(this.grid.data.indexOf(row), row);
        const detached = copyHistoryRow(this.drafts.get(id)?.updated ?? row);
        rows.push(this.grid.visibleColumns.slice(range.col, range.col + range.cols).map(col => {
          const value = this.read(detached, col.field);
          if (col.clipboardFormat) return String(col.clipboardFormat(copyHistoryRow(value), copyHistoryRow(detached)));
          if (value == null) return '';
          if (value instanceof Date) return value.toISOString();
          if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
          throw new Error('Provide clipboardFormat for non-primitive cell values.');
        }));
      }
      return { success: true, text: ngbSerializeGridClipboard(rows) };
    } catch (error) { return this.fail('clipboard', this.errorText(error)); }
  }

  stagePaste(text: string): NgbGridBatchResult {
    if (this.validating()) return this.fail('busy', 'Wait for validation or discard the batch first.');
    const blocked = this.allowed(); if (blocked) return blocked;
    let matrix: string[][];
    try { matrix = ngbParseGridClipboard(text); } catch (error) { return this.fail('parse', this.errorText(error)); }
    let ids: Map<unknown, number>;
    try { ids = this.identities(); } catch (error) { return this.fail('identity', this.errorText(error)); }
    const range = this.selection(ids);
    if (!range) return this.fail('selection', 'Select a cell range first.');
    if (range.row + matrix.length > this.grid.paged.length || range.col + matrix[0].length > this.grid.visibleColumns.length) return this.fail('selection', 'The pasted rectangle exceeds the current page or visible columns.');
    let next: Map<unknown, Draft<T>>;
    try { next = new Map([...this.drafts].map(([id, draft]) => [id, { ...draft, original: copyHistoryRow(draft.original), updated: copyHistoryRow(draft.updated), fields: new Set(draft.fields) }])); }
    catch (error) { return this.fail('parse', this.errorText(error)); }
    try {
      for (let r = 0; r < matrix.length; r++) {
        const source = this.grid.paged[range.row + r], index = this.grid.data.indexOf(source);
        const id = this.grid.trackBy!(index, source) as string | number;
        const draft = next.get(id) ?? { rowId: id, original: copyHistoryRow(source), updated: copyHistoryRow(source), fields: new Set<string>() };
        if (!sameHistoryRow(draft.original, source)) return this.fail('conflict', 'A row changed outside the batch. Discard and paste again.');
        for (let c = 0; c < matrix[r].length; c++) {
          const col = this.grid.visibleColumns[range.col + c], field = String(col.field);
          if (blockedFields.has(field) || !this.grid.isCellEditable(col, copyHistoryRow(source), false)) return this.fail('protected', `Column ${col.header} is not editable for this row.`);
          const value = this.parse(matrix[r][c], col, draft.updated);
          Object.defineProperty(draft.updated, field, { value: copyHistoryRow(value), enumerable: true, writable: true, configurable: true });
          if (sameHistoryRow(this.read(draft.original, field), value)) draft.fields.delete(field); else draft.fields.add(field);
        }
        if (!Object.is(this.grid.trackBy!(index, draft.updated), id)) return this.fail('identity', 'Pasting cannot change a row identity.');
        if (draft.fields.size) next.set(id, draft); else next.delete(id);
      }
    } catch (error) { return this.fail('parse', this.errorText(error)); }
    const count = [...next.values()].reduce((n, d) => n + d.fields.size, 0);
    if (count > NGB_GRID_PASTE_CELL_LIMIT) return this.fail('limit', 'The pending batch exceeds 10000 changed cells.');
    this.drafts = next; this.count.set(count);
    try { this.setErrors(this.validateRows()); }
    catch (error) { this.grid.refreshBatchState(); return this.fail('validation', this.errorText(error)); }
    this.grid.refreshBatchState();
    if (this.errors().length) return this.fail('validation', 'Drafts retained. Correct invalid cells before applying.');
    this.setMessage(`${count} cell changes staged. Apply or discard the batch.`);
    return { success: true, changedCells: count };
  }

  private parse(text: string, col: ColumnDef<T>, row: T): unknown {
    if (col.clipboardParse) return col.clipboardParse(text, copyHistoryRow(row));
    if (col.type === 'number') {
      if (!text.trim()) return null;
      if (!/^-?\d+(\.\d+)?$/.test(text.trim()) || !Number.isFinite(Number(text))) throw new Error(`${col.header}: enter a finite number.`);
      return Number(text);
    }
    if (col.type === 'boolean') {
      if (/^(true|1)$/i.test(text.trim())) return true;
      if (/^(false|0)$/i.test(text.trim())) return false;
      throw new Error(`${col.header}: use true or false.`);
    }
    if (col.type === 'date') {
      if (!text.trim()) return null;
      const trimmed = text.trim();
      if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/.test(trimmed)) throw new Error(`${col.header}: use an ISO date or UTC timestamp.`);
      const date = new Date(trimmed);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed.slice(0, 10)) throw new Error(`${col.header}: invalid date.`);
      return this.read(row, col.field) instanceof Date ? date : trimmed;
    }
    if (col.type === 'select') {
      const options = (col.options ?? []).filter(o => String(o.value) === text);
      if (options.length !== 1) throw new Error(`${col.header}: value must match one option.`);
      return copyHistoryRow(options[0].value);
    }
    return text;
  }

  private validateRows(): NgbGridBatchCellError[] {
    const errors: NgbGridBatchCellError[] = [];
    for (const draft of this.drafts.values()) errors.push(...this.grid.validateBatchRow(copyHistoryRow(draft.updated), draft.rowId));
    return errors;
  }
  private checkConflicts(): NgbGridBatchResult | null {
    const blocked = this.allowed(); if (blocked) return blocked;
    let ids: Map<unknown, number>;
    try { ids = this.identities(); } catch (error) { return this.fail('identity', this.errorText(error)); }
    for (const d of this.drafts.values()) {
      const index = ids.get(d.rowId), row = index === undefined ? undefined : this.grid.data[index];
      if (!row || !sameHistoryRow(copyHistoryRow(row), d.original)) return this.fail('conflict', 'A draft row changed or was removed. Discard and reload before trying again.');
      if (!Object.is(this.grid.trackBy!(index!, d.updated), d.rowId)) return this.fail('identity', 'Row identity changed.');
      for (const field of d.fields) {
        const col = this.grid.visibleColumns.find(c => c.field === field);
        if (!col || !this.grid.isCellEditable(col, copyHistoryRow(row), false) || !this.grid.isCellEditable(col, copyHistoryRow(d.updated), false)) return this.fail('protected', `Column ${field} is no longer editable.`);
      }
    }
    return null;
  }

  applyBatch(): Promise<NgbGridBatchResult> { return this.commitBatch(); }

  /** Internal history bridge. Replay uses the same validation and atomic commit path. */
  async restoreBatch(changes: NgbGridBatchRowChange<unknown>[], action: 'undo' | 'redo'): Promise<NgbGridBatchResult> {
    if (this.hasPending() || this.validating()) return this.fail('busy', 'Apply or discard pending changes first.');
    const blocked = this.allowed(); if (blocked) return blocked;
    try {
      const next = new Map<unknown, Draft<T>>();
      for (const change of changes) {
        const original = copyHistoryRow(change.original) as T, updated = copyHistoryRow(change.updated) as T;
        const fields = new Set([...Object.keys(original), ...Object.keys(updated)].filter(field => !sameHistoryRow(this.read(original, field), this.read(updated, field))));
        next.set(change.rowId, { rowId: change.rowId, original, updated, fields });
      }
      this.drafts = next; this.count.set([...next.values()].reduce((n, d) => n + d.fields.size, 0));
      const result = await this.commitBatch(action);
      // A failed replay stays in history; it must not leave hidden replay drafts behind.
      if (!result.success && this.drafts === next) {
        this.drafts.clear(); this.count.set(0); this.setErrors([]); this.stale = false;
        this.grid.refreshBatchState();
      }
      return result;
    } catch (error) { return this.fail('validation', this.errorText(error)); }
  }

  private async commitBatch(historyAction?: 'undo' | 'redo'): Promise<NgbGridBatchResult> {
    if (this.validating()) return this.fail('busy', 'Validation is already running.');
    if (!this.hasPending()) return this.fail('empty', 'There are no pending changes.');
    const generation = ++this.generation;
    this.controller?.abort(); const controller = new AbortController(); this.controller = controller;
    try {
      const conflict = this.checkConflicts(); if (conflict) return conflict;
      const changes = this.changes();
      this.running.set(true);
      const builtin = this.validateRows();
      const custom = this.batchValidator && !builtin.length ? await this.batchValidator(copyHistoryRow(changes), controller.signal) : [];
      if (generation !== this.generation || controller.signal.aborted) return { success: false, reason: 'cancelled', message: 'Validation cancelled; no rows changed.' };
      const conflictAfter = this.checkConflicts(); if (conflictAfter) return conflictAfter;
      const errors = [...this.validateRows(), ...copyHistoryRow(custom)];
      this.setErrors(errors); this.grid.refreshBatchState();
      if (errors.length) return this.fail('validation', 'Drafts retained. Correct invalid cells before applying.');
      const ids = this.identities(), next = this.grid.data.slice(), count = this.count();
      for (const d of this.drafts.values()) next[ids.get(d.rowId)!] = copyHistoryRow(d.updated);
      this.committing = true;
      try { this.grid.data = next; } finally { this.committing = false; }
      this.drafts.clear(); this.count.set(0); this.setErrors([]); this.stale = false;
      this.grid.refreshBatchState();
      this.grid.batchSave.emit({ changes, ...(historyAction ? { historyAction } : {}) });
      this.setMessage(`${count} cell changes applied.`);
      return { success: true, changedCells: count };
    } catch (error) {
      if (generation !== this.generation) return { success: false, reason: 'cancelled', message: 'Validation cancelled; no rows changed.' };
      return this.fail('validation', this.errorText(error));
    } finally { if (generation === this.generation) this.running.set(false); }
  }

  private changes(): NgbGridBatchRowChange<T>[] {
    return [...this.drafts.values()].map(d => ({ rowId: d.rowId, original: copyHistoryRow(d.original), updated: copyHistoryRow(d.updated) }));
  }
  discardBatch(): void {
    this.generation++; this.controller?.abort(); this.running.set(false);
    this.drafts.clear(); this.count.set(0); this.setErrors([]); this.stale = false;
    this.setMessage('Pending changes discarded.'); this.grid.refreshBatchState();
  }
  private errorText(error: unknown): string { return error instanceof Error ? error.message : 'The batch could not be processed.'; }
  private acceptsEvent(event: ClipboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    return !event.defaultPrevented && !!target && target.closest('ngb-datagrid') === this.host.nativeElement && !target.closest('input, textarea, select, [contenteditable], [role="textbox"]');
  }
  @HostListener('copy', ['$event']) onCopy(event: ClipboardEvent): void {
    if (!this.acceptsEvent(event)) return;
    const result = this.copySelection();
    if (!result.success) { this.batchResult.emit(result); return; }
    if (!event.clipboardData) { this.batchResult.emit(this.fail('clipboard', 'Clipboard access is unavailable. Use copySelection().text with an application copy control.')); return; }
    try { event.clipboardData.setData('text/plain', result.text); event.preventDefault(); }
    catch { this.batchResult.emit(this.fail('clipboard', 'Clipboard write was denied. Use the application copy fallback.')); }
  }
  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent): void {
    if (!this.acceptsEvent(event)) return;
    if (!event.clipboardData) { this.batchResult.emit(this.fail('clipboard', 'Clipboard access is unavailable. Use stagePaste(text) with an application text input.')); return; }
    event.preventDefault();
    if (event.clipboardData.types && !Array.from(event.clipboardData.types).includes('text/plain')) {
      this.batchResult.emit(this.fail('clipboard', 'Paste plain text or use the application paste fallback.')); return;
    }
    try { this.batchResult.emit(this.stagePaste(event.clipboardData.getData('text/plain'))); }
    catch { this.batchResult.emit(this.fail('clipboard', 'Clipboard read was denied. Use the application paste fallback.')); }
  }
}
