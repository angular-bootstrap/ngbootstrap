import { afterNextRender, booleanAttribute, computed, DestroyRef, Directive, ElementRef, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { copyHistoryRow, sameHistoryRow } from './history-row';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbDataGridViewRestoreResult, NgbDataGridViewSnapshot, ngbCloneGridView, ngbSerializeGridView } from './grid-view';

export type NgbDataGridHistoryResult = NgbDataGridViewRestoreResult | {
  success: false;
  reason: 'empty-history' | 'not-ready' | 'invalid-state' | 'row-conflict' | 'validation';
  message: string;
};

type HistoryEntry = { kind: 'view'; snapshot: NgbDataGridViewSnapshot } | {
  kind: 'edit'; before: unknown; after: unknown; reference: unknown; index: number;
};

/** Opt-in history for configuration changes and saved edits to existing rows. */
@Directive({ selector: 'ngb-datagrid[ngbGridHistory]', standalone: true, exportAs: 'ngbGridHistory' })
export class NgbDataGridHistoryDirective {
  private readonly grid = inject(Datagrid);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Scoped shortcuts; editable fields retain native text undo. */
  @Input({ transform: booleanAttribute }) historyKeyboard = true;
  @Output() historyKeyboardResult = new EventEmitter<NgbDataGridHistoryResult>();
  private readonly destroyRef = inject(DestroyRef);
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private current?: NgbDataGridViewSnapshot;
  private replaying = false;
  private limit = 20;
  private readonly undoSize = signal(0);
  private readonly redoSize = signal(0);
  private readonly initialized = signal(false);
  private readonly errorMessage = signal('');
  readonly undoCount = this.undoSize.asReadonly();
  readonly redoCount = this.redoSize.asReadonly();
  readonly ready = this.initialized.asReadonly();
  readonly error = this.errorMessage.asReadonly();
  readonly canUndo = computed(() => this.undoSize() > 0);
  readonly canRedo = computed(() => this.redoSize() > 0);

  /** Maximum retained undo steps (1–1000); the current configuration is separate. */
  @Input()
  set historyLimit(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 1000) throw new Error('historyLimit must be an integer from 1 to 1000.');
    this.limit = value;
    this.past = this.past.slice(-value);
    this.future = this.future.slice(-value);
    this.syncCounts();
  }
  get historyLimit(): number { return this.limit; }

  constructor() {
    afterNextRender(() => {
      this.clear();
      const subscription = this.grid.viewChange.subscribe(view => {
        if (!this.replaying) this.recordSnapshot(view);
      });
      const edits = this.grid.rowSave.subscribe(event => {
        if (!this.replaying) this.recordEdit(event.original, event.updated, event.index);
      });
      // Inserts/deletes are outside edit history; old row references must not survive them.
      const added = this.grid.rowAdd.subscribe(() => this.clear());
      const deleted = this.grid.rowDelete.subscribe(() => this.clear());
      this.destroyRef.onDestroy(() => { subscription.unsubscribe(); edits.unsubscribe(); added.unsubscribe(); deleted.unsubscribe(); });
    });
  }

  /** Record application-driven input changes after Angular has applied those inputs. */
  record(): NgbDataGridHistoryResult {
    if (!this.ready()) return this.notReady();
    try { this.recordSnapshot(this.grid.captureView()); return { success: true, ignoredFields: [] }; }
    catch { return this.invalidState(); }
  }

  /** Discard both stacks and use the current configuration as a new baseline. */
  clear(): NgbDataGridHistoryResult {
    try {
      const current = this.grid.captureView();
      this.current = current;
      this.past = []; this.future = [];
      this.initialized.set(true); this.errorMessage.set(''); this.syncCounts();
      return { success: true, ignoredFields: [] };
    } catch { return this.invalidState(); }
  }

  undo(): NgbDataGridHistoryResult { return this.replay('undo'); }
  redo(): NgbDataGridHistoryResult { return this.replay('redo'); }

  @HostListener('keydown', ['$event'])
  onHistoryKeydown(event: KeyboardEvent): void {
    if (!this.historyKeyboard || !this.ready() || event.defaultPrevented || event.isComposing || event.repeat || event.altKey || !(event.ctrlKey || event.metaKey)) return;
    const target = event.target as HTMLElement | null;
    if (!target || target.closest('ngb-datagrid') !== this.element.nativeElement ||
      target.closest('input, textarea, select, [role="textbox"], [role="combobox"]') || target.isContentEditable ||
      target.closest('[contenteditable]:not([contenteditable="false"])')) return;
    const key = event.key.toLowerCase();
    const action = key === 'z' ? (event.shiftKey ? 'redo' : 'undo') : key === 'y' && event.ctrlKey && !event.metaKey && !event.shiftKey ? 'redo' : null;
    if (!action || !(action === 'undo' ? this.canUndo() : this.canRedo())) return;
    event.preventDefault();
    event.stopPropagation();
    this.historyKeyboardResult.emit(this[action]());
  }

  private recordSnapshot(view: NgbDataGridViewSnapshot): void {
    const next = ngbCloneGridView(view);
    if (this.current && ngbSerializeGridView(next) === ngbSerializeGridView(this.current)) return;
    if (this.current) this.past = [...this.past, { kind: 'view' as const, snapshot: this.current }].slice(-this.limit);
    this.current = next; this.future = [];
    this.initialized.set(true); this.errorMessage.set(''); this.syncCounts();
  }

  private replay(direction: 'undo' | 'redo'): NgbDataGridHistoryResult {
    if (!this.ready()) return this.notReady();
    const from = direction === 'undo' ? this.past : this.future;
    const to = direction === 'undo' ? this.future : this.past;
    const target = from[from.length - 1];
    if (!target) return { success: false, reason: 'empty-history', message: `Nothing to ${direction}.` };
    let before: NgbDataGridViewSnapshot;
    try { before = this.grid.captureView(); } catch { return this.invalidState(); }
    this.replaying = true;
    try {
      if (target.kind === 'edit') return this.replayEdit(target, direction, from, to);
      const result = this.grid.restoreView(target.snapshot);
      if (!result.success) { this.errorMessage.set(result.message); return result; }
      from.pop(); to.push({ kind: 'view', snapshot: before });
      if (to.length > this.limit) to.shift();
      // Schema reconciliation may change the requested snapshot; track what was actually applied.
      this.current = this.grid.captureView();
      this.errorMessage.set(''); this.syncCounts();
      return result;
    } catch { return this.invalidState(); } finally { this.replaying = false; }
  }

  private recordEdit(original: unknown, updated: unknown, index: number): void {
    try {
      const before = copyHistoryRow(original), after = copyHistoryRow(updated);
      const reference = this.grid.data[index];
      this.rebaseReferences(original, reference);
      if (sameHistoryRow(before, after)) return;
      this.past = [...this.past, { kind: 'edit' as const, before, after, reference, index }].slice(-this.limit);
      this.future = []; this.errorMessage.set(''); this.syncCounts();
    } catch {
      // Do not offer older commands across an edit that could not be recorded.
      this.past = []; this.future = []; this.syncCounts();
      this.errorMessage.set('The edit was saved, but history was cleared because this row contains unsupported values. Use plain objects, arrays, primitives and valid Dates.');
    }
  }

  private rebaseReferences(previous: unknown, next: unknown): void {
    for (const entry of [...this.past, ...this.future]) {
      if (entry.kind === 'edit' && entry.reference === previous) entry.reference = next;
    }
  }

  private replayEdit(entry: Extract<HistoryEntry, { kind: 'edit' }>, direction: 'undo' | 'redo', from: HistoryEntry[], to: HistoryEntry[]): NgbDataGridHistoryResult {
    const expected = direction === 'undo' ? entry.after : entry.before;
    const replacement = copyHistoryRow(direction === 'undo' ? entry.before : entry.after);
    let index = this.grid.data.indexOf(entry.reference);
    if (index < 0 && this.grid.trackBy) {
      const id = this.grid.trackBy(entry.index, expected);
      const matches = this.grid.data.map((row: unknown, i: number) => Object.is(this.grid.trackBy!(i, row), id) ? i : -1).filter((i: number) => i >= 0);
      if (matches.length === 1) index = matches[0];
    }
    if (index < 0 || !sameHistoryRow(copyHistoryRow(this.grid.data[index]), expected)) {
      const message = 'This row was removed or changed outside history. Reload or clear history before retrying.';
      this.errorMessage.set(message);
      return { success: false, reason: 'row-conflict', message };
    }
    const previous = this.grid.data[index];
    const result = this.grid.restoreHistoryRow(index, replacement, direction);
    if (!result.success) { this.errorMessage.set(result.message); return result; }
    this.rebaseReferences(entry.reference, this.grid.data[index]);
    this.rebaseReferences(previous, this.grid.data[index]);
    entry.reference = this.grid.data[index]; entry.index = index;
    from.pop(); to.push(entry); if (to.length > this.limit) to.shift();
    this.errorMessage.set(''); this.syncCounts();
    return result;
  }

  private syncCounts(): void { this.undoSize.set(this.past.length); this.redoSize.set(this.future.length); }
  private notReady(): NgbDataGridHistoryResult { return { success: false, reason: 'not-ready', message: 'Grid history is ready after the first browser render.' }; }
  private invalidState(): NgbDataGridHistoryResult {
    const message = 'Cannot record these grid settings. Use supported snapshot values, then clear or record history again.';
    this.errorMessage.set(message);
    return { success: false, reason: 'invalid-state', message };
  }
}
